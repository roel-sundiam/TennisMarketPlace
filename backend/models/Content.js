import mongoose from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['reviews', 'guides', 'philippines', 'advanced', 'seasonal'],
    trim: true
  },
  subcategory: {
    type: String,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  metaDescription: {
    type: String,
    required: true,
    maxlength: 160
  },
  tags: [{
    type: String,
    trim: true
  }],
  wordCount: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  affiliateLinks: [{
    text: String,
    url: String,
    product: String
  }],
  targetKeywords: [{
    type: String,
    trim: true
  }],
  readingTime: {
    type: Number, // in minutes
    default: 0
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  author: {
    type: String,
    default: 'Tennis Marketplace Team'
  },
  featured: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Calculate reading time based on content length
contentSchema.pre('save', function(next) {
  if (this.content) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    this.wordCount = wordCount;
    this.readingTime = Math.ceil(wordCount / wordsPerMinute);
  }
  this.lastModified = new Date();
  next();
});

// Virtual for URL-friendly slug
contentSchema.virtual('url').get(function() {
  return `/blog/${this.category}/${this.slug}`;
});

// Index for search and filtering
contentSchema.index({ category: 1, status: 1 });
contentSchema.index({ tags: 1 });
contentSchema.index({ publishedAt: -1 });
contentSchema.index({ title: 'text', content: 'text' });

// Add pagination plugin
contentSchema.plugin(mongoosePaginate);

const Content = mongoose.model('Content', contentSchema);

export default Content;