import express from 'express';
import {
  getReviewsByManga,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  voteReviewHelpfulness,
  addReply,
  flagReview,
  getUserReviews,
  getFeaturedReviews
} from '../controller/reviewController.js';

import { authenticateToken, optionalAuth } from '../guards/authGuard.js';

const router = express.Router();

// Public routes
router.get('/featured', getFeaturedReviews);
router.get('/manga/:mangaId', getReviewsByManga);
router.get('/user/:userId', getUserReviews);
router.get('/:id', getReviewById);

// Protected routes (require authentication)
router.use(authenticateToken);

router.post('/manga/:mangaId', createReview);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);

router.post('/:id/vote', voteReviewHelpfulness);
router.post('/:id/reply', addReply);
router.post('/:id/flag', flagReview);

export default router;