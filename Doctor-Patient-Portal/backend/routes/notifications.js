const express = require('express');
const router = express.Router();
const passport = require('passport');
const Notification = require('../models/Notification');

const auth = passport.authenticate('jwt', { session: false });

// Get all notifications for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    console.error('Error fetching notifications:', err.message);
    res.status(500).json({ message: 'Server error while fetching notifications.' });
  }
});

// Mark a notification as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'User not authorized to update this notification.' });
    }
    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (err) {
    console.error('Error marking notification as read:', err.message);
    res.status(500).json({ message: 'Server error while marking notification as read.' });
  }
});

// Mark all notifications as read
router.put('/read-all', auth, async (req, res) => {
    try {
        await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
        res.json({ message: 'All notifications marked as read.' });
    } catch (err) {
        console.error('Error marking all notifications as read:', err.message);
        res.status(500).json({ message: 'Server error.' });
    }
});

// Delete a notification
router.delete('/:id', auth, async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);
        if (!notification) {
            return res.status(404).json({ message: 'Notification not found.' });
        }
        if (notification.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: 'User not authorized to delete this notification.' });
        }
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ message: 'Notification removed' });
    } catch (err) {
        console.error('Error deleting notification:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router;