const express = require('express');
const Message = require('../models/Message');
const Class = require('../models/Class');
const { authenticate, requireModerator } = require('../middleware/auth');

const router = express.Router();

// Get messages
router.get('/', authenticate, async (req, res) => {
  try {
    let messages;
    if (req.user.role === 'moderator') {
      messages = await Message.find()
        .populate('teacherId', 'name')
        .populate('studentId', 'name')
        .populate('classId', 'name')
        .sort({ createdAt: -1 });
    } else {
      messages = await Message.find({ teacherId: req.user._id })
        .populate('teacherId', 'name')
        .populate('studentId', 'name')
        .populate('classId', 'name')
        .sort({ createdAt: -1 });
    }
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create message (teacher)
router.post('/', authenticate, async (req, res) => {
  try {
    const { studentId, date, time, reason } = req.body;
    
    // Find teacher's class
    const cls = await Class.findOne({ teacherId: req.user._id });
    if (!cls) return res.status(400).json({ message: 'No class assigned' });
    
    if (!cls.students.includes(studentId)) {
      return res.status(403).json({ message: 'Student not in your class' });
    }
    
    const message = new Message({
      teacherId: req.user._id,
      studentId,
      classId: cls._id,
      date,
      time,
      reason: reason || ''
    });
    await message.save();
    await message.populate('teacherId', 'name');
    await message.populate('studentId', 'name');
    await message.populate('classId', 'name');
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete message (moderator only)
router.delete('/:id', authenticate, requireModerator, async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;