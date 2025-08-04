import Manga from '../model/manga.js';
import Chapter from '../model/chapter.js';
import User from '../model/user.js';
import Review from '../model/review.js';

// Get all manga with filtering, sorting, and pagination
export const getAllManga = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      genre,
      status,
      type,
      sort = 'popularity.views',
      order = 'desc',
      search,
      featured,
      year,
      rating
    } = req.query;

    const query = { published: true };

    // Apply filters
    if (genre) {
      query.genres = { $in: Array.isArray(genre) ? genre : [genre] };
    }
    if (status) {
      query.status = status;
    }
    if (type) {
      query.type = type;
    }
    if (featured !== undefined) {
      query.featured = featured === 'true';
    }
    if (year) {
      query.releaseYear = parseInt(year);
    }
    if (rating) {
      query['rating.average'] = { $gte: parseFloat(rating) };
    }
    if (search) {
      query.$text = { $search: search };
    }

    // Sort options
    const sortOptions = {};
    sortOptions[sort] = order === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [manga, totalCount] = await Promise.all([
      Manga.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('chapters', 'chapterNumber title releaseDate')
        .lean(),
      Manga.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.json({
      success: true,
      data: {
        manga,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching manga',
      error: error.message
    });
  }
};

// Get manga by ID
export const getMangaById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const manga = await Manga.findById(id)
      .populate({
        path: 'chapters',
        select: 'chapterNumber title releaseDate pageCount views published',
        match: { published: true },
        options: { sort: { chapterNumber: 1 } }
      })
      .lean();

    if (!manga) {
      return res.status(404).json({
        success: false,
        message: 'Manga not found'
      });
    }

    // Increment view count
    await Manga.findByIdAndUpdate(id, { $inc: { 'popularity.views': 1 } });

    // Get user's reading progress if logged in
    let userProgress = null;
    if (userId) {
      const user = await User.findById(userId).select('library');
      const readingItem = user?.library.readingList.find(
        item => item.mangaId.toString() === id
      );
      if (readingItem) {
        userProgress = {
          status: readingItem.status,
          currentChapter: readingItem.progress.currentChapter,
          currentPage: readingItem.progress.currentPage,
          lastRead: readingItem.lastRead
        };
      }
    }

    res.json({
      success: true,
      data: {
        manga,
        userProgress
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching manga',
      error: error.message
    });
  }
};

// Create new manga (admin/translator only)
export const createManga = async (req, res) => {
  try {
    const mangaData = req.body;
    
    // Check if manga with same title already exists
    const existingManga = await Manga.findOne({ title: mangaData.title });
    if (existingManga) {
      return res.status(400).json({
        success: false,
        message: 'Manga with this title already exists'
      });
    }

    const manga = new Manga(mangaData);
    await manga.save();

    res.status(201).json({
      success: true,
      message: 'Manga created successfully',
      data: manga
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating manga',
      error: error.message
    });
  }
};

// Update manga
export const updateManga = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const manga = await Manga.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!manga) {
      return res.status(404).json({
        success: false,
        message: 'Manga not found'
      });
    }

    res.json({
      success: true,
      message: 'Manga updated successfully',
      data: manga
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating manga',
      error: error.message
    });
  }
};

// Delete manga
export const deleteManga = async (req, res) => {
  try {
    const { id } = req.params;

    const manga = await Manga.findByIdAndDelete(id);
    if (!manga) {
      return res.status(404).json({
        success: false,
        message: 'Manga not found'
      });
    }

    // Delete all related chapters
    await Chapter.deleteMany({ mangaId: id });

    // Remove from user libraries
    await User.updateMany(
      {},
      {
        $pull: {
          'library.favorites': { mangaId: id },
          'library.readingList': { mangaId: id }
        }
      }
    );

    // Delete all reviews
    await Review.deleteMany({ mangaId: id });

    res.json({
      success: true,
      message: 'Manga deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting manga',
      error: error.message
    });
  }
};

// Get popular manga
export const getPopularManga = async (req, res) => {
  try {
    const { limit = 10, timeframe = 'all' } = req.query;

    let dateFilter = {};
    if (timeframe === 'week') {
      dateFilter = { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } };
    } else if (timeframe === 'month') {
      dateFilter = { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } };
    }

    const manga = await Manga.find({ published: true, ...dateFilter })
      .sort({ 'popularity.views': -1, 'rating.average': -1 })
      .limit(parseInt(limit))
      .select('title author coverImage rating popularity genres status')
      .lean();

    res.json({
      success: true,
      data: manga
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching popular manga',
      error: error.message
    });
  }
};

// Get latest manga
export const getLatestManga = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const manga = await Manga.find({ published: true })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate({
        path: 'chapters',
        select: 'chapterNumber title releaseDate',
        options: { sort: { chapterNumber: -1 }, limit: 1 }
      })
      .lean();

    res.json({
      success: true,
      data: manga
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching latest manga',
      error: error.message
    });
  }
};

// Get latest chapter updates
export const getLatestUpdates = async (req, res) => {
  try {
    const { limit = 20 } = req.query;

    const chapters = await Chapter.find({ published: true })
      .sort({ releaseDate: -1 })
      .limit(parseInt(limit))
      .populate('mangaId', 'title coverImage genres status')
      .lean();

    res.json({
      success: true,
      data: chapters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching latest updates',
      error: error.message
    });
  }
};

// Get featured manga
export const getFeaturedManga = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const manga = await Manga.find({ published: true, featured: true })
      .sort({ 'rating.average': -1, 'popularity.views': -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: manga
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching featured manga',
      error: error.message
    });
  }
};

// Search manga
export const searchManga = async (req, res) => {
  try {
    const { q, limit = 20, page = 1 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long'
      });
    }

    const searchRegex = new RegExp(q.trim(), 'i');
    const query = {
      published: true,
      $or: [
        { title: searchRegex },
        { alternativeTitles: searchRegex },
        { author: searchRegex },
        { artist: searchRegex },
        { tags: searchRegex }
      ]
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [manga, totalCount] = await Promise.all([
      Manga.find(query)
        .sort({ 'popularity.views': -1, 'rating.average': -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select('title author coverImage rating popularity genres status alternativeTitles')
        .lean(),
      Manga.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        manga,
        totalCount,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error searching manga',
      error: error.message
    });
  }
};

// Get manga recommendations
export const getRecommendations = async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 10 } = req.query;

    const manga = await Manga.findById(id).select('genres tags author');
    if (!manga) {
      return res.status(404).json({
        success: false,
        message: 'Manga not found'
      });
    }

    // Find similar manga based on genres, tags, and author
    const recommendations = await Manga.find({
      _id: { $ne: id },
      published: true,
      $or: [
        { genres: { $in: manga.genres } },
        { tags: { $in: manga.tags } },
        { author: manga.author }
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

// Get manga statistics
export const getMangaStats = async (req, res) => {
  try {
    const stats = await Manga.aggregate([
      {
        $group: {
          _id: null,
          totalManga: { $sum: 1 },
          totalViews: { $sum: '$popularity.views' },
          averageRating: { $avg: '$rating.average' },
          genreStats: {
            $push: {
              $map: {
                input: '$genres',
                in: '$$this'
              }
            }
          }
        }
      }
    ]);

    // Get genre distribution
    const genreDistribution = await Manga.aggregate([
      { $unwind: '$genres' },
      { $group: { _id: '$genres', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get status distribution
    const statusDistribution = await Manga.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalManga: 0,
          totalViews: 0,
          averageRating: 0
        },
        genreDistribution,
        statusDistribution
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching manga statistics',
      error: error.message
    });
  }
};