import User from '../model/user.js';
import Manga from '../model/manga.js';
import Chapter from '../model/chapter.js';
import Review from '../model/review.js';
import jwt from 'jsonwebtoken';

// Register user
export const register = async (req, res) => {
  try {
    const { username, email, password, displayName } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or username already exists'
      });
    }

    const user = new User({
      username,
      email,
      password,
      profile: { displayName: displayName || username }
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profile: user.profile,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          profile: user.profile,
          role: user.role,
          preferences: user.preferences
        },
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId)
      .populate('library.favorites.mangaId', 'title coverImage author genres status')
      .populate('library.readingList.mangaId', 'title coverImage author genres status')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { profile, preferences } = req.body;

    const updateData = {};
    if (profile) updateData.profile = { ...profile };
    if (preferences) updateData.preferences = { ...preferences };

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Add manga to favorites
export const addToFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mangaId } = req.params;

    // Check if manga exists
    const manga = await Manga.findById(mangaId);
    if (!manga) {
      return res.status(404).json({
        success: false,
        message: 'Manga not found'
      });
    }

    const user = await User.findById(userId);
    await user.addToFavorites(mangaId);

    // Update manga favorites count
    await Manga.findByIdAndUpdate(mangaId, { $inc: { 'popularity.favorites': 1 } });

    res.json({
      success: true,
      message: 'Manga added to favorites'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding to favorites',
      error: error.message
    });
  }
};

// Remove from favorites
export const removeFromFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mangaId } = req.params;

    const user = await User.findById(userId);
    await user.removeFromFavorites(mangaId);

    // Update manga favorites count
    await Manga.findByIdAndUpdate(mangaId, { $inc: { 'popularity.favorites': -1 } });

    res.json({
      success: true,
      message: 'Manga removed from favorites'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error removing from favorites',
      error: error.message
    });
  }
};

// Get user's favorites
export const getFavorites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, sort = 'addedAt', order = 'desc' } = req.query;

    const user = await User.findById(userId)
      .populate({
        path: 'library.favorites.mangaId',
        select: 'title author coverImage genres status rating popularity'
      })
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let favorites = user.library.favorites.filter(fav => fav.mangaId);

    // Sort favorites
    favorites.sort((a, b) => {
      if (sort === 'addedAt') {
        return order === 'desc' 
          ? new Date(b.addedAt) - new Date(a.addedAt)
          : new Date(a.addedAt) - new Date(b.addedAt);
      }
      if (sort === 'title') {
        return order === 'desc'
          ? b.mangaId.title.localeCompare(a.mangaId.title)
          : a.mangaId.title.localeCompare(b.mangaId.title);
      }
      return 0;
    });

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedFavorites = favorites.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: {
        favorites: paginatedFavorites,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(favorites.length / parseInt(limit)),
          totalCount: favorites.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching favorites',
      error: error.message
    });
  }
};

// Update reading list
export const updateReadingList = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mangaId } = req.params;
    const { status, currentChapter, currentPage } = req.body;

    // Check if manga exists
    const manga = await Manga.findById(mangaId);
    if (!manga) {
      return res.status(404).json({
        success: false,
        message: 'Manga not found'
      });
    }

    const user = await User.findById(userId);
    
    // Find existing reading list item
    const existingItem = user.library.readingList.find(
      item => item.mangaId.toString() === mangaId
    );

    if (existingItem) {
      if (status) existingItem.status = status;
      if (currentChapter !== undefined) existingItem.progress.currentChapter = currentChapter;
      if (currentPage !== undefined) existingItem.progress.currentPage = currentPage;
      existingItem.lastRead = new Date();
    } else {
      user.library.readingList.push({
        mangaId,
        status: status || 'reading',
        progress: {
          currentChapter: currentChapter || 0,
          currentPage: currentPage || 0
        },
        lastRead: new Date()
      });
    }

    await user.save();

    res.json({
      success: true,
      message: 'Reading list updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating reading list',
      error: error.message
    });
  }
};

// Get reading list
export const getReadingList = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 20, sort = 'lastRead', order = 'desc' } = req.query;

    const user = await User.findById(userId)
      .populate({
        path: 'library.readingList.mangaId',
        select: 'title author coverImage genres status rating chapters'
      })
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let readingList = user.library.readingList.filter(item => item.mangaId);

    // Filter by status if provided
    if (status) {
      readingList = readingList.filter(item => item.status === status);
    }

    // Sort reading list
    readingList.sort((a, b) => {
      if (sort === 'lastRead') {
        const dateA = a.lastRead ? new Date(a.lastRead) : new Date(a.addedAt);
        const dateB = b.lastRead ? new Date(b.lastRead) : new Date(b.addedAt);
        return order === 'desc' ? dateB - dateA : dateA - dateB;
      }
      if (sort === 'title') {
        return order === 'desc'
          ? b.mangaId.title.localeCompare(a.mangaId.title)
          : a.mangaId.title.localeCompare(b.mangaId.title);
      }
      return 0;
    });

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedList = readingList.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: {
        readingList: paginatedList,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(readingList.length / parseInt(limit)),
          totalCount: readingList.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reading list',
      error: error.message
    });
  }
};

// Get reading history
export const getReadingHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 50 } = req.query;

    const user = await User.findById(userId)
      .populate({
        path: 'library.readHistory.mangaId',
        select: 'title author coverImage'
      })
      .populate({
        path: 'library.readHistory.chapterId',
        select: 'title chapterNumber'
      })
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const history = user.library.readHistory.filter(h => h.mangaId && h.chapterId);

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedHistory = history.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: {
        history: paginatedHistory,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(history.length / parseInt(limit)),
          totalCount: history.length
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reading history',
      error: error.message
    });
  }
};

// Get user statistics
export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get additional stats
    const [reviewCount, averageRating] = await Promise.all([
      Review.countDocuments({ userId }),
      Review.aggregate([
        { $match: { userId: user._id } },
        { $group: { _id: null, avgRating: { $avg: '$rating' } } }
      ])
    ]);

    const stats = {
      ...user.stats,
      reviewCount,
      averageGivenRating: averageRating[0]?.avgRating || 0,
      favoriteCount: user.library.favorites.length,
      readingListCount: user.library.readingList.length,
      historyCount: user.library.readHistory.length,
      joinDate: user.joinDate,
      lastLogin: user.lastLogin
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user statistics',
      error: error.message
    });
  }
};

// Get personalized recommendations
export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    const user = await User.findById(userId)
      .populate('library.favorites.mangaId', 'genres tags author')
      .populate('library.readingList.mangaId', 'genres tags author')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Collect user's preferred genres and authors
    const readManga = [
      ...user.library.favorites.map(f => f.mangaId),
      ...user.library.readingList.map(r => r.mangaId)
    ].filter(Boolean);

    const preferredGenres = [...new Set(readManga.flatMap(m => m.genres || []))];
    const preferredAuthors = [...new Set(readManga.map(m => m.author).filter(Boolean))];
    const readMangaIds = readManga.map(m => m._id.toString());

    // Find recommendations based on preferences
    const recommendations = await Manga.find({
      _id: { $nin: readMangaIds },
      published: true,
      $or: [
        { genres: { $in: preferredGenres } },
        { author: { $in: preferredAuthors } }
      ]
    })
      .sort({ 'rating.average': -1, 'popularity.views': -1 })
      .limit(parseInt(limit))
      .select('title author coverImage rating popularity genres status')
      .lean();

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching recommendations',
      error: error.message
    });
  }
};