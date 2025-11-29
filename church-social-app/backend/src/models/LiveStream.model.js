import mongoose from 'mongoose';

const liveStreamSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Stream title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  streamUrl: {
    type: String,
    required: [true, 'Stream URL is required'],
    trim: true
  },
  streamType: {
    type: String,
    enum: ['youtube', 'facebook', 'vimeo', 'custom'],
    default: 'youtube'
  },
  thumbnailUrl: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'ended'],
    default: 'scheduled'
  },
  scheduledFor: {
    type: Date,
    required: [true, 'Scheduled date is required']
  },
  startedAt: {
    type: Date
  },
  endedAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  viewers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  viewCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for finding active streams quickly
liveStreamSchema.index({ status: 1, scheduledFor: -1 });
liveStreamSchema.index({ createdBy: 1 });

const LiveStream = mongoose.model('LiveStream', liveStreamSchema);

export default LiveStream;
