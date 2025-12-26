/**
 * Freight Charge Calculator Utility
 * Calculates shipping charges for different courier partners
 */

/**
 * Calculate volumetric weight based on dimensions and divisor
 * @param {number} length - Length in cm
 * @param {number} width - Width in cm
 * @param {number} height - Height in cm
 * @param {number} divisor - Volumetric divisor (varies by courier)
 * @returns {number} Volumetric weight in kg
 */
function calculateVolumetricWeight(length, width, height, divisor = 27000) {
  const baseWeight = (length * width * height) / divisor;
  // For 27000 divisor (6 CFT), multiply by 6 as per requirement
  // Don't touch divisors around 4500, 4750, 5000
  if (divisor === 27000) {
    return baseWeight * 6;
  }
  return baseWeight;
}

/**
 * Calculate chargeable weight (max of actual, volumetric, and minimum weight)
 * @param {number} actualWeight - Actual weight in kg
 * @param {number} volumetricWeight - Volumetric weight in kg
 * @param {number} minimumWeight - Minimum chargeable weight in kg
 * @returns {number} Chargeable weight in kg
 */
function calculateChargeableWeight(actualWeight, volumetricWeight, minimumWeight = 0) {
  const maxWeight = Math.max(actualWeight, volumetricWeight);
  return Math.max(maxWeight, minimumWeight);
}

/**
 * Calculate base freight charges
 * @param {number} chargeableWeight - Chargeable weight in kg
 * @param {number} perKiloRate - Rate per kg
 * @returns {number} Base freight charge
 */
function calculateBaseFreight(chargeableWeight, perKiloRate) {
  return chargeableWeight * perKiloRate;
}

/**
 * Calculate fuel surcharge
 * @param {number} baseFreight - Base freight amount
 * @param {number} fuelSurchargePercent - Fuel surcharge percentage (0.15 = 15%)
 * @returns {number} Fuel surcharge amount
 */
function calculateFuelSurcharge(baseFreight, fuelSurchargePercent) {
  return baseFreight * fuelSurchargePercent;
}

/**
 * Calculate insurance charge
 * @param {number} invoiceValue - Invoice value of goods
 * @param {number} insurancePercent - Insurance percentage (0.01 = 1%)
 * @returns {number} Insurance charge amount
 */
function calculateInsuranceCharge(invoiceValue, insurancePercent) {
  return invoiceValue * insurancePercent;
}

/**
 * Calculate GST
 * @param {number} totalAmount - Total amount before GST
 * @param {number} gstPercent - GST percentage (0.18 = 18%)
 * @returns {number} GST amount
 */
function calculateGST(totalAmount, gstPercent = 0.18) {
  return totalAmount * gstPercent;
}

/**
 * Complete freight calculation
 * @param {Object} shipmentDetails - Shipment details
 * @param {Object} courierConfig - Courier configuration
 * @returns {Object} Detailed breakdown of charges
 */
function calculateTotalFreight(shipmentDetails, courierConfig) {
  const {
    weight,
    length,
    width,
    height,
    invoiceValue = 0,
    codAmount = 0,
    destination
  } = shipmentDetails;

  const {
    volumetricDivisor,
    minimumChargeableWeight,
    perKiloFee,
    fuelSurcharge,
    docketCharge,
    codCharge,
    insuranceChargePercent,
    greenTax = 0,
    gstPercent = 0.18
  } = courierConfig;

  // Step 1: Calculate volumetric weight
  const volumetricWeight = calculateVolumetricWeight(length, width, height, volumetricDivisor);

  // Step 2: Calculate chargeable weight
  const chargeableWeight = calculateChargeableWeight(weight, volumetricWeight, minimumChargeableWeight);

  // Step 3: Calculate base freight
  const baseFreight = calculateBaseFreight(chargeableWeight, perKiloFee);

  // Step 4: Calculate fuel surcharge
  const fuelSurchargeAmount = calculateFuelSurcharge(baseFreight, fuelSurcharge);

  // Step 5: Total freight (base + fuel)
  const totalFreight = baseFreight + fuelSurchargeAmount;

  // Step 6: Add docket charge
  const subtotal = totalFreight + docketCharge;

  // Step 7: Add COD charge if applicable
  const codChargeAmount = codAmount > 0 ? codCharge : 0;

  // Step 8: Add insurance charge
  const insuranceAmount = calculateInsuranceCharge(invoiceValue, insuranceChargePercent);

  // Step 9: Add green tax if applicable
  const greenTaxAmount = greenTax;

  // Step 10: Calculate subtotal before GST
  const subtotalBeforeGST = subtotal + codChargeAmount + insuranceAmount + greenTaxAmount;

  // Step 11: Calculate GST
  const gstAmount = calculateGST(subtotalBeforeGST, gstPercent);

  // Step 12: Grand total
  const grandTotal = subtotalBeforeGST + gstAmount;

  return {
    weightCalculation: {
      actualWeight: weight,
      volumetricWeight: volumetricWeight.toFixed(2),
      chargeableWeight: chargeableWeight.toFixed(2),
      minimumWeight: minimumChargeableWeight
    },
    freightBreakdown: {
      baseFreight: baseFreight.toFixed(2),
      fuelSurcharge: fuelSurchargeAmount.toFixed(2),
      totalFreight: totalFreight.toFixed(2)
    },
    additionalCharges: {
      docketCharge: docketCharge.toFixed(2),
      codCharge: codChargeAmount.toFixed(2),
      insurance: insuranceAmount.toFixed(2),
      greenTax: greenTaxAmount.toFixed(2)
    },
    tax: {
      subtotalBeforeGST: subtotalBeforeGST.toFixed(2),
      gst: gstAmount.toFixed(2),
      gstPercent: (gstPercent * 100) + '%'
    },
    total: {
      grandTotal: grandTotal.toFixed(2)
    }
  };
}

// Export functions
module.exports = {
  calculateVolumetricWeight,
  calculateChargeableWeight,
  calculateBaseFreight,
  calculateFuelSurcharge,
  calculateInsuranceCharge,
  calculateGST,
  calculateTotalFreight
};

// Example usage if run directly
if (require.main === module) {
  console.log('📦 Freight Calculator Utility\n');
  
  // Example shipment
  const shipment = {
    weight: 5,
    length: 30,
    width: 20,
    height: 15,
    invoiceValue: 10000,
    codAmount: 0,
    destination: 'Mumbai'
  };

  // Example courier config (Gatti Cargo)
  const courierConfig = {
    volumetricDivisor: 27000,
    minimumChargeableWeight: 6,
    perKiloFee: 8.5,
    fuelSurcharge: 0.15,
    docketCharge: 50,
    codCharge: 50,
    insuranceChargePercent: 0.01,
    greenTax: 0,
    gstPercent: 0.18
  };

  const result = calculateTotalFreight(shipment, courierConfig);
  
  console.log('Sample Calculation:');
  console.log(JSON.stringify(result, null, 2));
}
