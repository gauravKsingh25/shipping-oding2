const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
const FixedCharges = require('../models/fixedCharges.model');
require('dotenv').config();

async function checkMissingFixedCharges() {
  try {
    // Connect to database
    const mongoUri = process.env.ATLAS_URI || 'mongodb://localhost:27017/shipping-drodin';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get all providers
    const providers = await Provider.find({}).sort({ providerId: 1 });
    const fixedCharges = await FixedCharges.find({}).sort({ providerId: 1 });

    const providerIds = providers.map(p => p.providerId);
    const fixedChargeIds = fixedCharges.map(f => f.providerId);

    const missingFixedCharges = providerIds.filter(id => !fixedChargeIds.includes(id));
    
    console.log(`\n📊 FIXED CHARGES ANALYSIS:`);
    console.log('===========================');
    console.log(`Total Providers: ${providerIds.length}`);
    console.log(`Providers with Fixed Charges: ${fixedChargeIds.length}`);
    console.log(`Missing Fixed Charges for Provider IDs: ${missingFixedCharges.length > 0 ? missingFixedCharges.join(', ') : 'None'}`);

    if (missingFixedCharges.length > 0) {
      console.log(`\n⚠️ MISSING FIXED CHARGES DETAILS:`);
      console.log('==================================');
      for (const id of missingFixedCharges) {
        const provider = providers.find(p => p.providerId === id);
        console.log(`ID ${id}: "${provider.providerName}"`);
      }
      
      // Add default fixed charges for missing providers
      console.log(`\n🔧 ADDING DEFAULT FIXED CHARGES:`);
      console.log('=================================');
      
      const defaultFixedCharges = {
        docketCharge: 30,
        codCharge: 40,
        holidayCharge: 25,
        outstationCharge: 35,
        insuranceChargePercent: 2.0,
        ngtGreenTax: 10,
        keralaHandlingCharge: 15
      };

      for (const providerId of missingFixedCharges) {
        const newFixedCharge = new FixedCharges({
          providerId,
          ...defaultFixedCharges
        });
        
        const saved = await newFixedCharge.save();
        const provider = providers.find(p => p.providerId === providerId);
        console.log(`✅ ID ${providerId}: "${provider.providerName}" - Default fixed charges added`);
      }
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkMissingFixedCharges();