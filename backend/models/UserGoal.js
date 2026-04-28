const mongoose = require('mongoose');

const userGoalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['Work', 'Health', 'Learning', 'Personal'],
    required: true
  },
  targetTime: {
    type: Number,
    required: true,
    min: 0
  },
  frequency: {
    type: String,
    enum: ['Daily', 'Weekly'],
    required: true
  },
  weekStartDate: {
    type: Date,
    default: function() {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(now.setDate(diff));
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserGoal', userGoalSchema);