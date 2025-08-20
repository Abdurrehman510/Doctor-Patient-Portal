const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const crypto = require('crypto'); // Import crypto for token generation
const User = require('../models/User');
const Patient = require('../models/Patient');

// Signup
router.post('/signup', async (req, res) => {
  const { email, password, name, role } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    if (!['Doctor', 'Patient', 'Admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    user = new User({ email, password, name, role });
    await user.save();

    if (user.role === 'Patient') {
      const newPatient = new Patient({
        userId: user._id,
        name: user.name,
        email: user.email,
      });
      await newPatient.save();
    }

    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, refreshToken, user: { id: user._id, email, role, name } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    if (!user.password) {
      return res.status(400).json({ message: 'Please use Google login for this account' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid password' });
    }
    const payload = { id: user._id, role: user.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
    res.json({ token, refreshToken, user: { id: user._id, email, role: user.role, name: user.name } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: 'http://localhost:5173/login?error=auth_failed' }),
  async (req, res) => {
    try {
      if (req.user.role === 'Patient') {
        let patient = await Patient.findOne({ userId: req.user._id });
        if (!patient) {
          patient = new Patient({
            userId: req.user._id,
            name: req.user.name,
            email: req.user.email,
          });
          await patient.save();
        }
      }

      const payload = { id: req.user._id, role: req.user.role };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
      const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
      const user = {
        id: req.user._id.toString(),
        email: req.user.email,
        role: req.user.role,
        name: req.user.name,
      };
      const redirectUrl = `http://localhost:5173/auth/success?token=${token}&refreshToken=${refreshToken}&user=${encodeURIComponent(JSON.stringify(user))}`;
      res.redirect(redirectUrl);
    } catch (err) {
      console.error('Google callback error:', err);
      res.redirect('http://localhost:5173/login?error=auth_failed');
    }
  }
);

// Get current user
router.get('/me', passport.authenticate('jwt', { session: false }), async (req, res) => {
    // After passport authenticates, req.user is available
    res.json({
        id: req.user.id || req.user._id,
        email: req.user.email,
        role: req.user.role,
        name: req.user.name
    });
});

// Refresh token
router.post('/refresh', (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.sendStatus(401);
    }

    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }

        const payload = { id: user.id, role: user.role };
        const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

        res.json({
            accessToken: newAccessToken
        });
    });
});

// ## FORGOT PASSWORD ##
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Send a generic success message to prevent email enumeration
      return res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // Generate a secure token
    const token = crypto.randomBytes(20).toString('hex');

    // Set token and expiration on the user document (e.g., expires in 1 hour)
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour in milliseconds

    await user.save();

    // In a real application, you would send an email here.
    // For this project, we'll log the reset link to the console for simulation.
    const resetLink = `http://localhost:5173/reset-password/${token}`;
    console.log('--- PASSWORD RESET SIMULATION ---');
    console.log(`Reset link for ${user.email}: ${resetLink}`);
    console.log('---------------------------------');

    res.status(200).json({ message: 'If an account with that email exists, a password reset link has been sent.' });

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ## RESET PASSWORD ##
router.post('/reset-password/:token', async (req, res) => {
  try {
    const { password } = req.body;
    const { token } = req.params;

    // Find the user by the token and check if the token is still valid
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }, // Check if token is not expired
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }

    // Set the new password
    user.password = password;
    // Clear the reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: 'Password has been updated successfully.' });

  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;