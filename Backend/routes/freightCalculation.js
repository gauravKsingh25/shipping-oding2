const router = require('express').Router();
const FreightCalculationService = require('../services/freightCalculationService');

/**
 * POST /api/freight/calculate
 * Calculate freight for a specific provider
 * 
 * Body:
 * {
 *   "providerId": 1 or "providerName": "Gatti Cargo",
 *   "weight": 10,
 *   "length": 40,
 *   "width": 30,
 *   "height": 20,
 *   "state": "Maharashtra",
 *   "city": "Mumbai" (optional),
 *   "invoiceValue": 15000,
 *   "isCOD": false,
 *   "codAmount": 0
 * }
 */
router.post('/calculate', async (req, res) => {
  try {
    const shipmentData = req.body;

    // Validate required fields
    if (!shipmentData.weight || !shipmentData.length || !shipmentData.width || !shipmentData.height) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: weight, length, width, height'
      });
    }

    if (!shipmentData.providerId && !shipmentData.providerName) {
      return res.status(400).json({
        success: false,
        error: 'Either providerId or providerName is required'
      });
    }

    if (!shipmentData.state && !shipmentData.city) {
      return res.status(400).json({
        success: false,
        error: 'Either state or city is required'
      });
    }

    const result = await FreightCalculationService.calculateFreight(shipmentData);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Freight calculation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/freight/compare
 * Compare freight across all providers
 * 
 * Body:
 * {
 *   "weight": 10,
 *   "length": 40,
 *   "width": 30,
 *   "height": 20,
 *   "state": "Maharashtra",
 *   "invoiceValue": 15000
 * }
 */
router.post('/compare', async (req, res) => {
  try {
    const shipmentData = req.body;

    // Validate required fields
    if (!shipmentData.weight || !shipmentData.length || !shipmentData.width || !shipmentData.height) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: weight, length, width, height'
      });
    }

    if (!shipmentData.state && !shipmentData.city) {
      return res.status(400).json({
        success: false,
        error: 'Either state or city is required'
      });
    }

    const result = await FreightCalculationService.compareAllProviders(shipmentData);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Freight comparison error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/freight/test
 * Test endpoint with sample data
 */
router.get('/test', async (req, res) => {
  try {
    const testShipment = {
      providerName: 'Gatti Cargo',
      weight: 5,
      length: 30,
      width: 20,
      height: 15,
      state: 'Maharashtra',
      invoiceValue: 10000,
      isCOD: false
    };

    const result = await FreightCalculationService.calculateFreight(testShipment);
    res.json({
      message: 'Test freight calculation',
      testData: testShipment,
      result: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
