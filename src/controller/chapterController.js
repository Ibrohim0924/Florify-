import Chapter from '../model/chapter.js';
import Manga from '../model/manga.js';
import User from '../model/user.js';

// Get all chapters for a manga
export const getChaptersByManga = async (req, res) => {
  try {
    const { mangaId } = req.params;
    const { page = 1, limit = 50, sort = 'chapterNumber', order = 'asc' } = req.query;

    // Verify manga exists
    const manga = await Manga.findById(mangaId);
    if (!manga) {
      return res.status(404).json({
        success: false,
        message: 'Manga not found'
      });
    }

    const query = { mangaId, published: true };
    const sortOptions = {};
    sortOptions[sort] = order === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [chapters, totalCount] = await Promise.all([
      Chapter.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .select('chapterNumber title releaseDate pageCount views translator')
        .lean(),
      Chapter.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        manga: {
          id: manga._id,
          title: manga.title,
          author: manga.author
        },
        chapters,
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
      message: 'Error fetching chapters',
      error: error.message
    });
  }
};

// Get chapter by ID with pages
export const getChapterById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const chapter = await Chapter.findById(id)
      .populate('mangaId', 'title author coverImage')
      .lean();

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    if (!chapter.published) {
      return res.status(403).json({
        success: false,
        message: 'Chapter is not published'
      });
    }

    // Increment view count
    await Chapter.findByIdAndUpdate(id, { $inc: { views: 1 } });

    // Get navigation info (previous/next chapters)
    const [previousChapter, nextChapter] = await Promise.all([
      Chapter.findOne({
        mangaId: chapter.mangaId._id,
        chapterNumber: { $lt: chapter.chapterNumber },
        published: true
      })
        .sort({ chapterNumber: -1 })
        .select('_id chapterNumber title')
        .lean(),
      Chapter.findOne({
        mangaId: chapter.mangaId._id,
        chapterNumber: { $gt: chapter.chapterNumber },
        published: true
      })
        .sort({ chapterNumber: 1 })
        .select('_id chapterNumber title')
        .lean()
    ]);

    // Update user reading progress if logged in
    if (userId) {
      try {
        await User.findById(userId).then(user => {
          if (user) {
            user.updateReadingProgress(chapter.mangaId._id, chapter.chapterNumber);
            
            // Add to reading history
            const historyEntry = {
              mangaId: chapter.mangaId._id,
              chapterId: chapter._id,
              chapterNumber: chapter.chapterNumber,
              readAt: new Date(),
              pagesRead: chapter.pageCount,
              completed: true
            };

            // Remove existing entry for this chapter if exists
            user.library.readHistory = user.library.readHistory.filter(
              h => h.chapterId?.toString() !== chapter._id.toString()
            );

            // Add new entry at the beginning
            user.library.readHistory.unshift(historyEntry);

            // Keep only last 100 entries
            if (user.library.readHistory.length > 100) {
              user.library.readHistory = user.library.readHistory.slice(0, 100);
            }

            // Update stats
            user.stats.chaptersRead += 1;
            user.stats.pagesRead += chapter.pageCount || 0;

            return user.save();
          }
        });
      } catch (error) {
        console.error('Error updating user progress:', error);
      }
    }

    res.json({
      success: true,
      data: {
        chapter,
        navigation: {
          previous: previousChapter,
          next: nextChapter
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching chapter',
      error: error.message
    });
  }
};

// Create new chapter
export const createChapter = async (req, res) => {
  try {
    const chapterData = req.body;

    // Verify manga exists
    const manga = await Manga.findById(chapterData.mangaId);
    if (!manga) {
      return res.status(404).json({
        success: false,
        message: 'Manga not found'
      });
    }

    // Check if chapter number already exists for this manga
    const existingChapter = await Chapter.findOne({
      mangaId: chapterData.mangaId,
      chapterNumber: chapterData.chapterNumber
    });

    if (existingChapter) {
      return res.status(400).json({
        success: false,
        message: 'Chapter with this number already exists'
      });
    }

    const chapter = new Chapter(chapterData);
    await chapter.save();

    // Add chapter to manga's chapters array
    await Manga.findByIdAndUpdate(
      chapterData.mangaId,
      { $push: { chapters: chapter._id } }
    );

    res.status(201).json({
      success: true,
      message: 'Chapter created successfully',
      data: chapter
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating chapter',
      error: error.message
    });
  }
};

// Update chapter
export const updateChapter = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const chapter = await Chapter.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    res.json({
      success: true,
      message: 'Chapter updated successfully',
      data: chapter
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating chapter',
      error: error.message
    });
  }
};

// Delete chapter
export const deleteChapter = async (req, res) => {
  try {
    const { id } = req.params;

    const chapter = await Chapter.findByIdAndDelete(id);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    // Remove chapter from manga's chapters array
    await Manga.findByIdAndUpdate(
      chapter.mangaId,
      { $pull: { chapters: id } }
    );

    // Remove from user reading history
    await User.updateMany(
      {},
      { $pull: { 'library.readHistory': { chapterId: id } } }
    );

    res.json({
      success: true,
      message: 'Chapter deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting chapter',
      error: error.message
    });
  }
};

// Add pages to chapter
export const addPages = async (req, res) => {
  try {
    const { id } = req.params;
    const { pages } = req.body;

    if (!Array.isArray(pages) || pages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Pages array is required and cannot be empty'
      });
    }

    const chapter = await Chapter.findById(id);
    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    // Sort pages by page number and add them
    const sortedPages = pages.sort((a, b) => a.pageNumber - b.pageNumber);
    chapter.pages = [...chapter.pages, ...sortedPages];
    
    // Remove duplicates based on page number
    const uniquePages = chapter.pages.reduce((acc, page) => {
      const existing = acc.find(p => p.pageNumber === page.pageNumber);
      if (!existing) {
        acc.push(page);
      }
      return acc;
    }, []);

    chapter.pages = uniquePages.sort((a, b) => a.pageNumber - b.pageNumber);
    await chapter.save();

    res.json({
      success: true,
      message: 'Pages added successfully',
      data: chapter
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error adding pages',
      error: error.message
    });
  }
};

// Get chapter page
export const getChapterPage = async (req, res) => {
  try {
    const { id, pageNumber } = req.params;
    const userId = req.user?.id;

    const chapter = await Chapter.findById(id)
      .populate('mangaId', 'title')
      .select('pages mangaId chapterNumber title pageCount');

    if (!chapter) {
      return res.status(404).json({
        success: false,
        message: 'Chapter not found'
      });
    }

    const page = chapter.pages.find(p => p.pageNumber === parseInt(pageNumber));
    if (!page) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    // Update user reading progress for this page
    if (userId) {
      try {
        const user = await User.findById(userId);
        if (user) {
          await user.updateReadingProgress(
            chapter.mangaId._id,
            chapter.chapterNumber,
            parseInt(pageNumber)
          );
        }
      } catch (error) {
        console.error('Error updating page progress:', error);
      }
    }

    res.json({
      success: true,
      data: {
        page,
        chapter: {
          id: chapter._id,
          title: chapter.title,
          chapterNumber: chapter.chapterNumber,
          totalPages: chapter.pageCount
        },
        manga: chapter.mangaId
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching page',
      error: error.message
    });
  }
};

// Get latest chapters across all manga
export const getLatestChapters = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const chapters = await Chapter.find({ published: true })
      .sort({ releaseDate: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('mangaId', 'title author coverImage genres status')
      .select('chapterNumber title releaseDate pageCount views')
      .lean();

    res.json({
      success: true,
      data: chapters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching latest chapters',
      error: error.message
    });
  }
};

// Get popular chapters
export const getPopularChapters = async (req, res) => {
  try {
    const { limit = 20, timeframe = 'week' } = req.query;

    let dateFilter = {};
    if (timeframe === 'week') {
      dateFilter = { releaseDate: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } };
    } else if (timeframe === 'month') {
      dateFilter = { releaseDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } };
    }

    const chapters = await Chapter.find({ 
      published: true,
      ...dateFilter
    })
      .sort({ views: -1 })
      .limit(parseInt(limit))
      .populate('mangaId', 'title author coverImage genres')
      .select('chapterNumber title releaseDate views pageCount')
      .lean();

    res.json({
      success: true,
      data: chapters
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching popular chapters',
      error: error.message
    });
  }
};