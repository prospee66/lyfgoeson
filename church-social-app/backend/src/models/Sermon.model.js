import mongoose from 'mongoose';

const sermonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Sermon title is required'],
    trim: true
  },
  description: {
    type: String,
    maxlength: 2000
  },
  pastor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sermonDate: {
    type: Date,
    required: [true, 'Sermon date is required']
  },
  series: {
    type: String,
    trim: true
  },
  scripture: [{
    book: String,
    chapter: Number,
    verseStart: Number,
    verseEnd: Number,
    text: String
  }],
  mediaType: {
    type: String,
    enum: ['video', 'audio', 'both'],
    required: true
  },
  videoUrl: {
    type: String
  },
  audioUrl: {
    type: String
  },
  youtubeVideoUrl: {
    type: String,
    default: null
  },
  thumbnail: {
    type: String,
    default: ''
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comment: {
      type: String,
      required: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  downloads: {
    type: Number,
    default: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  isFeatured: {
    type: Boolean,
    default: false
  },
  transcription: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster queries
sermonSchema.index({ pastor: 1, sermonDate: -1 });
sermonSchema.index({ series: 1 });
sermonSchema.index({ sermonDate: -1 });

const Sermon = mongoose.model('Sermon', sermonSchema);

export default Sermon;
