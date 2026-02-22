const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Student', studentSchema);