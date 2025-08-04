import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  mangaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Manga',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 10
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxLength: 100
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxLength: 2000
  },
  pros: [{
    type: String,
    trim: true,
    maxLength: 200
  }],
  cons: [{
    type: String,
    trim: true,
    maxLength: 200
  }],
  spoiler: {
    type: Boolean,
    default: false
  },
  chaptersRead: {
    type: Number,
    min: 0
  },
  readingStatus: {
    type: String,
    enum: ['reading', 'completed', 'dropped', 'on-hold'],
    required: true
  },
  helpfulness: {
    helpful: {
      type: Number,
      default: 0
    },
    notHelpful: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      default: 0
    },
    votes: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      type: {
        type: String,
        enum: ['helpful', 'not-helpful']
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  moderation: {
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged'],
      default: 'approved'
    },
    moderatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    moderatedAt: Date,
    moderationReason: String,
    flags: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      reason: {
        type: String,
        enum: ['spam', 'inappropriate', 'spoiler', 'off-topic', 'harassment'],
        required: true
      },
      flaggedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  replies: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxLength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  featured: {
    type: Boolean,
    default: false
  },
  verified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure one review per user per manga
reviewSchema.index({ mangaId: 1, userId: 1 }, { unique: true });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ 'helpfulness.total': -1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ 'moderation.status': 1 });
reviewSchema.index({ featured: 1 });

// Virtual for helpfulness ratio
reviewSchema.virtual('helpfulnessRatio').get(function() {
  if (this.helpfulness.total === 0) return 0;
  return (this.helpfulness.helpful / this.helpfulness.total) * 100;
});

// Virtual for reply count
reviewSchema.virtual('replyCount').get(function() {
  return this.replies.length;
});

// Method to vote on review helpfulness
reviewSchema.methods.voteHelpfulness = function(userId, voteType) {
  // Remove existing vote if any
  this.helpfulness.votes = this.helpfulness.votes.filter(
    vote => vote.userId.toString() !== userId.toString()
  );
  
  // Add new vote
  this.helpfulness.votes.push({
    userId,
    type: voteType
  });
  
  // Recalculate totals
  this.helpfulness.helpful = this.helpfulness.votes.filter(v => v.type === 'helpful').length;
  this.helpfulness.notHelpful = this.helpfulness.votes.filter(v => v.type === 'not-helpful').length;
  this.helpfulness.total = this.helpfulness.votes.length;
  
  return this.save();
};

// Method to add reply
reviewSchema.methods.addReply = function(userId, content) {
  this.replies.push({
    userId,
    content
  });
  
  return this.save();
};

// Method to flag review
reviewSchema.methods.flag = function(userId, reason) {
  // Check if user already flagged this review
  const existingFlag = this.moderation.flags.find(
    flag => flag.userId.toString() === userId.toString()
  );
  
  if (!existingFlag) {
    this.moderation.flags.push({
      userId,
      reason
    });
    
    // If multiple flags, change status to flagged
    if (this.moderation.flags.length >= 3) {
      this.moderation.status = 'flagged';
    }
  }
  
  return this.save();
};

export default mongoose.model('Review', reviewSchema);