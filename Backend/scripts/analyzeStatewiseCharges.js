const mongoose = require('mongoose');
const StatewiseCharges = require('../models/statewiseCharges.model');
require('dotenv').config();

async function analyzeStatewiseCharges() {
  try {
    // Connect to database
    const mongoUri = process.env.ATLAS_URI || 'mongodb://localhost:27017/shipping-drodin';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get a few statewise charges to analyze structure
    const charges = await StatewiseCharges.find({}).limit(5);
    
    console.log('\n🔍 STATEWISE CHARGES STRUCTURE ANALYSIS:');
    console.log('=========================================');
    
    charges.forEach((charge, idx) => {
      console.log(`\nRecord ${idx + 1}:`);
      console.log(`  MongoDB _id: ${charge._id}`);
      console.log(`  Provider ID: ${charge.providerId}`);
      console.log(`  Provider Name: "${charge.providerName}"`);
      console.log(`  State: "${charge.state}"`);
      console.log(`  Per Kilo Fee: ₹${charge.perKiloFee}`);
      console.log(`  Fuel Surcharge: ${charge.fuelSurcharge}%`);
      
      // Check if this matches the frontend expected format
      const frontendFormat = {
        "_id": charge._id,
        "Provider ID": charge.providerId,
        "Provider Name": charge.providerName,
        "State": charge.state,
        "Per Kilo Fee (INR)": charge.perKiloFee,
        "Fuel Surcharge (%)": charge.fuelSurcharge
      };
      
      console.log(`  Frontend Format Keys: [${Object.keys(frontendFormat).join(', ')}]`);
    });

    // Test what happens when we try to access _id
    const testCharge = charges[0];
    if (testCharge) {
      console.log('\n🧪 TESTING ID ACCESS:');
      console.log('=====================');
      console.log(`Direct _id access: ${testCharge._id}`);
      console.log(`_id type: ${typeof testCharge._id}`);
      console.log(`_id toString(): ${testCharge._id.toString()}`);
      console.log(`Transformed _id: ${testCharge._id || testCharge.id}`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

analyzeStatewiseCharges();