import mongoose from 'mongoose';

const chapterSchema = new mongoose.Schema({
  mangaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manga',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  chapterNumber: {
    type: Number,
    required: true,
    min: 0
  },
  volume: {
    type: Number,
    min: 1
  },
  pages: [{
    pageNumber: {
      type: Number,
      required: true
    },
    imageUrl: {
      type: String,
      required: true
    },
    width: Number,
    height: Number
  }],
  pageCount: {
    type: Number,
    default: 0
  },
  releaseDate: {
    type: Date,
    default: Date.now
  },
  translator: {
    type: String,
    trim: true
  },
  translatorGroup: {
    type: String,
    trim: true
  },
  language: {
    type: String,
    default: 'English'
  },
  views: {
    type: Number,
    default: 0
  },
  published: {
    type: Boolean,
    default: true
  },
  featured: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    maxLength: 500
  },
  watermark: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for manga and chapter number (unique per manga)
chapterSchema.index({ mangaId: 1, chapterNumber: 1 }, { unique: true });
chapterSchema.index({ releaseDate: -1 });
chapterSchema.index({ views: -1 });
chapterSchema.index({ published: 1 });

// Pre-save middleware to update page count
chapterSchema.pre('save', function(next) {
  this.pageCount = this.pages.length;
  next();
});

// Virtual for next chapter
chapterSchema.virtual('nextChapter').get(function() {
  return this.chapterNumber + 1;
});

// Virtual for previous chapter
chapterSchema.virtual('previousChapter').get(function() {
  return this.chapterNumber > 1 ? this.chapterNumber - 1 : null;
});

export default mongoose.model('Chapter', chapterSchema);