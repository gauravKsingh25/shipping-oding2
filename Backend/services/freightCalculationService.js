const Provider = require('../models/provider.model');
const StatewiseCharges = require('../models/statewiseCharges.model');
const FixedCharges = require('../models/fixedCharges.model');
const SpecialCharges = require('../models/specialCharges.model');

/**
 * Freight Calculation Service
 * Handles all freight calculations with proper weight selection logic
 */

class FreightCalculationService {
  /**
   * Calculate volumetric weight
   * @param {number} length - Length in cm
   * @param {number} width - Width in cm
   * @param {number} height - Height in cm
   * @param {number} divisor - Volumetric divisor
   * @returns {number} Volumetric weight in kg
   */
  static calculateVolumetricWeight(length, width, height, divisor) {
    if (!length || !width || !height || !divisor) {
      return 0;
    }
    const baseWeight = (length * width * height) / divisor;
    // For 27000 divisor (6 CFT), multiply by 6 as per requirement
    // Don't touch divisors around 4500, 4750, 5000
    if (divisor === 27000) {
      return baseWeight * 6;
    }
    return baseWeight;
  }

  /**
   * Calculate chargeable weight
   * Logic: MAX(actual weight, volumetric weight, minimum chargeable weight)
   * @param {number} actualWeight - Actual weight in kg
   * @param {number} volumetricWeight - Volumetric weight in kg
   * @param {number} minimumWeight - Minimum chargeable weight in kg
   * @returns {Object} Weight calculation details
   */
  static calculateChargeableWeight(actualWeight, volumetricWeight, minimumWeight) {
    const weights = {
      actual: parseFloat(actualWeight) || 0,
      volumetric: parseFloat(volumetricWeight) || 0,
      minimum: parseFloat(minimumWeight) || 0
    };

    // Determine which weight is being used
    let chargeableWeight = weights.actual;
    let weightType = 'actual';

    // Check if volumetric is higher
    if (weights.volumetric > chargeableWeight) {
      chargeableWeight = weights.volumetric;
      weightType = 'volumetric';
    }

    // Check if minimum is higher
    if (weights.minimum > chargeableWeight) {
      chargeableWeight = weights.minimum;
      weightType = 'minimum';
    }

    return {
      actualWeight: weights.actual,
      volumetricWeight: weights.volumetric,
      minimumWeight: weights.minimum,
      chargeableWeight: chargeableWeight,
      weightUsed: weightType, // 'actual', 'volumetric', or 'minimum'
      calculation: `MAX(${weights.actual}, ${weights.volumetric.toFixed(2)}, ${weights.minimum}) = ${chargeableWeight.toFixed(2)} kg (${weightType})`
    };
  }

  /**
   * Calculate complete freight for a shipment
   * @param {Object} shipmentData - Shipment details
   * @returns {Object} Complete freight breakdown
   */
  static async calculateFreight(shipmentData) {
    try {
      const {
        providerId,
        providerName,
        weight,
        length,
        width,
        height,
        state,
        city,
        invoiceValue = 0,
        isCOD = false,
        codAmount = 0,
        insurancePercent = null // Insurance percentage from frontend (e.g., 1 for 1%, 0.5 for 0.5%)
      } = shipmentData;

      console.log('\n🔍 Starting Freight Calculation:');
      console.log(`Provider: ${providerName} (ID: ${providerId})`);
      console.log(`Dimensions: ${length}×${width}×${height} cm`);
      console.log(`Actual Weight: ${weight} kg`);
      console.log(`Destination: ${city || state}`);

      // Step 1: Get provider details
      const provider = await Provider.findOne({ 
        $or: [{ providerId }, { providerName }] 
      });

      if (!provider) {
        throw new Error(`Provider not found: ${providerName || providerId}`);
      }

      // Step 2: Get fixed charges (includes volumetric divisor and minimum weight)
      const fixedCharges = await FixedCharges.findOne({ 
        providerId: provider.providerId 
      });

      if (!fixedCharges) {
        throw new Error(`Fixed charges not found for ${provider.providerName}`);
      }

      console.log(`\n📦 Courier Configuration:`);
      console.log(`  Volumetric Divisor: ${fixedCharges.volumetricDivisor}`);
      console.log(`  Minimum Weight: ${fixedCharges.minimumChargeableWeight} kg`);

      // Step 3: Calculate volumetric weight
      const volumetricWeight = this.calculateVolumetricWeight(
        length,
        width,
        height,
        fixedCharges.volumetricDivisor
      );

      console.log(`\n⚖️  Weight Calculation:`);
      console.log(`  Volumetric Weight = (${length}×${width}×${height}) ÷ ${fixedCharges.volumetricDivisor}`);
      console.log(`  Volumetric Weight = ${volumetricWeight.toFixed(2)} kg`);

      // Step 4: Calculate chargeable weight
      const weightDetails = this.calculateChargeableWeight(
        weight,
        volumetricWeight,
        fixedCharges.minimumChargeableWeight
      );

      console.log(`\n✅ Chargeable Weight Decision:`);
      console.log(`  Actual Weight: ${weightDetails.actualWeight} kg`);
      console.log(`  Volumetric Weight: ${weightDetails.volumetricWeight.toFixed(2)} kg`);
      console.log(`  Minimum Weight: ${weightDetails.minimumWeight} kg`);
      console.log(`  → Using: ${weightDetails.chargeableWeight.toFixed(2)} kg (${weightDetails.weightUsed.toUpperCase()})`);

      // Step 5: Get state/city charges
      const destination = city || state;
      const stateCharges = await StatewiseCharges.findOne({
        providerId: provider.providerId,
        state: destination
      });

      if (!stateCharges) {
        throw new Error(`No rates found for ${destination} with ${provider.providerName}`);
      }

      console.log(`\n💰 Rate: ₹${stateCharges.perKiloFee}/kg`);
      console.log(`   Fuel Surcharge: ${(stateCharges.fuelSurcharge * 100)}%`);

      // Step 6: Calculate base freight
      const baseFreight = weightDetails.chargeableWeight * stateCharges.perKiloFee;
      const fuelSurcharge = baseFreight * stateCharges.fuelSurcharge;
      const totalFreight = baseFreight + fuelSurcharge;

      console.log(`\n📊 Freight Calculation:`);
      console.log(`  Base Freight = ${weightDetails.chargeableWeight.toFixed(2)} kg × ₹${stateCharges.perKiloFee} = ₹${baseFreight.toFixed(2)}`);
      console.log(`  Fuel Surcharge = ₹${baseFreight.toFixed(2)} × ${(stateCharges.fuelSurcharge * 100)}% = ₹${fuelSurcharge.toFixed(2)}`);
      console.log(`  Total Freight = ₹${totalFreight.toFixed(2)}`);

      // Step 7: Add fixed charges
      const docketCharge = fixedCharges.docketCharge || 0;
      const codCharge = (isCOD && codAmount > 0) ? fixedCharges.codCharge : 0;
      
      // Use insurance percent from frontend if provided, otherwise use database value
      // Frontend sends percentage as number (e.g., 1 for 1%, 0.5 for 0.5%)
      // Database stores as decimal (e.g., 0.01 for 1%)
      let insurancePercentToUse;
      let insuranceSource = 'database';
      
      if (insurancePercent !== null && insurancePercent !== undefined) {
        // Frontend provides percentage, convert to decimal
        insurancePercentToUse = insurancePercent / 100;
        insuranceSource = 'frontend';
      } else {
        // Use database value (already in decimal format)
        insurancePercentToUse = fixedCharges.insuranceChargePercent || 0;
      }
      
      const insurance = invoiceValue * insurancePercentToUse;

      // Step 8: Get special charges (green tax, etc.)
      const specialCharges = await SpecialCharges.find({
        providerId: provider.providerId,
        $or: [
          { state: destination },
          { state: 'ALL' }
        ],
        isActive: true
      });

      let greenTax = 0;
      let gstPercent = 0.18; // Default 18%
      const otherSpecialCharges = [];

      for (const charge of specialCharges) {
        if (charge.chargeType === 'GREEN_TAX') {
          greenTax += charge.amount;
        } else if (charge.chargeType === 'OTHER' && charge.description === 'GST') {
          gstPercent = charge.amount / 100; // Convert to decimal
        } else {
          otherSpecialCharges.push({
            type: charge.chargeType,
            description: charge.description,
            amount: charge.amount
          });
        }
      }

      // Step 9: Calculate subtotal before GST
      const subtotalBeforeGST = totalFreight + docketCharge + codCharge + insurance + greenTax;

      // Step 10: Calculate GST
      const gst = subtotalBeforeGST * gstPercent;

      // Step 11: Grand total
      const grandTotal = subtotalBeforeGST + gst;

      console.log(`\n💵 Additional Charges:`);
      console.log(`  Docket Charge: ₹${docketCharge.toFixed(2)}`);
      console.log(`  COD Charge: ₹${codCharge.toFixed(2)}`);
      console.log(`  Insurance: ₹${insurance.toFixed(2)}`);
      console.log(`  Green Tax: ₹${greenTax.toFixed(2)}`);
      console.log(`  Subtotal: ₹${subtotalBeforeGST.toFixed(2)}`);
      console.log(`  GST (${(gstPercent * 100)}%): ₹${gst.toFixed(2)}`);
      console.log(`  ────────────────────────`);
      console.log(`  GRAND TOTAL: ₹${grandTotal.toFixed(2)}`);

      // Return detailed breakdown
      return {
        success: true,
        provider: {
          id: provider.providerId,
          name: provider.providerName
        },
        shipment: {
          weight: weight,
          dimensions: { length, width, height },
          destination: destination
        },
        weightCalculation: {
          actualWeight: weightDetails.actualWeight,
          volumetricWeight: parseFloat(weightDetails.volumetricWeight.toFixed(2)),
          minimumWeight: weightDetails.minimumWeight,
          chargeableWeight: parseFloat(weightDetails.chargeableWeight.toFixed(2)),
          weightUsed: weightDetails.weightUsed,
          explanation: weightDetails.calculation,
          volumetricDivisor: fixedCharges.volumetricDivisor
        },
        charges: {
          perKiloRate: stateCharges.perKiloFee,
          baseFreight: parseFloat(baseFreight.toFixed(2)),
          fuelSurcharge: parseFloat(fuelSurcharge.toFixed(2)),
          fuelSurchargePercent: stateCharges.fuelSurcharge * 100,
          totalFreight: parseFloat(totalFreight.toFixed(2)),
          docketCharge: parseFloat(docketCharge.toFixed(2)),
          codCharge: parseFloat(codCharge.toFixed(2)),
          insurance: parseFloat(insurance.toFixed(2)),
          insurancePercent: parseFloat((insurancePercentToUse * 100).toFixed(4)),
          insuranceSource: insuranceSource, // 'frontend' or 'database'
          greenTax: parseFloat(greenTax.toFixed(2)),
          subtotalBeforeGST: parseFloat(subtotalBeforeGST.toFixed(2)),
          gst: parseFloat(gst.toFixed(2)),
          gstPercent: gstPercent * 100,
          grandTotal: parseFloat(grandTotal.toFixed(2))
        },
        specialCharges: otherSpecialCharges
      };

    } catch (error) {
      console.error('\n❌ Freight Calculation Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Compare freight across all providers for a shipment
   * @param {Object} shipmentData - Shipment details (without providerId)
   * @returns {Array} Array of freight calculations for all providers
   */
  static async compareAllProviders(shipmentData) {
    try {
      const providers = await Provider.find({ isActive: true }).sort({ providerId: 1 });
      const results = [];

      for (const provider of providers) {
        const calculation = await this.calculateFreight({
          ...shipmentData,
          providerId: provider.providerId,
          providerName: provider.providerName
        });

        if (calculation.success) {
          results.push(calculation);
        }
      }

      // Sort by grand total (cheapest first)
      results.sort((a, b) => a.charges.grandTotal - b.charges.grandTotal);

      return {
        success: true,
        shipment: shipmentData,
        totalProviders: results.length,
        results: results,
        cheapest: results[0] || null
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = FreightCalculationService;
