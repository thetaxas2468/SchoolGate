const express = require('express');
const Class = require('../models/Class');
const User = require('../models/User');
const Student = require('../models/Student');
const { authenticate, requireModerator } = require('../middleware/auth');

const router = express.Router();

// Get all classes (moderator) or own class (teacher)
router.get('/', authenticate, async (req, res) => {
  try {
    let classes;
    if (req.user.role === 'moderator') {
      classes = await Class.find().populate('teacherId', 'name email').populate('students', 'name');
    } else {
      classes = await Class.find({ teacherId: req.user._id }).populate('teacherId', 'name email').populate('students', 'name');
    }
    res.json(classes);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create class (moderator only)
router.post('/', authenticate, requireModerator, async (req, res) => {
  try {
    const { name } = req.body;
    const cls = new Class({ name });
    await cls.save();
    res.status(201).json(cls);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete class (moderator only)
router.delete('/:id', authenticate, requireModerator, async (req, res) => {
  try {
    const cls = await Class.findByIdAndDelete(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    // Unassign teacher
    await User.updateMany({ assignedClassId: req.params.id }, { assignedClassId: null });
    // Unassign students
    await Student.updateMany({ classId: req.params.id }, { classId: null });
    res.json({ message: 'Class deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Assign teacher to class (moderator only)
router.put('/:id/teacher', authenticate, requireModerator, async (req, res) => {
  try {
    const { teacherId } = req.body;
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    
    // Remove old teacher assignment
    if (cls.teacherId) {
      await User.findByIdAndUpdate(cls.teacherId, { assignedClassId: null });
    }
    
    cls.teacherId = teacherId || null;
    await cls.save();
    
    if (teacherId) {
      await User.findByIdAndUpdate(teacherId, { assignedClassId: cls._id });
    }
    
    await cls.populate('teacherId', 'name email');
    await cls.populate('students', 'name');
    res.json(cls);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add student to class (moderator only)
router.post('/:id/students', authenticate, requireModerator, async (req, res) => {
  try {
    const { studentId } = req.body;
    const cls = await Class.findById(req.params.id);
    if (!cls) return res.status(404).json({ message: 'Class not found' });
    
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    
    // Remove from old class
    if (student.classId) {
      await Class.findByIdAndUpdate(student.classId, { $pull: { students: studentId } });
    }
    
    student.classId = cls._id;
    await student.save();
    
    if (!cls.students.includes(studentId)) {
      cls.students.push(studentId);
      await cls.save();
    }
    
    await cls.populate('teacherId', 'name email');
    await cls.populate('students', 'name');
    res.json(cls);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove student from class (moderator only)
router.delete('/:id/students/:studentId', authenticate, requireModerator, async (req, res) => {
  try {
    const cls = await Class.findByIdAndUpdate(
      req.params.id,
      { $pull: { students: req.params.studentId } },
      { new: true }
    ).populate('teacherId', 'name email').populate('students', 'name');
    
    await Student.findByIdAndUpdate(req.params.studentId, { classId: null });
    res.json(cls);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;