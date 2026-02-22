const express = require('express');
const User = require('../models/User');
const { authenticate, requireModerator } = require('../middleware/auth');

const router = express.Router();

// Get all teachers (moderator only)
router.get('/teachers', authenticate, requireModerator, async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' }).select('-password');
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create teacher (moderator only)
router.post('/teachers', authenticate, requireModerator, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already in use' });
    const teacher = new User({ name, email, password, role: 'teacher' });
    await teacher.save();
    const { password: _, ...teacherData } = teacher.toObject();
    res.status(201).json(teacherData);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete teacher (moderator only)
router.delete('/teachers/:id', authenticate, requireModerator, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Teacher deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;