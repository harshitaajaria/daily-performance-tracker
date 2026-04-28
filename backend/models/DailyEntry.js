const mongoose = require('mongoose');

const dailyEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  taskName: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Work', 'Health', 'Learning', 'Personal'],
    required: true
  },
  timeSpent: {
    type: Number,
    required: true,
    min: 0
  },
  effortLevel: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  status: {
    type: String,
    enum: ['Completed', 'Partial', 'Missed'],
    default: 'Partial'
  },
  notes: {
    type: String,
    trim: true
  },
  productivityScore: {
    type: Number,
    default: function() {
      return this.timeSpent * this.effortLevel;
    }
  }
}, {
  timestamps: true
});

// Index for efficient queries
dailyEntrySchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('DailyEntry', dailyEntrySchema);