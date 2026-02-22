const express = require('express');
const Student = require('../models/Student');
const Class = require('../models/Class');
const { authenticate, requireModerator } = require('../middleware/auth');

const router = express.Router();

// Get all students (moderator) or own class students (teacher)
router.get('/', authenticate, async (req, res) => {
  try {
    let students;
    if (req.user.role === 'moderator') {
      students = await Student.find().populate('classId', 'name');
    } else {
      const cls = await Class.findOne({ teacherId: req.user._id });
      if (!cls) return res.json([]);
      students = await Student.find({ classId: cls._id }).populate('classId', 'name');
    }
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create student (moderator only)
router.post('/', authenticate, requireModerator, async (req, res) => {
  try {
    const { name } = req.body;
    const student = new Student({ name });
    await student.save();
    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete student (moderator only)
router.delete('/:id', authenticate, requireModerator, async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    if (student.classId) {
      await Class.findByIdAndUpdate(student.classId, { $pull: { students: req.params.id } });
    }
    res.json({ message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;