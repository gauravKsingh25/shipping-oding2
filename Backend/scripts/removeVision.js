const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
const FixedCharges = require('../models/fixedCharges.model');
const StatewiseCharges = require('../models/statewiseCharges.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

async function removeVision() {
  try {
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to MongoDB\n');

    const provider = await Provider.findOne({ providerName: "Vision" });
    
    if (provider) {
      console.log(`Found: ${provider.providerName} (ID: ${provider.providerId})`);
      
      // Delete fixed charges
      const deletedFixed = await FixedCharges.deleteMany({ providerId: provider.providerId });
      console.log(`✓ Deleted ${deletedFixed.deletedCount} fixed charge records`);
      
      // Delete statewise charges
      const deletedStatewise = await StatewiseCharges.deleteMany({ providerId: provider.providerId });
      console.log(`✓ Deleted ${deletedStatewise.deletedCount} statewise charge records`);
      
      // Delete provider
      await Provider.deleteOne({ _id: provider._id });
      console.log(`✓ Deleted provider\n`);
      
      console.log('✅ Vision removed successfully!');
      console.log('✅ Vision Logistics is still active');
    } else {
      console.log('⚠️  Vision provider not found (may already be deleted)');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

removeVision();
