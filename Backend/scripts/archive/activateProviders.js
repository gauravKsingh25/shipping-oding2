const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
require('dotenv').config();

async function activateProviders() {
  try {
    // Connect to database
    const mongoUri = process.env.ATLAS_URI || 'mongodb://localhost:27017/shipping-drodin';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Activate providers with IDs 4 and 9
    const result4 = await Provider.findOneAndUpdate(
      { providerId: 4 },
      { isActive: true },
      { new: true }
    );

    const result9 = await Provider.findOneAndUpdate(
      { providerId: 9 },
      { isActive: true },
      { new: true }
    );

    console.log(`\n✅ PROVIDER ACTIVATION RESULTS:`);
    console.log('=================================');
    if (result4) {
      console.log(`ID 4: "${result4.providerName}" - Activated successfully`);
    } else {
      console.log(`❌ ID 4: Provider not found`);
    }

    if (result9) {
      console.log(`ID 9: "${result9.providerName}" - Activated successfully`);
    } else {
      console.log(`❌ ID 9: Provider not found`);
    }

    // Verify the changes
    const allProviders = await Provider.find({}).sort({ providerId: 1 });
    console.log('\n🔍 UPDATED PROVIDER STATUS:');
    console.log('============================');
    allProviders.forEach(provider => {
      const status = provider.isActive ? '✅ ACTIVE' : '❌ INACTIVE';
      console.log(`ID: ${provider.providerId} | Name: "${provider.providerName}" | ${status}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

activateProviders();