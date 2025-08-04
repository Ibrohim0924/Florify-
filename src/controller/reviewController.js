import Review from '../model/review.js';
import Manga from '../model/manga.js';
import User from '../model/user.js';

// Get reviews for a manga
export const getReviewsByManga = async (req, res) => {
  try {
    const { mangaId } = req.params;
    const { 
      page = 1, 
      limit = 20, 
      sort = 'helpfulness.total', 
      order = 'desc',
      spoiler = 'false'
    } = req.query;

    // Verify manga exists
    const manga = await Manga.findById(mangaId);
    if (!manga) {
      return res.status(404).json({
        success: false,
        message: 'Manga not found'
      });
    }

    const query = { 
      mangaId, 
      'moderation.status': 'approved'
    };

    // Filter spoiler reviews if requested
    if (spoiler === 'false') {
      query.spoiler = false;
    }

    const sortOptions = {};
    sortOptions[sort] = order === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, totalCount] = await Promise.all([
      Review.find(query)
        .populate('userId', 'username profile.displayName profile.avatar')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Review.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews',
      error: error.message
    });
  }
};

// Get review by ID
export const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id)
      .populate('userId', 'username profile.displayName profile.avatar')
      .populate('mangaId', 'title coverImage')
      .populate('replies.userId', 'username profile.displayName profile.avatar')
      .lean();

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    if (review.moderation.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Review is not available'
      });
    }

    res.json({
      success: true,
      data: review
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching review',
      error: error.message
    });
  }
};

// Create review
export const createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mangaId } = req.params;
    const reviewData = req.body;

    // Verify manga exists
    const manga = await Manga.findById(mangaId);
    if (!manga) {
      return res.status(404).json({
        success: false,
        message: 'Manga not found'
      });
    }

    // Check if user already reviewed this manga
    const existingReview = await Review.findOne({ mangaId, userId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this manga'
      });
    }

    const review = new Review({
      ...reviewData,
      mangaId,
      userId
    });

    await review.save();

    // Update manga rating
    await updateMangaRating(mangaId);

    // Add review to user's reviews array
    await User.findByIdAndUpdate(
      userId,
      { $push: { reviews: { 
        mangaId, 
        rating: review.rating, 
        title: review.title,
        content: review.content,
        spoiler: review.spoiler,
        createdAt: review.createdAt 
      }}},
      { new: true }
    );

    const populatedReview = await Review.findById(review._id)
      .populate('userId', 'username profile.displayName profile.avatar')
      .lean();

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: populatedReview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating review',
      error: error.message
    });
  }
};

// Update review
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check ownership
    if (review.userId.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own reviews'
      });
    }

    // Update review
    Object.assign(review, updateData);
    review.updatedAt = new Date();
    await review.save();

    // Update manga rating if rating changed
    if (updateData.rating) {
      await updateMangaRating(review.mangaId);
    }

    const populatedReview = await Review.findById(review._id)
      .populate('userId', 'username profile.displayName profile.avatar')
      .lean();

    res.json({
      success: true,
      message: 'Review updated successfully',
      data: populatedReview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating review',
      error: error.message
    });
  }
};

// Delete review
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check ownership
    if (review.userId.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
    }

    await Review.findByIdAndDelete(id);

    // Update manga rating
    await updateMangaRating(review.mangaId);

    // Remove from user's reviews array
    await User.findByIdAndUpdate(
      review.userId,
      { $pull: { reviews: { mangaId: review.mangaId } } }
    );

    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting review',
      error: error.message
    });
  }
};

// Vote on review helpfulness
export const voteReviewHelpfulness = async (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body; // 'helpful' or 'not-helpful'
    const userId = req.user.id;

    if (!['helpful', 'not-helpful'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vote type'
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Can't vote on own review
    if (review.userId.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot vote on your own review'
      });
    }

    await review.voteHelpfulness(userId, type);

    res.json({
      success: true,
      message: 'Vote recorded successfully',
      data: {
        helpfulness: review.helpfulness
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error voting on review',
      error: error.message
    });
  }
};

// Add reply to review
export const addReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Reply content is required'
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await review.addReply(userId, content.trim());

    const updatedReview = await Review.findById(id)
      .populate('replies.userId', 'username profile.displayName profile.avatar')
      .lean();

    res.json({
      success: true,
      message: 'Reply added successfully',
      data: {
        replies: updatedReview.replies
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding reply',
      error: error.message
    });
  }
};

// Flag review
export const flagReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const validReasons = ['spam', 'inappropriate', 'spoiler', 'off-topic', 'harassment'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid flag reason'
      });
    }

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Can't flag own review
    if (review.userId.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot flag your own review'
      });
    }

    await review.flag(userId, reason);

    res.json({
      success: true,
      message: 'Review flagged successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error flagging review',
      error: error.message
    });
  }
};

// Get user's reviews
export const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc' } = req.query;

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const query = { 
      userId, 
      'moderation.status': 'approved' 
    };

    const sortOptions = {};
    sortOptions[sort] = order === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, totalCount] = await Promise.all([
      Review.find(query)
        .populate('mangaId', 'title coverImage')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Review.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          displayName: user.profile.displayName
        },
        reviews,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalCount
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user reviews',
      error: error.message
    });
  }
};

// Get featured reviews
export const getFeaturedReviews = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const reviews = await Review.find({
      featured: true,
      'moderation.status': 'approved'
    })
      .populate('userId', 'username profile.displayName profile.avatar')
      .populate('mangaId', 'title coverImage')
      .sort({ 'helpfulness.total': -1, createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching featured reviews',
      error: error.message
    });
  }
};

// Helper function to update manga rating
async function updateMangaRating(mangaId) {
  try {
    const reviews = await Review.find({ 
      mangaId, 
      'moderation.status': 'approved' 
    }).select('rating');

    if (reviews.length === 0) {
      await Manga.findByIdAndUpdate(mangaId, {
        'rating.average': 0,
        'rating.count': 0
      });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await Manga.findByIdAndUpdate(mangaId, {
      'rating.average': Math.round(averageRating * 10) / 10, // Round to 1 decimal
      'rating.count': reviews.length
    });
  } catch (error) {
    console.error('Error updating manga rating:', error);
  }
}