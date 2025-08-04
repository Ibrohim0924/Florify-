import express from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  addToFavorites,
  removeFromFavorites,
  getFavorites,
  updateReadingList,
  getReadingList,
  getReadingHistory,
  getUserStats,
  getRecommendations
} from '../controller/userController.js';

import { authenticateToken } from '../guards/authGuard.js';

const router = express.Router();

// Authentication routes
router.post('/register', register);
router.post('/login', login);

// Protected user routes
router.use(authenticateToken); // All routes below require authentication

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/stats', getUserStats);
router.get('/recommendations', getRecommendations);

// Library management
router.get('/favorites', getFavorites);
router.post('/favorites/:mangaId', addToFavorites);
router.delete('/favorites/:mangaId', removeFromFavorites);

router.get('/reading-list', getReadingList);
router.put('/reading-list/:mangaId', updateReadingList);

router.get('/history', getReadingHistory);

export default router;