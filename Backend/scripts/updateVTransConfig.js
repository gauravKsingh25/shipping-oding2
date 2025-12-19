const mongoose = require('mongoose');
const FixedCharges = require('../models/fixedCharges.model');
const Provider = require('../models/provider.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

async function updateVTrans() {
  try {
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find V Trans provider
    const provider = await Provider.findOne({ providerName: "V Trans" });
    
    if (!provider) {
      console.log('❌ V Trans provider not found');
      return;
    }

    console.log(`Found Provider: ${provider.providerName} (ID: ${provider.providerId})`);

    // Update fixed charges
    const fixedCharge = await FixedCharges.findOne({ providerId: provider.providerId });
    
    if (fixedCharge) {
      console.log('\n=== BEFORE UPDATE ===');
      console.log(`Minimum Chargeable Weight: ${fixedCharge.minimumChargeableWeight} kg`);
      console.log(`Minimum Price: ${fixedCharge.minimumPrice || 'Not set'}`);
      
      fixedCharge.minimumChargeableWeight = 30;
      fixedCharge.minimumPrice = 500;
      await fixedCharge.save();
      
      console.log('\n=== AFTER UPDATE ===');
      console.log(`Minimum Chargeable Weight: ${fixedCharge.minimumChargeableWeight} kg`);
      console.log(`Minimum Price: ₹${fixedCharge.minimumPrice}`);
      console.log('\n✅ Updated successfully!');
      console.log('\nNote: If calculated price < ₹500, the price will be set to ₹500');
    } else {
      console.log('❌ Fixed charges not found for V Trans');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

updateVTrans();
