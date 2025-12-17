const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
const StatewiseCharges = require('../models/statewiseCharges.model');
const FixedCharges = require('../models/fixedCharges.model');
require('dotenv').config();

async function debugProviders() {
  try {
    // Connect to database
    const mongoUri = process.env.ATLAS_URI || 'mongodb://localhost:27017/shipping-drodin';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get all providers
    const providers = await Provider.find({}).sort({ providerId: 1 });
    console.log('\n🏢 CURRENT PROVIDERS IN DATABASE:');
    console.log('=====================================');
    providers.forEach(provider => {
      console.log(`ID: ${provider.providerId} | Name: "${provider.providerName}" | Active: ${provider.isActive}`);
    });

    // Get statewise charges with provider info
    const statewiseCharges = await StatewiseCharges.find({}).sort({ providerId: 1 });
    console.log('\n📍 STATEWISE CHARGES BY PROVIDER ID:');
    console.log('=====================================');
    const groupedByProvider = {};
    statewiseCharges.forEach(charge => {
      if (!groupedByProvider[charge.providerId]) {
        groupedByProvider[charge.providerId] = {
          providerName: charge.providerName,
          states: new Set(),
          count: 0
        };
      }
      groupedByProvider[charge.providerId].states.add(charge.state);
      groupedByProvider[charge.providerId].count++;
    });

    Object.entries(groupedByProvider).forEach(([providerId, data]) => {
      console.log(`ID: ${providerId} | Name: "${data.providerName}" | States: ${data.states.size} | Charges: ${data.count}`);
    });

    // Get fixed charges
    const fixedCharges = await FixedCharges.find({}).sort({ providerId: 1 });
    console.log('\n💰 FIXED CHARGES BY PROVIDER ID:');
    console.log('=================================');
    fixedCharges.forEach(charge => {
      console.log(`ID: ${charge.providerId} | Docket: ₹${charge.docketCharge} | COD: ₹${charge.codCharge}`);
    });

    // Check for orphaned charges
    console.log('\n⚠️ CHECKING FOR ORPHANED CHARGES:');
    console.log('==================================');
    const providerIds = providers.map(p => p.providerId);
    const statewiseProviderIds = [...new Set(statewiseCharges.map(c => c.providerId))];
    const fixedProviderIds = fixedCharges.map(c => c.providerId);

    const orphanedStatewise = statewiseProviderIds.filter(id => !providerIds.includes(id));
    const orphanedFixed = fixedProviderIds.filter(id => !providerIds.includes(id));

    if (orphanedStatewise.length > 0) {
      console.log(`❌ Orphaned statewise charges for provider IDs: ${orphanedStatewise.join(', ')}`);
    }
    if (orphanedFixed.length > 0) {
      console.log(`❌ Orphaned fixed charges for provider IDs: ${orphanedFixed.join(', ')}`);
    }

    if (orphanedStatewise.length === 0 && orphanedFixed.length === 0) {
      console.log('✅ No orphaned charges found');
    }

    // Check what provider IDs are missing from the provider table
    const allUsedIds = [...new Set([...statewiseProviderIds, ...fixedProviderIds])];
    const missingProviders = allUsedIds.filter(id => !providerIds.includes(id));
    
    if (missingProviders.length > 0) {
      console.log(`\n❌ MISSING PROVIDERS FOR IDs: ${missingProviders.join(', ')}`);
      
      // Try to find these providers in statewise charges to get their names
      const missingProviderData = statewiseCharges
        .filter(charge => missingProviders.includes(charge.providerId))
        .reduce((acc, charge) => {
          if (!acc[charge.providerId]) {
            acc[charge.providerId] = charge.providerName;
          }
          return acc;
        }, {});
      
      console.log('\n🔍 MISSING PROVIDER NAMES FROM STATEWISE CHARGES:');
      Object.entries(missingProviderData).forEach(([id, name]) => {
        console.log(`ID: ${id} | Name: "${name}"`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugProviders();