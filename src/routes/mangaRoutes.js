import express from 'express';
import {
  getAllManga,
  getMangaById,
  createManga,
  updateManga,
  deleteManga,
  getPopularManga,
  getLatestManga,
  getLatestUpdates,
  getFeaturedManga,
  searchManga,
  getRecommendations,
  getMangaStats
} from '../controller/mangaController.js';

import {
  getChaptersByManga,
  getChapterById,
  createChapter,
  updateChapter,
  deleteChapter,
  addPages,
  getChapterPage,
  getLatestChapters,
  getPopularChapters
} from '../controller/chapterController.js';

import { authenticateToken, requireRole } from '../guards/authGuard.js';

const router = express.Router();

// Manga routes
router.get('/', getAllManga);
router.get('/popular', getPopularManga);
router.get('/latest', getLatestManga);
router.get('/updates', getLatestUpdates);
router.get('/featured', getFeaturedManga);
router.get('/search', searchManga);
router.get('/stats', getMangaStats);
router.get('/:id', getMangaById);
router.get('/:id/recommendations', getRecommendations);

// Admin/Translator only routes
router.post('/', authenticateToken, requireRole(['admin', 'translator']), createManga);
router.put('/:id', authenticateToken, requireRole(['admin', 'translator']), updateManga);
router.delete('/:id', authenticateToken, requireRole(['admin']), deleteManga);

// Chapter routes
router.get('/:mangaId/chapters', getChaptersByManga);
router.get('/chapters/latest', getLatestChapters);
router.get('/chapters/popular', getPopularChapters);
router.get('/chapters/:id', getChapterById);
router.get('/chapters/:id/pages/:pageNumber', getChapterPage);

// Admin/Translator only chapter routes
router.post('/:mangaId/chapters', authenticateToken, requireRole(['admin', 'translator']), createChapter);
router.put('/chapters/:id', authenticateToken, requireRole(['admin', 'translator']), updateChapter);
router.delete('/chapters/:id', authenticateToken, requireRole(['admin', 'translator']), deleteChapter);
router.post('/chapters/:id/pages', authenticateToken, requireRole(['admin', 'translator']), addPages);

export default router;