const mongoose = require('mongoose');
const FixedCharges = require('../models/fixedCharges.model');
const Provider = require('../models/provider.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

async function checkVisionConfig() {
  try {
    await mongoose.connect(ATLAS_URI);
    
    const provider = await Provider.findOne({ providerName: 'Vision Logistics' });
    if (provider) {
      const fixed = await FixedCharges.findOne({ providerId: provider.providerId });
      console.log('\n📊 Vision Logistics Configuration:');
      console.log('   Provider ID:', provider.providerId);
      console.log('   Volumetric Divisor:', fixed?.volumetricDivisor || 'NOT SET');
      console.log('   Minimum Chargeable Weight:', fixed?.minimumChargeableWeight || 'NOT SET', 'kg\n');
      
      console.log('📊 Gatti Cargo Configuration:');
      const gattiProvider = await Provider.findOne({ providerName: 'Gatti Cargo' });
      const gattiFixed = await FixedCharges.findOne({ providerId: gattiProvider.providerId });
      console.log('   Provider ID:', gattiProvider.providerId);
      console.log('   Volumetric Divisor:', gattiFixed?.volumetricDivisor || 'NOT SET');
      console.log('   Minimum Chargeable Weight:', gattiFixed?.minimumChargeableWeight || 'NOT SET', 'kg\n');
    }
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkVisionConfig();
