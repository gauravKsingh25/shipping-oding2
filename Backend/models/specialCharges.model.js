const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const specialChargesSchema = new Schema({
  providerId: { type: Number, required: true },
  providerName: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  chargeType: { 
    type: String, 
    required: true,
    enum: ['GREEN_TAX', 'AIR_SURCHARGE', 'CITY_SURCHARGE', 'WEIGHT_SURCHARGE', 'FUEL_SURCHARGE', 'DOCUMENTATION_FEE', 'OTHER']
  },
  amount: { type: Number, required: true },
  isPercentage: { type: Boolean, default: false }, // true if amount is a percentage, false if fixed amount
  minAmount: { type: Number, default: 0 }, // minimum charge if percentage-based
  maxAmount: { type: Number, default: null }, // maximum charge if percentage-based
  description: { type: String, required: true, trim: true },
  conditions: {
    minWeight: { type: Number, default: null },
    maxWeight: { type: Number, default: null },
    cities: [{ type: String, trim: true }], // specific cities where this charge applies
    serviceType: { type: String, enum: ['SURFACE', 'AIR', 'EXPRESS', 'ALL'], default: 'ALL' }
  },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
});

// Create compound index for efficient queries
specialChargesSchema.index({ providerId: 1, state: 1, chargeType: 1 });
specialChargesSchema.index({ providerName: 1, state: 1, isActive: 1 });

// Pre-save middleware to validate data
specialChargesSchema.pre('save', function(next) {
  // Ensure amount is positive
  if (this.amount <= 0) {
    next(new Error('Amount must be positive'));
    return;
  }
  
  // Validate percentage-based charges
  if (this.isPercentage && this.amount > 100) {
    next(new Error('Percentage amount cannot exceed 100%'));
    return;
  }
  
  next();
});

// Instance method to calculate charge based on shipment details
specialChargesSchema.methods.calculateCharge = function(shipmentDetails) {
  const { baseAmount = 0, weight = 0, serviceType = 'SURFACE', city = '' } = shipmentDetails;
  
  // Check if this charge is active
  if (!this.isActive) return 0;
  
  // Check weight conditions
  if (this.conditions.minWeight && weight < this.conditions.minWeight) return 0;
  if (this.conditions.maxWeight && weight > this.conditions.maxWeight) return 0;
  
  // Check service type conditions
  if (this.conditions.serviceType !== 'ALL' && 
      this.conditions.serviceType !== serviceType) return 0;
  
  // Check city conditions
  if (this.conditions.cities && this.conditions.cities.length > 0) {
    const cityMatch = this.conditions.cities.some(conditionCity => 
      city.toLowerCase().includes(conditionCity.toLowerCase()) ||
      conditionCity.toLowerCase().includes(city.toLowerCase())
    );
    if (!cityMatch) return 0;
  }
  
  let calculatedCharge = 0;
  
  if (this.isPercentage) {
    // Calculate percentage-based charge
    calculatedCharge = (baseAmount * this.amount) / 100;
    
    // Apply min/max limits
    if (this.minAmount && calculatedCharge < this.minAmount) {
      calculatedCharge = this.minAmount;
    }
    if (this.maxAmount && calculatedCharge > this.maxAmount) {
      calculatedCharge = this.maxAmount;
    }
  } else {
    // Fixed amount charge
    calculatedCharge = this.amount;
  }
  
  return Math.round(calculatedCharge * 100) / 100; // Round to 2 decimal places
};

// Static method to get applicable special charges for a shipment
specialChargesSchema.statics.getApplicableCharges = async function(providerId, state, shipmentDetails) {
  const charges = await this.find({
    providerId: providerId,
    state: state,
    isActive: true
  });
  
  const applicableCharges = [];
  let totalSpecialCharge = 0;
  
  for (const charge of charges) {
    const chargeAmount = charge.calculateCharge(shipmentDetails);
    if (chargeAmount > 0) {
      applicableCharges.push({
        type: charge.chargeType,
        description: charge.description,
        amount: chargeAmount,
        originalCharge: charge
      });
      totalSpecialCharge += chargeAmount;
    }
  }
  
  return {
    charges: applicableCharges,
    totalAmount: Math.round(totalSpecialCharge * 100) / 100
  };
};

const SpecialCharges = mongoose.model('SpecialCharges', specialChargesSchema);

module.exports = SpecialCharges;