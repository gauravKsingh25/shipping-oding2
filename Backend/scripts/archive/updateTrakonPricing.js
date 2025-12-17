const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
const FixedCharges = require('../models/fixedCharges.model');
const StatewiseCharges = require('../models/statewiseCharges.model');
const SpecialCharges = require('../models/specialCharges.model');
require('dotenv').config();

// Trackon statewise pricing data (from your provided arrays)
const trakonStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh", 
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "GURUGRAM",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka", 
  "Bengloor",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana/Hydrabad",
  "Hydrabad",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Kashmir and srinagar",
  "Jammu",
  "Port Blair",
  "Daman & Diu",
  "Dadra and Nagar Haveli",
  "Ponducherry",
  "DELHI",
  "KERLA",
  "COIMBOTORE",
  "SILIGURI",
  "AGARATALA",
  "IMPHAL",
  "SILCHAR",
  "JORHAT",
  "NASIK",
  "Chenai",
  "Kolkatta",
  "Hydrabad",
  "Mumbai",
  "Bengloor",
  "Ahmedabad",
  "Pune"
];

const trakonRates = [
  45.00, 45.00, 70.00, 45.00, 45.00, 50.00, 45.00, 15.00, 20.00, 25.00,
  45.00, 50.00, 50.00, 50.00, 50.00, 70.00, 70.00, 70.00, 70.00, 50.00,
  15.00, 35.00, 70.00, 50.00, 45.00, 70.00, 35.00, 35.00, 50.00, 70.00,
  35.00, 45.00, 45.00, 50.00, 20.00, 50.00, 50.00, 50.00, 70.00, 70.00,
  70.00, 70.00, 50.00
];

// Create statewise pricing array by mapping states to rates
const trakonStatewisePricing = trakonStates.map((state, index) => {
  const rate = trakonRates[index] !== undefined ? trakonRates[index] : 0; // Use 0 for missing rates
  if (trakonRates[index] === undefined) {
    console.warn(`⚠️ Missing rate for state: ${state}, using rate: 0`);
  }
  return { state, rate };
});

// Fixed charges for Trackon (based on your provided data)
const trakonFixedCharges = {
  docketCharge: 300.00,              // DOCKET CHARGES
  codCharge: 100.00,                 // COD
  holidayCharge: 0.00,               // No holiday charges specified
  outstationCharge: 0.00,            // No outstation charges specified
  insuranceChargePercent: 20.00,     // FOV - 20% (stored as percentage value)
  ngtGreenTax: 0.00,                 // No green tax specified
  keralaHandlingCharge: 0.00         // No Kerala handling charges specified
};

// Special charges for Trackon - None specified
const trakonSpecialCharges = [];

async function updateTrakonPricing() {
  try {
    const mongoUri = process.env.ATLAS_URI || 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // 1. Find or create Trackon provider
    let trakonProvider = await Provider.findOne({ providerName: "Trackon" });

    if (!trakonProvider) {
      console.log('ℹ️ Trackon provider not found. Creating...');
      trakonProvider = await new Provider({
        providerName: "Trackon",
        description: "Trackon Courier - Updated Pricing",
        isActive: true
      }).save();
      console.log(`✅ Created Trackon provider (ID: ${trakonProvider.providerId})`);
    } else {
      console.log(`✅ Found Trackon provider (ID: ${trakonProvider.providerId})`);
    }

    const trakonProviderId = trakonProvider.providerId;

    // 2. Update Fixed Charges
    console.log('\n💰 Updating fixed charges...');
    await FixedCharges.deleteMany({ providerId: trakonProviderId });
    await new FixedCharges({ 
      providerId: trakonProviderId, 
      ...trakonFixedCharges 
    }).save();
    console.log('✅ Fixed charges updated for Trackon');

    // 3. Update Statewise Charges
    console.log('\n🗺️ Updating statewise charges...');
    await StatewiseCharges.deleteMany({ providerId: trakonProviderId });
    
    const statewiseCharges = trakonStatewisePricing.map(item => ({
      providerId: trakonProviderId,
      providerName: "Trackon",
      state: item.state,
      perKiloFee: item.rate,
      fuelSurcharge: 0 // No fuel surcharge specified for Trackon
    }));
    
    await StatewiseCharges.insertMany(statewiseCharges);
    console.log(`✅ ${statewiseCharges.length} statewise charges inserted for Trackon`);

    // 4. Clear Special Charges (none specified)
    console.log('\n🎯 Clearing special charges...');
    await SpecialCharges.deleteMany({ providerId: trakonProviderId });
    console.log('✅ Special charges cleared for Trackon (no special charges applied)');

    // 5. Verification
    console.log('\n📊 VERIFICATION:');
    const verifyProvider = await Provider.findOne({ providerId: trakonProviderId });
    console.log(`Provider: ${verifyProvider.providerName} (ID: ${verifyProvider.providerId})`);

    const verifyFixed = await FixedCharges.findOne({ providerId: trakonProviderId });
    console.log('Fixed Charges:');
    console.log(`  - Docket Charge: ₹${verifyFixed.docketCharge}`);
    console.log(`  - COD Charge: ₹${verifyFixed.codCharge}`);
    console.log(`  - Insurance (FOV): ${verifyFixed.insuranceChargePercent}%`);
    console.log(`  - Holiday Charge: ₹${verifyFixed.holidayCharge}`);

    const stateCount = await StatewiseCharges.countDocuments({ providerId: trakonProviderId });
    console.log(`Statewise records: ${stateCount}`);

    // Show sample statewise charges
    const sampleStates = await StatewiseCharges.find({ providerId: trakonProviderId }).limit(8);
    console.log('Sample statewise charges:');
    sampleStates.forEach(s => console.log(`  ${s.state}: ₹${s.perKiloFee}/kg`));

    console.log('\n🎉 Trackon pricing update completed successfully!');
    
  } catch (error) {
    console.error('❌ Error updating Trackon pricing:', error);
    if (error.message) {
      console.error('Error details:', error.message);
    }
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Check for missing rates and warn
if (trakonRates.length < trakonStates.length) {
  console.warn(`⚠️ Warning: ${trakonStates.length - trakonRates.length} states are missing rates and will use rate of ₹0`);
}

updateTrakonPricing();