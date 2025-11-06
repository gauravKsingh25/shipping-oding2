const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
const SpecialCharges = require('../models/specialCharges.model');
require('dotenv').config();

async function addGatiAdditionalSpecialCharges() {
  try {
    // Connect to database
    const mongoUri = process.env.ATLAS_URI || 'mongodb://localhost:27017/shipping-drodin';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find Gati provider
    const gatiProvider = await Provider.findOne({ providerName: "Gati" });
    
    if (!gatiProvider) {
      console.log('❌ Gati provider not found');
      return;
    }

    console.log(`✅ Found Gati provider with ID: ${gatiProvider.providerId}`);

    // Additional special charges for Delhi and Kerala
    const additionalSpecialCharges = [
      {
        providerId: gatiProvider.providerId,
        providerName: "Gati",
        state: "Delhi",
        chargeType: "CITY_SURCHARGE",
        amount: 75.00,
        isPercentage: false,
        description: "Additional city surcharge for Delhi (over and above green tax)",
        conditions: {
          citySpecific: true,
          additionalToOtherCharges: true,
          note: "This is in addition to the ₹100 Green Tax"
        },
        isActive: true
      },
      {
        providerId: gatiProvider.providerId,
        providerName: "Gati",
        state: "Kerala",
        chargeType: "CITY_SURCHARGE", 
        amount: 100.00,
        isPercentage: false,
        description: "Additional special handling charge for Kerala state",
        conditions: {
          stateWide: true,
          additionalToOtherCharges: true,
          note: "This is in addition to regular Kerala handling charges"
        },
        isActive: true
      }
    ];

    console.log('\n🎯 Adding Additional Special Charges for Gati...');
    
    // Insert the additional special charges
    await SpecialCharges.insertMany(additionalSpecialCharges);
    console.log(`✅ Added ${additionalSpecialCharges.length} additional special charges`);

    // Verification - Get all special charges for Gati
    const allGatiSpecialCharges = await SpecialCharges.find({ providerId: gatiProvider.providerId }).sort({ state: 1, chargeType: 1 });
    
    console.log('\n📋 ALL GATI SPECIAL CHARGES:');
    console.log('============================');
    
    const chargesByState = {};
    allGatiSpecialCharges.forEach(charge => {
      if (!chargesByState[charge.state]) {
        chargesByState[charge.state] = [];
      }
      chargesByState[charge.state].push(charge);
    });

    Object.keys(chargesByState).sort().forEach(state => {
      console.log(`\n🏛️  ${state.toUpperCase()}:`);
      chargesByState[state].forEach(charge => {
        console.log(`   • ${charge.chargeType}: ₹${charge.amount}`);
        console.log(`     ${charge.description}`);
        if (charge.conditions && charge.conditions.note) {
          console.log(`     📝 Note: ${charge.conditions.note}`);
        }
      });
    });

    console.log('\n💡 SUMMARY OF TOTAL CHARGES:');
    console.log('============================');
    console.log('🏛️  DELHI:');
    console.log('   • Green Tax: ₹100 (environmental charge)');
    console.log('   • City Surcharge: ₹75 (additional)');
    console.log('   • TOTAL ADDITIONAL: ₹175 per consignment');
    console.log('');
    console.log('🌴 KERALA:');
    console.log('   • Handling Charge: ₹100 (in fixed charges)');
    console.log('   • Special Charge: ₹100 (additional)');
    console.log('   • TOTAL ADDITIONAL: ₹200 per consignment');
    console.log('');
    console.log('🏔️  JAMMU & KASHMIR:');
    console.log('   • City Surcharge: ₹100 per consignment');

    console.log('\n✅ Additional special charges for Delhi and Kerala have been added successfully!');

  } catch (error) {
    console.error('❌ Error adding additional special charges:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

addGatiAdditionalSpecialCharges();