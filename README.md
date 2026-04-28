# Daily Performance Tracker

A full-stack web application for tracking daily tasks, productivity scores, and personal goals.

## Tech Stack

- **Frontend:** React.js
- **Backend:** Node.js + Express
- **Database:** MongoDB

## Features

1. **Task Management** - Add, edit, delete daily tasks with:
   - Task Name, Category (Work/Health/Learning/Personal)
   - Time Spent, Effort Level (1-5)
   - Status (Completed/Partial/Missed), Notes

2. **Daily Tracking** - Log multiple tasks per day, view by specific date

3. **Productivity Score** - Calculated as: `Time Spent × Effort Level`

4. **Dashboard** - Shows total time, productivity score, category distribution

5. **Analysis Module** - Analyzes missed tasks, low-effort activities, consistency

6. **Smart Suggestions** - Recommendations based on your data

7. **Reports** - Daily report + weekly summary

8. **Goal Setting** - Set daily/weekly targets per category

## Project Structure

```
daily-performance-tracker/
├── backend/
│   ├── config/
│   │   └── db.js          # MongoDB connection
│   ├── models/
│   │   ├── DailyEntry.js  # Task model
│   │   └── UserGoal.js    # Goals model
│   ├── routes/
│   │   ├── tasks.js       # Task API routes
│   │   └── goals.js       # Goal API routes
│   ├── server.js          # Express server
│   ├── package.json
│   └── .env               # Environment variables
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   ├── App.js         # Main React component
    │   ├── index.js
    │   └── index.css
    └── package.json
```

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- MongoDB (local or cloud instance)

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the backend folder (or use the default):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/daily-performance-tracker
```

Start the backend server:

```bash
npm start
```

The API will run on http://localhost:5000

### Frontend Setup

```bash
cd frontend
npm install
```

Start the React development server:

```bash
npm start
```

The app will open at http://localhost:3000

## API Endpoints

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | Get all tasks |
| GET | `/api/tasks/date/:date` | Get tasks for a specific date |
| GET | `/api/tasks/range/:start/:end` | Get tasks in date range |
| POST | `/api/tasks` | Create new task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |
| GET | `/api/tasks/stats/dashboard` | Get dashboard statistics |
| GET | `/api/tasks/stats/weekly` | Get weekly analysis |

### Goals

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/goals` | Get all goals |
| GET | `/api/goals/frequency/:freq` | Get goals by frequency |
| POST | `/api/goals` | Create/update goal |
| PUT | `/api/goals/:id` | Update goal |
| DELETE | `/api/goals/:id` | Delete goal |
| GET | `/api/goals/progress` | Get goal progress |

## Usage

1. **Add Tasks** - Go to Tasks tab, select a date, click "Add Task"
2. **View Dashboard** - See your daily stats and productivity score
3. **Set Goals** - Go to Goals tab to set daily/weekly targets
4. **Check Reports** - View daily and weekly performance summaries
5. **Review Analysis** - See patterns in your productivity data

## License

MIT