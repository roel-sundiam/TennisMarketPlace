import express from 'express';
import { getCities, getRegions, getRegionByCity, getCitiesByRegion } from '../data/philippines-locations.js';

const router = express.Router();

// GET /api/locations/cities - Get all cities
router.get('/cities', async (req, res) => {
  try {
    const cities = getCities();
    res.json({
      success: true,
      data: cities,
      count: cities.length
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cities',
      error: error.message
    });
  }
});

// GET /api/locations/regions - Get all regions
router.get('/regions', async (req, res) => {
  try {
    const regions = getRegions();
    res.json({
      success: true,
      data: regions,
      count: regions.length
    });
  } catch (error) {
    console.error('Error fetching regions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch regions',
      error: error.message
    });
  }
});

// GET /api/locations/region/:city - Get region by city name
router.get('/region/:city', async (req, res) => {
  try {
    const { city } = req.params;
    
    if (!city || city.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'City parameter is required'
      });
    }

    const region = getRegionByCity(city.trim());
    
    if (!region) {
      return res.status(404).json({
        success: false,
        message: `Region not found for city: ${city}`
      });
    }

    res.json({
      success: true,
      data: {
        city: city.trim(),
        region: region
      }
    });
  } catch (error) {
    console.error('Error fetching region by city:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch region',
      error: error.message
    });
  }
});

// GET /api/locations/cities/:region - Get cities by region
router.get('/cities/:region', async (req, res) => {
  try {
    const { region } = req.params;
    
    if (!region || region.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Region parameter is required'
      });
    }

    const cities = getCitiesByRegion(region.trim());
    
    if (cities.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No cities found for region: ${region}`
      });
    }

    res.json({
      success: true,
      data: cities,
      count: cities.length,
      region: region.trim()
    });
  } catch (error) {
    console.error('Error fetching cities by region:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cities',
      error: error.message
    });
  }
});

// GET /api/locations/search - Search cities with optional filtering
router.get('/search', async (req, res) => {
  try {
    const { q, region, limit = 50 } = req.query;
    
    let cities = getCities();
    
    // Filter by search query if provided
    if (q && q.trim() !== '') {
      const searchTerm = q.trim().toLowerCase();
      cities = cities.filter(city => 
        city.toLowerCase().includes(searchTerm)
      );
    }
    
    // Filter by region if provided
    if (region && region.trim() !== '') {
      const citiesInRegion = getCitiesByRegion(region.trim());
      cities = cities.filter(city => citiesInRegion.includes(city));
    }
    
    // Limit results
    const limitNum = parseInt(limit, 10) || 50;
    if (limitNum > 0) {
      cities = cities.slice(0, limitNum);
    }
    
    res.json({
      success: true,
      data: cities,
      count: cities.length,
      query: q || '',
      region: region || ''
    });
  } catch (error) {
    console.error('Error searching cities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search cities',
      error: error.message
    });
  }
});

export default router;