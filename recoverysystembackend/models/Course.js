const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a course name'],
    unique: true,
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: [true, 'Please add a price'],
  },
  startDate: {
    type: Date,
    required: [true, 'Please add a start date'],
  },
  endDate: {
    type: Date,
    required: [true, 'Please add an end date'],
  },
  maxStudents: {
    type: Number,
    required: true,
  },
  enrolledStudents: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  }],
  courseMaterial: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Course', courseSchema); 