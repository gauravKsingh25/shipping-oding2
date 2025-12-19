const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
const FixedCharges = require('../models/fixedCharges.model');
const StatewiseCharges = require('../models/statewiseCharges.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

async function removeBlueDart() {
  try {
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to MongoDB\n');

    const provider = await Provider.findOne({ providerName: "Blue Dart" });
    
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
      
      console.log('✅ Blue Dart removed successfully!');
    } else {
      console.log('⚠️  Blue Dart provider not found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

removeBlueDart();
