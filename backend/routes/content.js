import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Content from '../models/Content.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all content posts with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const {
      category,
      status = 'published',
      page = 1,
      limit = 10,
      search,
      featured
    } = req.query;

    const query = {};
    
    if (category) query.category = category;
    if (status) query.status = status;
    if (featured !== undefined) query.featured = featured === 'true';
    
    if (search) {
      query.$text = { $search: search };
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { publishedAt: -1 },
      populate: []
    };

    const result = await Content.paginate(query, options);
    
    res.json({
      success: true,
      data: result.docs,
      pagination: {
        currentPage: result.page,
        totalPages: result.totalPages,
        totalItems: result.totalDocs,
        hasNext: result.hasNextPage,
        hasPrev: result.hasPrevPage
      }
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content',
      error: error.message
    });
  }
});

// Get content by slug
router.get('/slug/:slug', async (req, res) => {
  try {
    const content = await Content.findOne({ 
      slug: req.params.slug,
      status: 'published'
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Error fetching content by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content',
      error: error.message
    });
  }
});

// Admin routes (protected)
router.use(authenticate);
router.use(authorize(['admin']));

// Load content from markdown files (admin only)
router.get('/load-from-files', async (req, res) => {
  try {
    const contentDir = path.join(__dirname, '../../content');
    const categories = ['reviews', 'guides', 'philippines', 'advanced'];
    let loadedCount = 0;
    let errors = [];

    for (const category of categories) {
      const categoryPath = path.join(contentDir, category);
      
      if (!fs.existsSync(categoryPath)) {
        continue;
      }

      const files = fs.readdirSync(categoryPath).filter(file => file.endsWith('.md'));
      
      for (const file of files) {
        try {
          const filePath = path.join(categoryPath, file);
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Parse markdown content
          const lines = content.split('\n');
          const title = lines[0].replace('# ', '').trim();
          const metaLine = lines.find(line => line.startsWith('**Meta Description:**'));
          const metaDescription = metaLine ? metaLine.replace('**Meta Description:**', '').trim() : '';
          
          const slug = file.replace('.md', '');
          
          // Check if content already exists
          const existingContent = await Content.findOne({ slug });
          
          if (!existingContent) {
            await Content.create({
              title,
              slug,
              category,
              content,
              metaDescription: metaDescription || title.substring(0, 150),
              status: 'published',
              tags: [category, 'tennis', 'equipment'],
              priority: category === 'reviews' || category === 'guides' ? 'high' : 'medium'
            });
            loadedCount++;
          }
        } catch (fileError) {
          errors.push(`Error loading ${file}: ${fileError.message}`);
        }
      }
    }

    res.json({
      success: true,
      message: `Loaded ${loadedCount} content items`,
      loadedCount,
      errors
    });
  } catch (error) {
    console.error('Error loading content from files:', error);
    res.status(500).json({
      success: false,
      message: 'Error loading content from files',
      error: error.message
    });
  }
});

// Get content statistics (admin only)
router.get('/stats', async (req, res) => {
  try {
    const totalContent = await Content.countDocuments();
    const publishedContent = await Content.countDocuments({ status: 'published' });
    const draftContent = await Content.countDocuments({ status: 'draft' });
    
    const categoryStats = await Content.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const priorityStats = await Content.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    const totalWordCount = await Content.aggregate([
      { $group: { _id: null, totalWords: { $sum: '$wordCount' } } }
    ]);

    const recentContent = await Content.find()
      .sort({ publishedAt: -1 })
      .limit(5)
      .select('title category publishedAt wordCount');

    res.json({
      success: true,
      data: {
        overview: {
          total: totalContent,
          published: publishedContent,
          draft: draftContent,
          totalWords: totalWordCount[0]?.totalWords || 0
        },
        byCategory: categoryStats,
        byPriority: priorityStats,
        recent: recentContent
      }
    });
  } catch (error) {
    console.error('Error fetching content stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content statistics',
      error: error.message
    });
  }
});

// Get all content for admin (with all statuses)
router.get('/admin/all', async (req, res) => {
  try {
    const {
      category,
      status,
      page = 1,
      limit = 20,
      search
    } = req.query;

    const query = {};
    
    if (category) query.category = category;
    if (status) query.status = status;
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    const content = await Content.find(query)
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('title slug category status wordCount readingTime publishedAt priority featured');

    const total = await Content.countDocuments(query);

    res.json({
      success: true,
      data: content,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: (page * limit) < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching admin content:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content',
      error: error.message
    });
  }
});

// Get single content item (admin)
router.get('/admin/:id', async (req, res) => {
  try {
    const content = await Content.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: content
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content',
      error: error.message
    });
  }
});

// Create new content (admin)
router.post('/admin', async (req, res) => {
  try {
    const content = new Content(req.body);
    await content.save();

    res.status(201).json({
      success: true,
      data: content,
      message: 'Content created successfully'
    });
  } catch (error) {
    console.error('Error creating content:', error);
    res.status(400).json({
      success: false,
      message: 'Error creating content',
      error: error.message
    });
  }
});

// Update content (admin)
router.put('/admin/:id', async (req, res) => {
  try {
    const content = await Content.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: content,
      message: 'Content updated successfully'
    });
  } catch (error) {
    console.error('Error updating content:', error);
    res.status(400).json({
      success: false,
      message: 'Error updating content',
      error: error.message
    });
  }
});

// Delete content (admin)
router.delete('/admin/:id', async (req, res) => {
  try {
    const content = await Content.findByIdAndDelete(req.params.id);

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    res.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting content:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting content',
      error: error.message
    });
  }
});

export default router;