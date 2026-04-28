const express = require('express');
const router = express.Router();
const UserGoal = require('../models/UserGoal');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// Get all goals
router.get('/', async (req, res) => {
  try {
    const goals = await UserGoal.find({ userId: req.userId });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get goals by frequency
router.get('/frequency/:frequency', async (req, res) => {
  try {
    const goals = await UserGoal.find({ userId: req.userId, frequency: req.params.frequency });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new goal
router.post('/', async (req, res) => {
  try {
    const { category, targetTime, frequency } = req.body;
    
    // Check if goal for this category and frequency already exists
    const existingGoal = await UserGoal.findOne({ userId: req.userId, category, frequency });
    if (existingGoal) {
      existingGoal.targetTime = targetTime;
      const updatedGoal = await existingGoal.save();
      return res.json(updatedGoal);
    }

    const goal = new UserGoal({
      userId: req.userId,
      category,
      targetTime,
      frequency
    });

    const newGoal = await goal.save();
    res.status(201).json(newGoal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update goal
router.put('/:id', async (req, res) => {
  try {
    const { targetTime } = req.body;
    
    const goal = await UserGoal.findOne({ _id: req.params.id, userId: req.userId });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    goal.targetTime = targetTime || goal.targetTime;
    const updatedGoal = await goal.save();
    res.json(updatedGoal);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete goal
router.delete('/:id', async (req, res) => {
  try {
    const goal = await UserGoal.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get goal progress
router.get('/progress', async (req, res) => {
  try {
    const { date } = req.query;
    const DailyEntry = require('../models/DailyEntry');
    
    let startDate, endDate;
    if (date) {
      const queryDate = new Date(date);
      startDate = new Date(queryDate.setHours(0, 0, 0, 0));
      endDate = new Date(queryDate.setHours(23, 59, 59, 999));
    } else {
      const today = new Date();
      startDate = new Date(today.setHours(0, 0, 0, 0));
      endDate = new Date(today.setHours(23, 59, 59, 999));
    }

    const goals = await UserGoal.find({ userId: req.userId, frequency: 'Daily' });
    const entries = await DailyEntry.find({
      userId: req.userId,
      date: { $gte: startDate, $lte: endDate }
    });

    const progress = goals.map(goal => {
      const categoryTime = entries
        .filter(e => e.category === goal.category)
        .reduce((sum, e) => sum + e.timeSpent, 0);
      
      return {
        category: goal.category,
        target: goal.targetTime,
        actual: categoryTime,
        percentage: goal.targetTime > 0 ? Math.round((categoryTime / goal.targetTime) * 100) : 0
      };
    });

    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;