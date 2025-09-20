import express from 'express';
import BrandModel from '../models/BrandModel.js';

const router = express.Router();

// GET /api/brands - Get all brands grouped by category
router.get('/', async (req, res) => {
  try {
    const groupedBrands = await BrandModel.getAllBrandsGrouped();
    
    // Transform to easier format for frontend
    const result = {};
    groupedBrands.forEach(item => {
      result[item.category] = item.brands.map(b => b.brand);
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching grouped brands:', error);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

// GET /api/brands/:category - Get brands for specific category
router.get('/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    // Validate category
    const validCategories = ['Racquets', 'Pickleball Paddles', 'Strings', 'Bags', 'Balls', 'Pickleball Balls', 'Shoes', 'Apparel', 'Accessories'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    const brands = await BrandModel.getBrandsByCategory(category);
    
    // Return just brand names for simplicity
    const brandNames = brands.map(b => b.brand);
    
    res.json({
      category: category,
      brands: brandNames
    });
  } catch (error) {
    console.error('Error fetching brands for category:', error);
    res.status(500).json({ error: 'Failed to fetch brands for category' });
  }
});

// GET /api/brands/:category/:brand/models - Get models for specific brand and category
router.get('/:category/:brand/models', async (req, res) => {
  try {
    const { category, brand } = req.params;
    
    // Validate category
    const validCategories = ['Racquets', 'Pickleball Paddles', 'Strings', 'Bags', 'Balls', 'Pickleball Balls', 'Shoes', 'Apparel', 'Accessories'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category' });
    }
    
    const brandData = await BrandModel.getModelsByBrand(category, brand);
    
    if (!brandData) {
      return res.status(404).json({ error: 'Brand not found for this category' });
    }
    
    // Filter active models and sort by popularity and name
    const models = brandData.models
      .filter(m => !m.discontinued)
      .sort((a, b) => {
        // Popular models first, then alphabetical
        if (a.isPopular && !b.isPopular) return -1;
        if (!a.isPopular && b.isPopular) return 1;
        return a.name.localeCompare(b.name);
      })
      .map(m => m.name);
    
    res.json({
      category: category,
      brand: brand,
      models: models
    });
  } catch (error) {
    console.error('Error fetching models for brand:', error);
    res.status(500).json({ error: 'Failed to fetch models for brand' });
  }
});

// POST /api/brands - Create new brand (admin only)
router.post('/', async (req, res) => {
  try {
    const { category, brand, models = [], logo, website } = req.body;
    
    // Check if brand already exists for this category
    const existingBrand = await BrandModel.findOne({ category, brand });
    if (existingBrand) {
      return res.status(409).json({ error: 'Brand already exists for this category' });
    }
    
    // Create new brand
    const newBrand = new BrandModel({
      category,
      brand,
      models: models.map(model => ({
        name: typeof model === 'string' ? model : model.name,
        isPopular: typeof model === 'object' ? model.isPopular || false : false,
        year: typeof model === 'object' ? model.year : null
      })),
      logo,
      website
    });
    
    await newBrand.save();
    
    res.status(201).json({
      message: 'Brand created successfully',
      brand: newBrand
    });
  } catch (error) {
    console.error('Error creating brand:', error);
    res.status(500).json({ error: 'Failed to create brand' });
  }
});

// PUT /api/brands/:id/models - Add model to existing brand
router.put('/:id/models', async (req, res) => {
  try {
    const { id } = req.params;
    const { model, isPopular = false, year = null } = req.body;
    
    if (!model) {
      return res.status(400).json({ error: 'Model name is required' });
    }
    
    const brandData = await BrandModel.findById(id);
    if (!brandData) {
      return res.status(404).json({ error: 'Brand not found' });
    }
    
    const modelAdded = brandData.addModel(model, isPopular, year);
    if (!modelAdded) {
      return res.status(409).json({ error: 'Model already exists' });
    }
    
    await brandData.save();
    
    res.json({
      message: 'Model added successfully',
      brand: brandData
    });
  } catch (error) {
    console.error('Error adding model:', error);
    res.status(500).json({ error: 'Failed to add model' });
  }
});

// DELETE /api/brands/:id/models/:modelName - Remove model from brand
router.delete('/:id/models/:modelName', async (req, res) => {
  try {
    const { id, modelName } = req.params;

    const brandData = await BrandModel.findById(id);
    if (!brandData) {
      return res.status(404).json({ error: 'Brand not found' });
    }

    const modelRemoved = brandData.removeModel(modelName);
    if (!modelRemoved) {
      return res.status(404).json({ error: 'Model not found' });
    }

    await brandData.save();

    res.json({
      message: 'Model removed successfully',
      brand: brandData
    });
  } catch (error) {
    console.error('Error removing model:', error);
    res.status(500).json({ error: 'Failed to remove model' });
  }
});

// GET /api/brands/pickleball/search - Advanced search for pickleball paddles
router.get('/pickleball/search', async (req, res) => {
  try {
    const filters = {};

    // Parse query parameters for pickleball specifications
    if (req.query.paddleType) filters.paddleType = req.query.paddleType;
    if (req.query.weight) filters.weight = req.query.weight;
    if (req.query.surface) filters.surface = req.query.surface;
    if (req.query.gripSize) filters.gripSize = req.query.gripSize;
    if (req.query.coreType) filters.coreType = req.query.coreType;
    if (req.query.usapaApproved !== undefined) {
      filters.usapaApproved = req.query.usapaApproved === 'true';
    }

    const results = await BrandModel.searchPickleballPaddles(filters);

    res.json({
      filters: filters,
      results: results
    });
  } catch (error) {
    console.error('Error searching pickleball paddles:', error);
    res.status(500).json({ error: 'Failed to search pickleball paddles' });
  }
});

// GET /api/brands/pickleball/specifications - Get available specification options
router.get('/pickleball/specifications', async (req, res) => {
  try {
    const specifications = await BrandModel.getPickleballSpecifications();

    res.json({
      specifications: specifications.length > 0 ? specifications[0] : {
        paddleTypes: [],
        weights: [],
        surfaces: [],
        gripSizes: [],
        coreTypes: [],
        shapes: []
      }
    });
  } catch (error) {
    console.error('Error fetching pickleball specifications:', error);
    res.status(500).json({ error: 'Failed to fetch specifications' });
  }
});

// GET /api/brands/tennis/search - Advanced search for tennis rackets
router.get('/tennis/search', async (req, res) => {
  try {
    const filters = {};

    // Parse query parameters for tennis racket specifications
    if (req.query.headSize) filters.headSize = req.query.headSize;
    if (req.query.racketWeight) filters.racketWeight = req.query.racketWeight;
    if (req.query.stringPattern) filters.stringPattern = req.query.stringPattern;
    if (req.query.balance) filters.balance = req.query.balance;
    if (req.query.stiffness) filters.stiffness = req.query.stiffness;
    if (req.query.swingWeight) filters.swingWeight = req.query.swingWeight;
    if (req.query.playerLevel) filters.playerLevel = req.query.playerLevel;
    if (req.query.playStyle) filters.playStyle = req.query.playStyle;

    const results = await BrandModel.searchTennisRackets(filters);

    res.json({
      filters: filters,
      results: results
    });
  } catch (error) {
    console.error('Error searching tennis rackets:', error);
    res.status(500).json({ error: 'Failed to search tennis rackets' });
  }
});

// GET /api/brands/tennis/specifications - Get available tennis racket specification options
router.get('/tennis/specifications', async (req, res) => {
  try {
    const specifications = await BrandModel.getTennisRacketSpecifications();

    res.json({
      specifications: specifications.length > 0 ? specifications[0] : {
        headSizes: [],
        racketWeights: [],
        stringPatterns: [],
        balances: [],
        stiffnesses: [],
        swingWeights: [],
        playerLevels: [],
        playStyles: []
      }
    });
  } catch (error) {
    console.error('Error fetching tennis racket specifications:', error);
    res.status(500).json({ error: 'Failed to fetch tennis specifications' });
  }
});

export default router;