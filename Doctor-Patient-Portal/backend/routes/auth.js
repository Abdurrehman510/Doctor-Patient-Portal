const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const User = require('../models/User');
const Patient = require('../models/Patient'); // Import the Patient model

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

module.exports = router;