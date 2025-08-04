import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minLength: 3,
    maxLength: 20,
    match: /^[a-zA-Z0-9_]+$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
  },
  password: {
    type: String,
    required: true,
    minLength: 6
  },
  profile: {
    displayName: {
      type: String,
      trim: true,
      maxLength: 50
    },
    avatar: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      maxLength: 500
    },
    birthDate: Date,
    location: {
      type: String,
      maxLength: 100
    },
    website: {
      type: String,
      maxLength: 200
    }
  },
  preferences: {
    language: {
      type: String,
      default: 'English'
    },
    readingMode: {
      type: String,
      enum: ['left-to-right', 'right-to-left', 'vertical'],
      default: 'left-to-right'
    },
    pageLayout: {
      type: String,
      enum: ['single', 'double', 'webtoon'],
      default: 'single'
    },
    autoNext: {
      type: Boolean,
      default: false
    },
    showNSFW: {
      type: Boolean,
      default: false
    },
    notifications: {
      newChapters: {
        type: Boolean,
        default: true
      },
      email: {
        type: Boolean,
        default: false
      },
      browser: {
        type: Boolean,
        default: true
      }
    }
  },
  library: {
    favorites: [{
      mangaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Manga'
      },
      addedAt: {
        type: Date,
        default: Date.now
      }
    }],
    readingList: [{
      mangaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Manga'
      },
      status: {
        type: String,
        enum: ['reading', 'completed', 'on-hold', 'dropped', 'plan-to-read'],
        default: 'reading'
      },
      addedAt: {
        type: Date,
        default: Date.now
      },
      lastRead: Date,
      progress: {
        currentChapter: {
          type: Number,
          default: 0
        },
        currentPage: {
          type: Number,
          default: 0
        }
      }
    }],
    readHistory: [{
      mangaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Manga'
      },
      chapterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chapter'
      },
      chapterNumber: Number,
      readAt: {
        type: Date,
        default: Date.now
      },
      pagesRead: Number,
      completed: {
        type: Boolean,
        default: false
      }
    }]
  },
  reviews: [{
    mangaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Manga'
    },
    rating: {
      type: Number,
      min: 1,
      max: 10,
      required: true
    },
    title: {
      type: String,
      maxLength: 100
    },
    content: {
      type: String,
      maxLength: 2000
    },
    spoiler: {
      type: Boolean,
      default: false
    },
    likes: {
      type: Number,
      default: 0
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: Date
  }],
  stats: {
    chaptersRead: {
      type: Number,
      default: 0
    },
    pagesRead: {
      type: Number,
      default: 0
    },
    timeSpent: {
      type: Number,
      default: 0 // in minutes
    },
    averageRating: {
      type: Number,
      default: 0
    },
    favoriteGenres: [{
      genre: String,
      count: Number
    }]
  },
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin', 'translator'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  joinDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ 'library.favorites.mangaId': 1 });
userSchema.index({ 'library.readingList.mangaId': 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Virtual for favorite manga count
userSchema.virtual('favoriteCount').get(function() {
  return this.library.favorites.length;
});

// Virtual for reading list count
userSchema.virtual('readingListCount').get(function() {
  return this.library.readingList.length;
});

// Pre-save hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to add manga to favorites
userSchema.methods.addToFavorites = function(mangaId) {
  const isAlreadyFavorite = this.library.favorites.some(
    fav => fav.mangaId.toString() === mangaId.toString()
  );
  
  if (!isAlreadyFavorite) {
    this.library.favorites.push({ mangaId });
  }
  
  return this.save();
};

// Method to remove from favorites
userSchema.methods.removeFromFavorites = function(mangaId) {
  this.library.favorites = this.library.favorites.filter(
    fav => fav.mangaId.toString() !== mangaId.toString()
  );
  
  return this.save();
};

// Method to update reading progress
userSchema.methods.updateReadingProgress = function(mangaId, chapterNumber, pageNumber = 0) {
  const readingItem = this.library.readingList.find(
    item => item.mangaId.toString() === mangaId.toString()
  );
  
  if (readingItem) {
    readingItem.progress.currentChapter = chapterNumber;
    readingItem.progress.currentPage = pageNumber;
    readingItem.lastRead = new Date();
  } else {
    this.library.readingList.push({
      mangaId,
      progress: {
        currentChapter: chapterNumber,
        currentPage: pageNumber
      },
      lastRead: new Date()
    });
  }
  
  return this.save();
};

export default mongoose.model('User', userSchema);