const mongoose = require('mongoose');
const FixedCharges = require('../models/fixedCharges.model');
const Provider = require('../models/provider.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

async function updateVisionLogisticsConfig() {
  try {
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to MongoDB\n');

    const provider = await Provider.findOne({ providerName: "Vision Logistics" });
    
    if (!provider) {
      console.log('❌ Vision Logistics provider not found');
      return;
    }

    console.log(`Found Provider: ${provider.providerName} (ID: ${provider.providerId})`);

    const fixedCharge = await FixedCharges.findOne({ providerId: provider.providerId });
    
    if (fixedCharge) {
      console.log('\n=== BEFORE UPDATE ===');
      console.log(`Volumetric Divisor: ${fixedCharge.volumetricDivisor}`);
      console.log(`Minimum Chargeable Weight: ${fixedCharge.minimumChargeableWeight} kg`);
      console.log(`Minimum Price: ₹${fixedCharge.minimumPrice || 0}`);
      
      fixedCharge.volumetricDivisor = 27000;
      fixedCharge.minimumChargeableWeight = 20;
      fixedCharge.minimumPrice = 450;
      await fixedCharge.save();
      
      console.log('\n=== AFTER UPDATE ===');
      console.log(`Volumetric Divisor: ${fixedCharge.volumetricDivisor}`);
      console.log(`Minimum Chargeable Weight: ${fixedCharge.minimumChargeableWeight} kg`);
      console.log(`Minimum Price: ₹${fixedCharge.minimumPrice}`);
      console.log('\n✅ Vision Logistics updated successfully!');
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

updateVisionLogisticsConfig();
