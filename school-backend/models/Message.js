const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  reason: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);