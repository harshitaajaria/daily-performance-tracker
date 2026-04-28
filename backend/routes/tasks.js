const express = require('express');
const router = express.Router();
const DailyEntry = require('../models/DailyEntry');
const auth = require('../middleware/auth');

// Apply auth middleware to all routes
router.use(auth);

// Get all entries for a specific date
router.get('/date/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const entries = await DailyEntry.find({
      userId: req.userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ createdAt: -1 });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all entries
router.get('/', async (req, res) => {
  try {
    const entries = await DailyEntry.find({ userId: req.userId }).sort({ date: -1, createdAt: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get entries for date range
router.get('/range/:startDate/:endDate', async (req, res) => {
  try {
    const startDate = new Date(req.params.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(req.params.endDate);
    endDate.setHours(23, 59, 59, 999);

    const entries = await DailyEntry.find({
      userId: req.userId,
      date: { $gte: startDate, $lte: endDate }
    }).sort({ date: -1 });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new entry
router.post('/', async (req, res) => {
  try {
    const { date, taskName, category, timeSpent, effortLevel, status, notes } = req.body;
    
    const entry = new DailyEntry({
      userId: req.userId,
      date: date || new Date(),
      taskName,
      category,
      timeSpent,
      effortLevel,
      status,
      notes: notes || ''
    });

    const newEntry = await entry.save();
    res.status(201).json(newEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update entry
router.put('/:id', async (req, res) => {
  try {
    const { taskName, category, timeSpent, effortLevel, status, notes } = req.body;
    
    const entry = await DailyEntry.findOne({ _id: req.params.id, userId: req.userId });
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }

    entry.taskName = taskName || entry.taskName;
    entry.category = category || entry.category;
    entry.timeSpent = timeSpent !== undefined ? timeSpent : entry.timeSpent;
    entry.effortLevel = effortLevel !== undefined ? effortLevel : entry.effortLevel;
    entry.status = status || entry.status;
    entry.notes = notes !== undefined ? notes : entry.notes;

    const updatedEntry = await entry.save();
    res.json(updatedEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete entry
router.delete('/:id', async (req, res) => {
  try {
    const entry = await DailyEntry.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!entry) {
      return res.status(404).json({ message: 'Entry not found' });
    }
    res.json({ message: 'Entry deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get dashboard statistics
router.get('/stats/dashboard', async (req, res) => {
  try {
    const { date } = req.query;
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

    const entries = await DailyEntry.find({
      userId: req.userId,
      date: { $gte: startDate, $lte: endDate }
    });

    const totalTime = entries.reduce((sum, e) => sum + e.timeSpent, 0);
    const totalScore = entries.reduce((sum, e) => sum + (e.timeSpent * e.effortLevel), 0);
    
    const categoryDistribution = {};
    const categoryScores = {};
    entries.forEach(entry => {
      categoryDistribution[entry.category] = (categoryDistribution[entry.category] || 0) + entry.timeSpent;
      categoryScores[entry.category] = (categoryScores[entry.category] || 0) + (entry.timeSpent * entry.effortLevel);
    });

    const statusCount = {
      Completed: entries.filter(e => e.status === 'Completed').length,
      Partial: entries.filter(e => e.status === 'Partial').length,
      Missed: entries.filter(e => e.status === 'Missed').length
    };

    res.json({
      totalTime,
      totalScore,
      totalTasks: entries.length,
      categoryDistribution,
      categoryScores,
      statusCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get weekly analysis
router.get('/stats/weekly', async (req, res) => {
  try {
    const { startDate } = req.query;
    let weekStart;
    
    if (startDate) {
      weekStart = new Date(startDate);
    } else {
      const today = new Date();
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      weekStart = new Date(today.setDate(diff));
    }
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const entries = await DailyEntry.find({
      date: { $gte: weekStart, $lte: weekEnd }
    });

    // Group by date
    const dailyStats = {};
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      const dayKey = day.toISOString().split('T')[0];
      dailyStats[dayKey] = { time: 0, score: 0, tasks: 0 };
    }

    entries.forEach(entry => {
      const dayKey = entry.date.toISOString().split('T')[0];
      if (dailyStats[dayKey]) {
        dailyStats[dayKey].time += entry.timeSpent;
        dailyStats[dayKey].score += entry.timeSpent * entry.effortLevel;
        dailyStats[dayKey].tasks += 1;
      }
    });

    // Find best and worst days
    let bestDay = null, worstDay = null;
    let bestScore = 0, worstScore = Infinity;

    Object.entries(dailyStats).forEach(([date, stats]) => {
      if (stats.score > bestScore) {
        bestScore = stats.score;
        bestDay = { date, ...stats };
      }
      if (stats.tasks > 0 && stats.score < worstScore) {
        worstScore = stats.score;
        worstDay = { date, ...stats };
      }
    });

    // Category consistency
    const categoryStats = {};
    entries.forEach(entry => {
      if (!categoryStats[entry.category]) {
        categoryStats[entry.category] = { days: new Set(), totalTime: 0 };
      }
      categoryStats[entry.category].days.add(entry.date.toISOString().split('T')[0]);
      categoryStats[entry.category].totalTime += entry.timeSpent;
    });

    const categoryConsistency = Object.entries(categoryStats).map(([cat, stats]) => ({
      category: cat,
      daysActive: stats.days.size,
      totalTime: stats.totalTime
    }));

    // Missed tasks analysis
    const missedTasks = entries.filter(e => e.status === 'Missed');
    const lowEffortTasks = entries.filter(e => e.effortLevel <= 2 && e.status === 'Completed');

    res.json({
      dailyStats,
      bestDay,
      worstDay,
      categoryConsistency,
      missedTasks: missedTasks.length,
      lowEffortTasks: lowEffortTasks.length,
      totalEntries: entries.length
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;