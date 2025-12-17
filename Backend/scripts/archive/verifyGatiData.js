const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
const FixedCharges = require('../models/fixedCharges.model');
const StatewiseCharges = require('../models/statewiseCharges.model');
const SpecialCharges = require('../models/specialCharges.model');
require('dotenv').config();

async function verifyGatiData() {
  try {
    // Connect to database
    const mongoUri = process.env.ATLAS_URI || 'mongodb://localhost:27017/shipping-drodin';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get Gati provider
    const gatiProvider = await Provider.findOne({ providerName: "Gati" });
    console.log('\n🏢 GATI PROVIDER INFORMATION:');
    console.log('=============================');
    console.log(`Provider ID: ${gatiProvider.providerId}`);
    console.log(`Provider Name: ${gatiProvider.providerName}`);
    console.log(`Description: ${gatiProvider.description}`);
    console.log(`Is Active: ${gatiProvider.isActive}`);

    // Get Gati fixed charges
    const gatiFixed = await FixedCharges.findOne({ providerId: gatiProvider.providerId });
    console.log('\n💰 GATI FIXED CHARGES:');
    console.log('======================');
    console.log(`Docket Charge: ₹${gatiFixed.docketCharge} (per consignment)`);
    console.log(`COD Charge: ₹${gatiFixed.codCharge} (per consignment)`);
    console.log(`Holiday Charge: ₹${gatiFixed.holidayCharge} (per docket for Sunday/holiday delivery)`);
    console.log(`Outstation Charge: ₹${gatiFixed.outstationCharge}`);
    console.log(`Insurance Charge: ${gatiFixed.insuranceChargePercent}% (minimum ₹100)`);
    console.log(`NGT Green Tax: ₹${gatiFixed.ngtGreenTax} (for Delhi only)`);
    console.log(`Kerala Handling Charge: ₹${gatiFixed.keralaHandlingCharge}`);

    // Get Gati statewise charges
    const gatiStates = await StatewiseCharges.find({ providerId: gatiProvider.providerId }).sort({ state: 1 });
    console.log('\n🗺️  GATI STATEWISE CHARGES:');
    console.log('===========================');
    console.log(`Total States/Cities: ${gatiStates.length}`);
    
    // Group by rate for better overview
    const rateGroups = {};
    gatiStates.forEach(state => {
      const rate = state.perKiloFee;
      if (!rateGroups[rate]) {
        rateGroups[rate] = [];
      }
      rateGroups[rate].push(state.state);
    });

    console.log('\nGrouped by Rate:');
    Object.keys(rateGroups).sort((a, b) => parseFloat(a) - parseFloat(b)).forEach(rate => {
      console.log(`₹${rate}/kg: ${rateGroups[rate].join(', ')}`);
    });

    // Show some key states
    console.log('\n📍 Key States/Cities:');
    const keyStates = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad'];
    keyStates.forEach(stateName => {
      const stateData = gatiStates.find(s => s.state.toLowerCase().includes(stateName.toLowerCase()));
      if (stateData) {
        console.log(`  ${stateData.state}: ₹${stateData.perKiloFee}/kg + ${stateData.fuelSurcharge}% fuel`);
      }
    });

    // Get special charges if they exist
    try {
      const gatiSpecial = await SpecialCharges.find({ providerId: gatiProvider.providerId });
      if (gatiSpecial.length > 0) {
        console.log('\n🎯 GATI SPECIAL CHARGES:');
        console.log('========================');
        gatiSpecial.forEach(special => {
          console.log(`${special.state} - ${special.chargeType}: ₹${special.amount}`);
          console.log(`  Description: ${special.description}`);
        });
      }
    } catch (error) {
      console.log('\n⚠️  Special charges model not available');
    }

    console.log('\n📋 OPERATIONAL DETAILS:');
    console.log('=======================');
    console.log('• Fuel Surcharge: 15% (applied to all shipments)');
    console.log('• CFT Rate: ₹6.00 per kg (for volumetric weight calculation)');
    console.log('• Minimum Chargeable Weight: 15 kg');
    console.log('• E-way Bill: Required for consignments above ₹50,000');
    console.log('• GST: 18% (applicable on all charges)');

    console.log('\n🔍 DATA VALIDATION:');
    console.log('==================');
    
    // Check for missing or unusual rates
    const unusualRates = gatiStates.filter(s => s.perKiloFee > 50 || s.perKiloFee < 5);
    if (unusualRates.length > 0) {
      console.log('⚠️  States with unusual rates:');
      unusualRates.forEach(state => {
        console.log(`  ${state.state}: ₹${state.perKiloFee}/kg`);
      });
    } else {
      console.log('✅ All rates are within expected range');
    }

    // Check for duplicate states
    const stateNames = gatiStates.map(s => s.state.toLowerCase());
    const duplicates = stateNames.filter((item, index) => stateNames.indexOf(item) !== index);
    if (duplicates.length > 0) {
      console.log(`⚠️  Found duplicate states: ${[...new Set(duplicates)].join(', ')}`);
    } else {
      console.log('✅ No duplicate states found');
    }

  } catch (error) {
    console.error('❌ Error verifying Gati data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

verifyGatiData();