const mongoose = require('mongoose');
const FixedCharges = require('../models/fixedCharges.model');
const Provider = require('../models/provider.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

async function updateGattiCargo() {
  try {
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to MongoDB\n');

    const provider = await Provider.findOne({ providerName: "Gatti Cargo" });
    
    if (!provider) {
      console.log('❌ Gatti Cargo provider not found');
      return;
    }

    console.log(`Found Provider: ${provider.providerName} (ID: ${provider.providerId})`);

    const fixedCharge = await FixedCharges.findOne({ providerId: provider.providerId });
    
    if (fixedCharge) {
      console.log('\n=== BEFORE UPDATE ===');
      console.log(`Volumetric Divisor: ${fixedCharge.volumetricDivisor}`);
      console.log(`Minimum Chargeable Weight: ${fixedCharge.minimumChargeableWeight} kg`);
      
      fixedCharge.volumetricDivisor = 27000;
      await fixedCharge.save();
      
      console.log('\n=== AFTER UPDATE ===');
      console.log(`Volumetric Divisor: ${fixedCharge.volumetricDivisor} (6 CFT)`);
      console.log(`Minimum Chargeable Weight: ${fixedCharge.minimumChargeableWeight} kg`);
      console.log('\n✅ Gatti Cargo updated successfully!');
      
      // Test calculation
      console.log('\n=== TEST CALCULATION ===');
      const volume = 55 * 44 * 33; // 79,860 cm³
      const volWeight = volume / fixedCharge.volumetricDivisor;
      console.log(`Example: 55×44×33 cm box`);
      console.log(`Volume: ${volume.toLocaleString()} cm³`);
      console.log(`Volumetric weight: ${volume} ÷ ${fixedCharge.volumetricDivisor} = ${volWeight.toFixed(2)} kg per box`);
      console.log(`For 3 boxes: ${(volWeight * 3).toFixed(2)} kg`);
    } else {
      console.log('❌ Fixed charges not found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

updateGattiCargo();
