const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
const StatewiseCharges = require('../models/statewiseCharges.model');
const FixedCharges = require('../models/fixedCharges.model');
const SpecialCharges = require('../models/specialCharges.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

// Test shipment data
const testShipments = [
  {
    weight: 5,
    dimensions: { length: 30, width: 20, height: 15 },
    state: 'Maharashtra',
    description: 'Light package, small box'
  },
  {
    weight: 15,
    dimensions: { length: 50, width: 40, height: 30 },
    state: 'Delhi',
    description: 'Medium package'
  },
  {
    weight: 25,
    dimensions: { length: 100, width: 80, height: 60 },
    state: 'Karnataka',
    description: 'Heavy package, large box'
  },
  {
    weight: 2,
    dimensions: { length: 60, width: 60, height: 60 },
    state: 'Tamil Nadu',
    description: 'Very light but bulky'
  }
];

// Calculate volumetric weight
function calculateVolumetricWeight(length, width, height, divisor) {
  return (length * width * height) / divisor;
}

// Calculate chargeable weight
function calculateChargeableWeight(actualWeight, volumetricWeight, minimumWeight) {
  const maxWeight = Math.max(actualWeight, volumetricWeight);
  return Math.max(maxWeight, minimumWeight);
}

// Test individual courier
async function testCourier(providerId, providerName) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`Testing: ${providerName}`);
  console.log('='.repeat(70));

  try {
    // Get provider
    const provider = await Provider.findOne({ providerId });
    if (!provider) {
      console.log(`❌ Provider not found`);
      return { success: false, error: 'Provider not found' };
    }

    // Get fixed charges
    const fixedCharges = await FixedCharges.findOne({ providerId });
    if (!fixedCharges) {
      console.log(`❌ Fixed charges not found`);
      return { success: false, error: 'Fixed charges not found' };
    }

    console.log(`\n✅ Provider found: ${provider.providerName}`);
    console.log(`✅ Volumetric Divisor: ${fixedCharges.volumetricDivisor}`);
    console.log(`✅ Minimum Chargeable Weight: ${fixedCharges.minimumChargeableWeight} kg`);
    console.log(`✅ Docket Charge: ₹${fixedCharges.docketCharge}`);
    console.log(`✅ COD Charge: ₹${fixedCharges.codCharge}`);
    console.log(`✅ Fuel Surcharge: ${fixedCharges.fuelSurcharge || 0}%`);

    // Count statewise charges
    const statewiseCount = await StatewiseCharges.countDocuments({ providerId });
    console.log(`✅ Statewise Charges: ${statewiseCount} states/cities configured`);

    // Count special charges
    const specialCount = await SpecialCharges.countDocuments({ providerId });
    console.log(`✅ Special Charges: ${specialCount} special charges configured`);

    // Test with sample shipments
    console.log(`\n📦 Testing Shipment Calculations:`);
    console.log('-'.repeat(70));

    for (let i = 0; i < testShipments.length; i++) {
      const shipment = testShipments[i];
      const { weight, dimensions, state, description } = shipment;
      const { length, width, height } = dimensions;

      // Calculate volumetric weight
      const volumetricWeight = calculateVolumetricWeight(
        length,
        width,
        height,
        fixedCharges.volumetricDivisor
      );

      // Calculate chargeable weight
      const chargeableWeight = calculateChargeableWeight(
        weight,
        volumetricWeight,
        fixedCharges.minimumChargeableWeight
      );

      // Get state charges
      const stateCharge = await StatewiseCharges.findOne({
        providerId,
        state: state
      });

      let freightCharge = 0;
      if (stateCharge) {
        freightCharge = chargeableWeight * stateCharge.perKiloFee;
        const fuelSurcharge = freightCharge * stateCharge.fuelSurcharge;
        const totalFreight = freightCharge + fuelSurcharge;

        console.log(`\nShipment ${i + 1}: ${description}`);
        console.log(`  Actual Weight: ${weight} kg`);
        console.log(`  Dimensions: ${length}×${width}×${height} cm`);
        console.log(`  Volumetric Weight: ${volumetricWeight.toFixed(2)} kg`);
        console.log(`  Chargeable Weight: ${chargeableWeight.toFixed(2)} kg`);
        console.log(`  Rate: ₹${stateCharge.perKiloFee}/kg`);
        console.log(`  Base Freight: ₹${freightCharge.toFixed(2)}`);
        console.log(`  Fuel Surcharge (${(stateCharge.fuelSurcharge * 100)}%): ₹${fuelSurcharge.toFixed(2)}`);
        console.log(`  Total Freight: ₹${totalFreight.toFixed(2)}`);
        console.log(`  + Docket: ₹${fixedCharges.docketCharge}`);
        console.log(`  Grand Total: ₹${(totalFreight + fixedCharges.docketCharge).toFixed(2)}`);
      } else {
        console.log(`\nShipment ${i + 1}: ⚠️  No rate found for ${state}`);
      }
    }

    return { success: true, provider, fixedCharges, statewiseCount, specialCount };

  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main test function
async function runTests() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('🚀 COMPREHENSIVE COURIER PARTNER TEST');
    console.log('='.repeat(70));

    await mongoose.connect(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('\n✅ Connected to MongoDB');

    // Get all providers
    const providers = await Provider.find({}).sort({ providerId: 1 });
    console.log(`\n📊 Found ${providers.length} courier partners in database`);

    const results = {
      total: 0,
      passed: 0,
      failed: 0,
      details: []
    };

    // Test each provider
    for (const provider of providers) {
      results.total++;
      const result = await testCourier(provider.providerId, provider.providerName);
      
      if (result.success) {
        results.passed++;
      } else {
        results.failed++;
      }
      
      results.details.push({
        provider: provider.providerName,
        success: result.success,
        error: result.error
      });
    }

    // Summary
    console.log(`\n\n${'='.repeat(70)}`);
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total Couriers Tested: ${results.total}`);
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);

    if (results.failed > 0) {
      console.log('\n❌ Failed Couriers:');
      results.details
        .filter(d => !d.success)
        .forEach(d => {
          console.log(`  - ${d.provider}: ${d.error}`);
        });
    }

    // Volumetric weight comparison table
    console.log(`\n\n${'='.repeat(70)}`);
    console.log('📐 VOLUMETRIC WEIGHT DIVISOR COMPARISON');
    console.log('='.repeat(70));
    console.log('Courier Partner'.padEnd(30) + 'Divisor'.padEnd(15) + 'Min Weight');
    console.log('-'.repeat(70));

    for (const provider of providers) {
      const fixedCharges = await FixedCharges.findOne({ providerId: provider.providerId });
      if (fixedCharges) {
        console.log(
          provider.providerName.padEnd(30) +
          fixedCharges.volumetricDivisor.toString().padEnd(15) +
          `${fixedCharges.minimumChargeableWeight} kg`
        );
      }
    }

    console.log('\n✅ All tests completed!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed\n');
  }
}

// Run tests
runTests();
