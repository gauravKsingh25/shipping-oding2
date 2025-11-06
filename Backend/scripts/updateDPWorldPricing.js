const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
const FixedCharges = require('../models/fixedCharges.model');
const StatewiseCharges = require('../models/statewiseCharges.model');
const SpecialCharges = require('../models/specialCharges.model');
require('dotenv').config();

// DP World statewise pricing (from your two-column data)
const dpWorldStatewisePricing = [
  { state: "Andhra Pradesh", rate: 11.00 },
  { state: "Arunachal Pradesh", rate: 27.00 },
  { state: "Assam", rate: 15.00 },
  { state: "Bihar", rate: 10.50 },
  { state: "Chhattisgarh", rate: 9.00 },
  { state: "Goa", rate: 9.00 },
  { state: "Gujarat", rate: 9.00 },
  { state: "Haryana", rate: 6.00 },
  { state: "GURUGRAM", rate: 9.00 },
  { state: "Himachal Pradesh", rate: 10.50 },
  { state: "Jharkhand", rate: 11.00 },
  { state: "Karnataka", rate: 12.00 },
  { state: "Bengloor", rate: 9.00 },
  { state: "Kerala", rate: 9.00 },
  { state: "Madhya Pradesh", rate: 27.00 },
  { state: "Maharashtra", rate: 27.00 },
  { state: "Manipur", rate: 27.00 },
  { state: "Meghalaya", rate: 27.00 },
  { state: "Mizoram", rate: 10.50 },
  { state: "Nagaland", rate: 6.00 },
  { state: "Odisha", rate: 6.00 },
  { state: "Punjab", rate: 27.00 },
  { state: "Rajasthan", rate: 11.00 },
  { state: "Sikkim", rate: 11.00 },
  { state: "Tamil Nadu", rate: 27.00 },
  { state: "Telangana/Hydrabad", rate: 6.00 },
  { state: "Hydrabad", rate: 6.00 },
  { state: "Tripura", rate: 10.50 },
  { state: "Uttar Pradesh", rate: 9.00 },
  { state: "Uttarakhand", rate: 9.00 },
  { state: "West Bengal", rate: 9.00 },
  { state: "Kashmir and srinagar", rate: 9.00 },
  { state: "Jammu", rate: 12.00 },
  { state: "Port Blair", rate: 6.00 },
  { state: "Daman & Diu", rate: 12.00 },
  { state: "Dadra and Nagar Haveli", rate: 12.00 },
  { state: "Ponducherry", rate: 27.00 },
  { state: "DELHI", rate: 27.00 },
  { state: "KERLA", rate: 27.00 },
  { state: "COIMBOTORE", rate: 27.00 },
  { state: "SILIGURI", rate: 27.00 },
  { state: "AGARATALA", rate: 27.00 },
  { state: "IMPHAL", rate: 9.00 },
  { state: "SILCHAR", rate: 9.00 },
  { state: "JORHAT", rate: 9.00 },
  { state: "NASIK", rate: 9.00 },
  { state: "Chenai", rate: 12.00 },
  { state: "Kolkatta", rate: 6.00 },
  { state: "Hydrabad", rate: 12.00 },
  { state: "Mumbai", rate: 12.00 },
  { state: "Bengloor", rate: 27.00 },
  { state: "Ahmedabad", rate: 27.00 },
  { state: "Pune", rate: 27.00 }
];

// Fixed charges for DP World
const dpWorldFixedCharges = {
  docketCharge: 50.00,             // DOCKET CHARGES
  insuranceChargePercent: 0.1,     // FOV (0.1% with min 100)
  codCharge: 100.00,               // COD
  holidayCharge: 150.00,           // SUNDAY HOLIDAY CHARGES
  outstationCharge: 0.00,          // No outstation charges for DP World
  ngtGreenTax: 0.00,               // No green tax for DP World
  keralaHandlingCharge: 0.00       // No Kerala handling charges for DP World
};

// Special charges for DP World - None (this courier doesn't charge extra)
const dpWorldSpecialCharges = [];

async function updateDPWorldPricing() {
  try {
    const mongoUri = process.env.ATLAS_URI || 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    let dpProvider = await Provider.findOne({ providerName: "DP World" });

    if (!dpProvider) {
      console.log('❌ DP World provider not found. Creating...');
      dpProvider = await new Provider({
        providerName: "DP World",
        description: "DP World Cargo - Updated Pricing",
        isActive: true
      }).save();
    }

    const dpProviderId = dpProvider.providerId;
    console.log(`✅ DP World Provider ID: ${dpProviderId}`);

    // Update Fixed Charges
    await FixedCharges.deleteMany({ providerId: dpProviderId });
    await new FixedCharges({ providerId: dpProviderId, ...dpWorldFixedCharges }).save();
    console.log('✅ Fixed charges updated for DP World');

    // Update Statewise Charges
    await StatewiseCharges.deleteMany({ providerId: dpProviderId });
    const statewiseCharges = dpWorldStatewisePricing.map(item => ({
      providerId: dpProviderId,
      providerName: "DP World",
      state: item.state,
      perKiloFee: item.rate,
      fuelSurcharge: 15
    }));
    await StatewiseCharges.insertMany(statewiseCharges);
    console.log(`✅ ${statewiseCharges.length} statewise charges inserted for DP World`);

    // Update Special Charges - Remove all special charges since DP World doesn't have any
    await SpecialCharges.deleteMany({ providerId: dpProviderId });
    console.log('✅ Special charges cleared for DP World (no special charges applied)');

    console.log('🎉 DP World pricing update completed!');
  } catch (err) {
    console.error('❌ Error updating DP World pricing:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

updateDPWorldPricing();
