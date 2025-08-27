import express from 'express';
import { 
  createMonth,
  getAllMonths,
  getMonthsByYear,
  activateMonth,
  getActiveMonth,
  deleteMonth
} from '../controlllers/month.js';
import { authenticateUser } from '../middleware/auth.js';

const monthRouter = express.Router();

// Authentication required for all routes
monthRouter.use(authenticateUser);

// Create a new month
monthRouter.post('/', createMonth);

// Get all months
monthRouter.get('/', getAllMonths);

// Get months for a specific year
monthRouter.get('/year/:year', getMonthsByYear);

// Get currently active month
monthRouter.get('/active', getActiveMonth);

// Activate a specific month
monthRouter.patch('/:id/activate', activateMonth);

// Delete a month
monthRouter.delete('/:id', deleteMonth);

export default monthRouter;
