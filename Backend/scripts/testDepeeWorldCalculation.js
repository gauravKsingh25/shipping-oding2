const mongoose = require('mongoose');
const FixedCharges = require('../models/fixedCharges.model');
const StatewiseCharges = require('../models/statewiseCharges.model');
const Provider = require('../models/provider.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

async function testDepeeWorldCalculation() {
  try {
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find Depee World provider
    const provider = await Provider.findOne({ providerName: "Depee World" });
    if (!provider) {
      console.log('❌ Depee World provider not found');
      return;
    }

    // Get fixed charges
    const fixedCharges = await FixedCharges.findOne({ providerId: provider.providerId });
    if (!fixedCharges) {
      console.log('❌ Fixed charges not found for Depee World');
      return;
    }

    // Get statewise charges for a sample state (Chhattisgarh)
    const statewiseCharge = await StatewiseCharges.findOne({ 
      providerId: provider.providerId,
      state: "Chhattisgarh"
    });

    console.log('=== DEPEE WORLD CONFIGURATION ===');
    console.log(`Provider: ${provider.providerName}`);
    console.log(`Provider ID: ${provider.providerId}`);
    console.log(`Volumetric Divisor: ${fixedCharges.volumetricDivisor}`);
    console.log(`Minimum Chargeable Weight: ${fixedCharges.minimumChargeableWeight} kg`);
    console.log(`Docket Charge: ₹${fixedCharges.docketCharge}`);
    console.log(`COD Charge: ₹${fixedCharges.codCharge}`);
    
    if (statewiseCharge) {
      console.log(`\nFor Chhattisgarh:`);
      console.log(`  Per Kilo Fee: ₹${statewiseCharge.perKiloFee}/kg`);
      console.log(`  Fuel Surcharge: ${statewiseCharge.fuelSurcharge}%`);
    }

    console.log('\n=== TEST CALCULATION ===');
    console.log('Scenario: 3 boxes of 55×44×33 cm, 6 kg actual weight each');
    console.log('');

    // Box dimensions
    const box = {
      length: 55,
      breadth: 44,
      height: 33,
      deadWeight: 6,
      quantity: 3
    };

    // Calculate volume
    const volume = box.length * box.breadth * box.height;
    console.log(`Volume per box: ${volume.toLocaleString()} cm³`);
    
    // Calculate volumetric weight per box
    const volWeightPerBox = volume / fixedCharges.volumetricDivisor;
    console.log(`Volumetric weight per box: ${volume} ÷ ${fixedCharges.volumetricDivisor} = ${volWeightPerBox.toFixed(2)} kg`);
    
    // Calculate totals
    const totalActualWeight = box.deadWeight * box.quantity;
    const totalVolumetricWeight = volWeightPerBox * box.quantity;
    
    console.log(`\nTotal actual weight: ${box.deadWeight} × ${box.quantity} = ${totalActualWeight} kg`);
    console.log(`Total volumetric weight: ${volWeightPerBox.toFixed(2)} × ${box.quantity} = ${totalVolumetricWeight.toFixed(2)} kg`);
    console.log(`Minimum chargeable weight: ${fixedCharges.minimumChargeableWeight} kg`);
    
    // Determine chargeable weight
    const chargeableWeight = Math.max(totalActualWeight, totalVolumetricWeight, fixedCharges.minimumChargeableWeight);
    const weightType = chargeableWeight === fixedCharges.minimumChargeableWeight ? 'minimum' :
                      chargeableWeight === totalVolumetricWeight ? 'volumetric' : 'actual';
    
    console.log(`\n✅ Chargeable Weight: ${chargeableWeight.toFixed(2)} kg (using ${weightType} weight)`);
    
    // Calculate freight if statewise charge exists
    if (statewiseCharge) {
      console.log('\n=== FREIGHT CALCULATION ===');
      
      const perKiloFee = statewiseCharge.perKiloFee;
      const baseCost = perKiloFee * chargeableWeight;
      const fuelCharge = (baseCost * statewiseCharge.fuelSurcharge) / 100;
      const subtotal = baseCost + fuelCharge + fixedCharges.docketCharge;
      const gst = subtotal * 0.18;
      const grandTotal = subtotal + gst;
      
      console.log(`Base Freight: ${perKiloFee} × ${chargeableWeight.toFixed(2)} = ₹${baseCost.toFixed(2)}`);
      console.log(`Fuel Surcharge (${statewiseCharge.fuelSurcharge}%): ₹${fuelCharge.toFixed(2)}`);
      console.log(`Docket Charge: ₹${fixedCharges.docketCharge.toFixed(2)}`);
      console.log(`Subtotal: ₹${subtotal.toFixed(2)}`);
      console.log(`GST (18%): ₹${gst.toFixed(2)}`);
      console.log(`Grand Total: ₹${grandTotal.toFixed(2)}`);
    }

    console.log('\n=== EXPECTED RESULT ===');
    console.log(`For your test case:`);
    console.log(`  - 55×44×33 = 79,860 cm³`);
    console.log(`  - 79,860 ÷ 4,500 = 17.75 kg per box`);
    console.log(`  - 3 boxes = 53.24 kg total volumetric`);
    console.log(`  - Actual weight = 18 kg total`);
    console.log(`  - Minimum weight = 20 kg`);
    console.log(`  - Should charge: MAX(18, 53.24, 20) = 53.24 kg (volumetric)`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

testDepeeWorldCalculation();
