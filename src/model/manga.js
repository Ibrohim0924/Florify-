import mongoose from 'mongoose';

const mangaSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  alternativeTitles: [{
    type: String,
    trim: true
  }],
  author: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  artist: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxLength: 2000
  },
  genres: [{
    type: String,
    enum: [
      'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror',
      'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural',
      'Thriller', 'Mystery', 'Historical', 'Psychological', 'Martial Arts',
      'School Life', 'Shounen', 'Shoujo', 'Seinen', 'Josei', 'Ecchi',
      'Harem', 'Mecha', 'Music', 'Parody', 'Police', 'Military'
    ]
  }],
  status: {
    type: String,
    enum: ['Ongoing', 'Completed', 'Hiatus', 'Cancelled'],
    default: 'Ongoing'
  },
  type: {
    type: String,
    enum: ['Manga', 'Manhwa', 'Manhua', 'Novel', 'One-shot'],
    default: 'Manga'
  },
  coverImage: {
    type: String,
    default: ''
  },
  bannerImage: {
    type: String,
    default: ''
  },
  releaseYear: {
    type: Number,
    min: 1900,
    max: new Date().getFullYear() + 1
  },
  rating: {
    average: {
      type: Number,
      default: 0,
      min: 0,
      max: 10
    },
    count: {
      type: Number,
      default: 0
    }
  },
  popularity: {
    views: {
      type: Number,
      default: 0
    },
    favorites: {
      type: Number,
      default: 0
    },
    followers: {
      type: Number,
      default: 0
    }
  },
  chapters: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chapter'
  }],
  tags: [{
    type: String,
    trim: true
  }],
  serialization: {
    type: String,
    trim: true
  },
  published: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  ageRating: {
    type: String,
    enum: ['All Ages', '13+', '16+', '18+'],
    default: 'All Ages'
  },
  language: {
    type: String,
    default: 'English'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for chapter count
mangaSchema.virtual('chapterCount').get(function() {
  return this.chapters.length;
});

// Virtual for latest chapter
mangaSchema.virtual('latestChapter').get(function() {
  if (this.chapters.length > 0) {
    return this.chapters[this.chapters.length - 1];
  }
  return null;
});

// Indexes for better search performance
mangaSchema.index({ title: 'text', author: 'text', description: 'text' });
mangaSchema.index({ genres: 1 });
mangaSchema.index({ status: 1 });
mangaSchema.index({ 'rating.average': -1 });
mangaSchema.index({ 'popularity.views': -1 });
mangaSchema.index({ createdAt: -1 });
mangaSchema.index({ featured: 1 });

// Pre-save middleware to update lastUpdated
mangaSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

export default mongoose.model('Manga', mangaSchema);