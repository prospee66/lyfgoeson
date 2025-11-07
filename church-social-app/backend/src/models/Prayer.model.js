import mongoose from 'mongoose';

const prayerSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Prayer title is required'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: [true, 'Prayer description is required'],
    maxlength: 2000
  },
  category: {
    type: String,
    enum: ['healing', 'guidance', 'thanksgiving', 'intercession', 'personal', 'family', 'church', 'other'],
    default: 'personal'
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  isUrgent: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'answered', 'ongoing'],
    default: 'active'
  },
  prayerCount: {
    type: Number,
    default: 0
  },
  prayedBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    prayedAt: {
      type: Date,
      default: Date.now
    }
  }],
  responses: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: {
      type: String,
      required: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  testimony: {
    type: String,
    maxlength: 1000
  },
  isPublic: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index for faster queries
prayerSchema.index({ author: 1, createdAt: -1 });
prayerSchema.index({ category: 1 });
prayerSchema.index({ status: 1 });

const Prayer = mongoose.model('Prayer', prayerSchema);

export default Prayer;
