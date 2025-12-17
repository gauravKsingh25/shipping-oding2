const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
const StatewiseCharges = require('../models/statewiseCharges.model');
const FixedCharges = require('../models/fixedCharges.model');
const SpecialCharges = require('../models/specialCharges.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

// Gatti Cargo statewise charges
const statewiseData = [
  { state: 'Andhra Pradesh', perKiloFee: 9.3 },
  { state: 'Arunachal Pradesh', perKiloFee: 17 },
  { state: 'Assam', perKiloFee: 17 },
  { state: 'Bihar', perKiloFee: 11 },
  { state: 'Chhattisgarh', perKiloFee: 8.5 },
  { state: 'Goa', perKiloFee: 8.5 },
  { state: 'Gujarat', perKiloFee: 8.5 },
  { state: 'Haryana', perKiloFee: 5.6 },
  { state: 'Himachal Pradesh', perKiloFee: 5.6 },
  { state: 'Jharkhand', perKiloFee: 11 },
  { state: 'Karnataka', perKiloFee: 9.3 },
  { state: 'Kerala', perKiloFee: 9.5 },
  { state: 'Madhya Pradesh', perKiloFee: 8.5 },
  { state: 'Maharashtra', perKiloFee: 8.5 },
  { state: 'Manipur', perKiloFee: 18 },
  { state: 'Meghalaya', perKiloFee: 18 },
  { state: 'Mizoram', perKiloFee: 18 },
  { state: 'Nagaland', perKiloFee: 18 },
  { state: 'Odisha', perKiloFee: 11 },
  { state: 'Punjab', perKiloFee: 5.6 },
  { state: 'Rajasthan', perKiloFee: 5.6 },
  { state: 'Sikkim', perKiloFee: 11 },
  { state: 'Tamil Nadu', perKiloFee: 9.5 },
  { state: 'Telangana', perKiloFee: 9.3 },
  { state: 'Tripura', perKiloFee: 18 },
  { state: 'Uttar Pradesh', perKiloFee: 5.6 },
  { state: 'Uttarakhand', perKiloFee: 5.6 },
  { state: 'West Bengal', perKiloFee: 11 },
  { state: 'Jammu and Kashmir', perKiloFee: 15 },
  { state: 'Jammu', perKiloFee: 5.6 },
  { state: 'Daman and Diu', perKiloFee: 8.5 },
  { state: 'Dadra and Nagar Haveli', perKiloFee: 8.5 },
  { state: 'Puducherry', perKiloFee: 9.5 },
  { state: 'Delhi', perKiloFee: 5.6 },
  { state: 'Port Blair', perKiloFee: 120 },
];

async function updateGattiCargo() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully');

    const providerName = 'Gatti Cargo';

    // Step 1: Create or update provider
    let provider = await Provider.findOne({ providerName });
    if (!provider) {
      provider = new Provider({
        providerName,
        description: 'Gatti Cargo courier service',
        isActive: true,
      });
      await provider.save();
      console.log(`Created provider: ${providerName} with ID: ${provider.providerId}`);
    } else {
      console.log(`Provider found: ${providerName} with ID: ${provider.providerId}`);
    }

    const providerId = provider.providerId;

    // Step 2: Update statewise charges with fuel surcharge (15%)
    console.log('Updating statewise charges...');
    for (const data of statewiseData) {
      await StatewiseCharges.findOneAndUpdate(
        { providerId, state: data.state },
        {
          providerId,
          providerName,
          state: data.state,
          perKiloFee: data.perKiloFee,
          fuelSurcharge: 0.15, // 15% fuel surcharge
        },
        { upsert: true, new: true }
      );
      console.log(`Updated ${data.state}: ₹${data.perKiloFee}/kg`);
    }

    // Step 3: Update fixed charges
    console.log('Updating fixed charges...');
    await FixedCharges.findOneAndUpdate(
      { providerId },
      {
        providerId,
        docketCharge: 50,
        codCharge: 50,
        holidayCharge: 400,
        outstationCharge: 0, // TO HIGH - treating as variable
        insuranceChargePercent: 0.01, // 100/10000 = 1%
        ngtGreenTax: 100,
        keralaHandlingCharge: 0,
        volumetricDivisor: 27000, // L×W×H ÷ 27,000
        minimumChargeableWeight: 6, // Minimum 6 kg
      },
      { upsert: true, new: true }
    );
    console.log('Fixed charges updated with volumetric divisor: 27000, min weight: 6kg');

    // Step 4: Update special charges (GST)
    console.log('Updating special charges...');
    await SpecialCharges.findOneAndUpdate(
      { providerId, chargeType: 'OTHER', description: 'GST' },
      {
        providerId,
        providerName,
        state: 'ALL',
        chargeType: 'OTHER',
        amount: 18,
        isPercentage: true,
        description: 'GST',
        isActive: true,
      },
      { upsert: true, new: true }
    );
    console.log('GST charge updated: 18%');

    console.log('\n✅ Gatti Cargo charges updated successfully!');
    
  } catch (error) {
    console.error('Error updating Gatti Cargo charges:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
updateGattiCargo();
