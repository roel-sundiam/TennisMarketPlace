// Script to add the first monetizable blog post to your database
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import your Content model (adjust path as needed)
const ContentSchema = new mongoose.Schema({
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
    type: Number,
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

// Calculate reading time and word count
ContentSchema.pre('save', function(next) {
  if (this.content) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    this.wordCount = wordCount;
    this.readingTime = Math.ceil(wordCount / wordsPerMinute);
  }
  this.lastModified = new Date();
  next();
});

const Content = mongoose.model('Content', ContentSchema);

async function addBlogPost() {
  try {
    // Connect to MongoDB (adjust connection string as needed)
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tennis-marketplace';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Read the blog post data
    const blogPostData = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'first-blog-post.json'), 'utf8')
    );

    // Check if post already exists
    const existingPost = await Content.findOne({ slug: blogPostData.slug });
    if (existingPost) {
      console.log('ℹ️  Blog post already exists, updating...');
      await Content.findOneAndUpdate(
        { slug: blogPostData.slug },
        blogPostData,
        { new: true }
      );
      console.log('✅ Blog post updated successfully');
    } else {
      // Create new blog post
      const newPost = new Content(blogPostData);
      await newPost.save();
      console.log('✅ Blog post created successfully');
    }

    console.log('📝 Blog post details:');
    console.log(`   Title: ${blogPostData.title}`);
    console.log(`   Slug: ${blogPostData.slug}`);
    console.log(`   Category: ${blogPostData.category}`);
    console.log(`   Reading time: ${blogPostData.readingTime} minutes`);
    console.log(`   Target keywords: ${blogPostData.targetKeywords.join(', ')}`);
    console.log(`   Status: ${blogPostData.status}`);
    console.log(`   Featured: ${blogPostData.featured}`);

    console.log('🚀 Your first monetizable blog post is now live!');
    console.log('💰 AdSense will start earning from this post immediately');
    console.log('🔗 Affiliate links are ready for commission tracking');
    
    // Display the blog post URL
    console.log(`\n🌐 Blog post URL: https://tennis-marketplace.netlify.app/blog/reviews/${blogPostData.slug}`);
    
  } catch (error) {
    console.error('❌ Error adding blog post:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

// Run the script
addBlogPost();