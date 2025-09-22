const express = require('express');
const SpecialCharges = require('../models/specialCharges.model.js');
const Provider = require('../models/provider.model.js');

const router = express.Router();

// Get all special charges
router.get('/', async (req, res) => {
  try {
    const { providerId, state, chargeType, isActive } = req.query;
    
    let filter = {};
    if (providerId) filter.providerId = parseInt(providerId);
    if (state) filter.state = new RegExp(state, 'i');
    if (chargeType) filter.chargeType = chargeType;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    
    const charges = await SpecialCharges.find(filter).sort({ providerId: 1, state: 1, chargeType: 1 });
    res.json(charges);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get special charges by provider and state
router.get('/provider/:providerId/state/:state', async (req, res) => {
  try {
    const { providerId, state } = req.params;
    const charges = await SpecialCharges.find({
      providerId: parseInt(providerId),
      state: new RegExp(state, 'i'),
      isActive: true
    });
    res.json(charges);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Calculate applicable special charges for a shipment
router.post('/calculate', async (req, res) => {
  try {
    const { providerId, state, shipmentDetails } = req.body;
    
    if (!providerId || !state || !shipmentDetails) {
      return res.status(400).json({ 
        success: false, 
        error: 'providerId, state, and shipmentDetails are required' 
      });
    }
    
    const result = await SpecialCharges.getApplicableCharges(
      parseInt(providerId), 
      state, 
      shipmentDetails
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create new special charge
router.post('/', async (req, res) => {
  try {
    const { 
      providerId, 
      providerName, 
      state, 
      chargeType, 
      amount, 
      isPercentage,
      minAmount,
      maxAmount,
      description, 
      conditions 
    } = req.body;
    
    // Validate required fields
    if (!providerId || !providerName || !state || !chargeType || amount === undefined || !description) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: providerId, providerName, state, chargeType, amount, description'
      });
    }
    
    // Check if provider exists
    const provider = await Provider.findOne({ providerId: parseInt(providerId) });
    if (!provider) {
      return res.status(404).json({
        success: false,
        error: 'Provider not found'
      });
    }
    
    // Check for duplicate special charge
    const existingCharge = await SpecialCharges.findOne({
      providerId: parseInt(providerId),
      state: state,
      chargeType: chargeType
    });
    
    if (existingCharge) {
      return res.status(400).json({
        success: false,
        error: 'Special charge already exists for this provider, state, and charge type'
      });
    }
    
    const newCharge = new SpecialCharges({
      providerId: parseInt(providerId),
      providerName,
      state,
      chargeType,
      amount: parseFloat(amount),
      isPercentage: isPercentage || false,
      minAmount: minAmount ? parseFloat(minAmount) : 0,
      maxAmount: maxAmount ? parseFloat(maxAmount) : null,
      description,
      conditions: conditions || {}
    });
    
    const savedCharge = await newCharge.save();
    res.status(201).json({ success: true, data: savedCharge });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Update special charge
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    
    // Convert numeric fields
    if (updateData.providerId) updateData.providerId = parseInt(updateData.providerId);
    if (updateData.amount !== undefined) updateData.amount = parseFloat(updateData.amount);
    if (updateData.minAmount !== undefined) updateData.minAmount = parseFloat(updateData.minAmount);
    if (updateData.maxAmount !== undefined) updateData.maxAmount = parseFloat(updateData.maxAmount);
    
    const updatedCharge = await SpecialCharges.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!updatedCharge) {
      return res.status(404).json({ success: false, error: 'Special charge not found' });
    }
    
    res.json({ success: true, data: updatedCharge });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Delete special charge
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedCharge = await SpecialCharges.findByIdAndDelete(id);
    
    if (!deletedCharge) {
      return res.status(404).json({ success: false, error: 'Special charge not found' });
    }
    
    res.json({ success: true, message: 'Special charge deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk create special charges
router.post('/bulk-create', async (req, res) => {
  try {
    const { charges } = req.body;
    
    if (!Array.isArray(charges)) {
      return res.status(400).json({ success: false, error: 'Charges must be an array' });
    }
    
    const results = {
      created: [],
      skipped: [],
      errors: []
    };
    
    for (const chargeData of charges) {
      try {
        // Check for duplicate
        const existing = await SpecialCharges.findOne({
          providerId: parseInt(chargeData.providerId),
          state: chargeData.state,
          chargeType: chargeData.chargeType
        });
        
        if (existing) {
          results.skipped.push({
            data: chargeData,
            reason: 'Already exists'
          });
          continue;
        }
        
        // Create new charge
        const newCharge = new SpecialCharges({
          ...chargeData,
          providerId: parseInt(chargeData.providerId),
          amount: parseFloat(chargeData.amount),
          minAmount: chargeData.minAmount ? parseFloat(chargeData.minAmount) : 0,
          maxAmount: chargeData.maxAmount ? parseFloat(chargeData.maxAmount) : null
        });
        
        const saved = await newCharge.save();
        results.created.push(saved);
        
      } catch (error) {
        results.errors.push({
          data: chargeData,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      data: results,
      summary: {
        total: charges.length,
        created: results.created.length,
        skipped: results.skipped.length,
        errors: results.errors.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Toggle active status
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;
    
    const charge = await SpecialCharges.findById(id);
    if (!charge) {
      return res.status(404).json({ success: false, error: 'Special charge not found' });
    }
    
    charge.isActive = !charge.isActive;
    await charge.save();
    
    res.json({ 
      success: true, 
      data: charge,
      message: `Special charge ${charge.isActive ? 'activated' : 'deactivated'}` 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get charge types enum
router.get('/charge-types', (req, res) => {
  const chargeTypes = [
    'GREEN_TAX',
    'AIR_SURCHARGE',
    'CITY_SURCHARGE',
    'WEIGHT_SURCHARGE',
    'FUEL_SURCHARGE',
    'DOCUMENTATION_FEE',
    'OTHER'
  ];
  
  res.json({
    success: true,
    data: chargeTypes
  });
});

module.exports = router;