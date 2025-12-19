const mongoose = require('mongoose');
const FixedCharges = require('../models/fixedCharges.model');
const Provider = require('../models/provider.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

async function updateDTDCExpressCargo() {
  try {
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find DTDC Express Cargo provider
    const provider = await Provider.findOne({ providerName: "DTDC Express Cargo" });
    
    if (!provider) {
      console.log('❌ DTDC Express Cargo provider not found');
      return;
    }

    console.log(`Found Provider: ${provider.providerName} (ID: ${provider.providerId})`);

    // Update fixed charges
    const fixedCharge = await FixedCharges.findOne({ providerId: provider.providerId });
    
    if (fixedCharge) {
      console.log('\n=== BEFORE UPDATE ===');
      console.log(`Volumetric Divisor: ${fixedCharge.volumetricDivisor}`);
      console.log(`Minimum Chargeable Weight: ${fixedCharge.minimumChargeableWeight} kg`);
      
      fixedCharge.volumetricDivisor = 27000;
      fixedCharge.minimumChargeableWeight = 25;
      await fixedCharge.save();
      
      console.log('\n=== AFTER UPDATE ===');
      console.log(`Volumetric Divisor: ${fixedCharge.volumetricDivisor} (uses 6 CFT)`);
      console.log(`Minimum Chargeable Weight: ${fixedCharge.minimumChargeableWeight} kg`);
      console.log('\n✅ Updated successfully!');
    } else {
      console.log('❌ Fixed charges not found for DTDC Express Cargo');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

updateDTDCExpressCargo();
