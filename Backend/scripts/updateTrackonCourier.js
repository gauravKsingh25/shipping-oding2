const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
const StatewiseCharges = require('../models/statewiseCharges.model');
const FixedCharges = require('../models/fixedCharges.model');
const SpecialCharges = require('../models/specialCharges.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

// Trackon Courier statewise charges
const statewiseData = [
  { state: 'Andhra Pradesh', perKiloFee: 45 },
  { state: 'Arunachal Pradesh', perKiloFee: 45 },
  { state: 'Assam', perKiloFee: 70 },
  { state: 'Bihar', perKiloFee: 45 },
  { state: 'Chhattisgarh', perKiloFee: 45 },
  { state: 'Goa', perKiloFee: 50 },
  { state: 'Gujarat', perKiloFee: 45 },
  { state: 'Haryana', perKiloFee: 15 },
  { state: 'Himachal Pradesh', perKiloFee: 25 },
  { state: 'Jharkhand', perKiloFee: 45 },
  { state: 'Karnataka', perKiloFee: 50 },
  { state: 'Kerala', perKiloFee: 50 },
  { state: 'Madhya Pradesh', perKiloFee: 50 },
  { state: 'Maharashtra', perKiloFee: 50 },
  { state: 'Manipur', perKiloFee: 70 },
  { state: 'Meghalaya', perKiloFee: 70 },
  { state: 'Mizoram', perKiloFee: 70 },
  { state: 'Nagaland', perKiloFee: 70 },
  { state: 'Odisha', perKiloFee: 50 },
  { state: 'Punjab', perKiloFee: 15 },
  { state: 'Rajasthan', perKiloFee: 35 },
  { state: 'Sikkim', perKiloFee: 70 },
  { state: 'Tamil Nadu', perKiloFee: 50 },
  { state: 'Telangana', perKiloFee: 45 },
  { state: 'Tripura', perKiloFee: 70 },
  { state: 'Uttar Pradesh', perKiloFee: 35 },
  { state: 'Uttarakhand', perKiloFee: 35 },
  { state: 'West Bengal', perKiloFee: 50 },
  { state: 'Jammu and Kashmir', perKiloFee: 70 },
  { state: 'Jammu', perKiloFee: 35 },
  { state: 'Daman and Diu', perKiloFee: 45 },
  { state: 'Dadra and Nagar Haveli', perKiloFee: 45 },
  { state: 'Puducherry', perKiloFee: 50 },
  { state: 'Delhi', perKiloFee: 20 },
];

// City-specific charges
const cityCharges = [
  { city: 'Gurugram', perKiloFee: 20 },
  { city: 'Coimbatore', perKiloFee: 50 },
  { city: 'Siliguri', perKiloFee: 50 },
  { city: 'Agartala', perKiloFee: 70 },
  { city: 'Imphal', perKiloFee: 70 },
  { city: 'Silchar', perKiloFee: 70 },
  { city: 'Jorhat', perKiloFee: 70 },
  { city: 'Nashik', perKiloFee: 50 },
  { city: 'Kerala', perKiloFee: 50 },
];

// Air service charges for specific states
const airServiceData = [
  { state: 'Telangana', perKiloFee: 130, serviceType: 'AIR' },
  { state: 'Kerala', perKiloFee: 150, serviceType: 'AIR' },
];

async function updateTrackonCourier() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully');

    const providerName = 'Trackon Courier';

    // Step 1: Create or update provider
    let provider = await Provider.findOne({ providerName });
    if (!provider) {
      provider = new Provider({
        providerName,
        description: 'Trackon Courier service',
        isActive: true,
      });
      await provider.save();
      console.log(`Created provider: ${providerName} with ID: ${provider.providerId}`);
    } else {
      console.log(`Provider found: ${providerName} with ID: ${provider.providerId}`);
    }

    const providerId = provider.providerId;

    // Step 2: Update statewise charges with fuel surcharge (20%)
    console.log('Updating statewise charges...');
    for (const data of statewiseData) {
      await StatewiseCharges.findOneAndUpdate(
        { providerId, state: data.state },
        {
          providerId,
          providerName,
          state: data.state,
          perKiloFee: data.perKiloFee,
          fuelSurcharge: 0.20, // 20% fuel surcharge
        },
        { upsert: true, new: true }
      );
      console.log(`Updated ${data.state}: ₹${data.perKiloFee}/kg`);
    }

    // Step 3: Update city-specific charges
    console.log('Updating city-specific charges...');
    for (const city of cityCharges) {
      await StatewiseCharges.findOneAndUpdate(
        { providerId, state: city.city },
        {
          providerId,
          providerName,
          state: city.city,
          perKiloFee: city.perKiloFee,
          fuelSurcharge: 0.20,
        },
        { upsert: true, new: true }
      );
      console.log(`Updated ${city.city}: ₹${city.perKiloFee}/kg`);
    }

    // Step 4: Add air service special charges
    console.log('Adding air service charges...');
    for (const air of airServiceData) {
      await SpecialCharges.findOneAndUpdate(
        { 
          providerId, 
          state: air.state,
          chargeType: 'AIR_SURCHARGE',
          description: 'Air Service Charge'
        },
        {
          providerId,
          providerName,
          state: air.state,
          chargeType: 'AIR_SURCHARGE',
          amount: air.perKiloFee,
          isPercentage: false,
          description: 'Air Service Charge',
          conditions: {
            serviceType: 'AIR'
          },
          isActive: true,
        },
        { upsert: true, new: true }
      );
      console.log(`Added air service for ${air.state}: ₹${air.perKiloFee}/kg`);
    }

    // Step 5: Update fixed charges
    console.log('Updating fixed charges...');
    await FixedCharges.findOneAndUpdate(
      { providerId },
      {
        providerId,
        docketCharge: 150,
        codCharge: 300,
        holidayCharge: 0,
        outstationCharge: 0,
        insuranceChargePercent: 0,
        ngtGreenTax: 0,
        keralaHandlingCharge: 0,
        volumetricDivisor: 5000, // L×W×H ÷ 5,000
        minimumChargeableWeight: 2, // Minimum 2 kg
      },
      { upsert: true, new: true }
    );
    console.log('Fixed charges updated with volumetric divisor: 4500');

    // Step 6: Update special charges (GST and E-way bill)
    console.log('Updating special charges...');
    
    // GST
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

    // E-way Bill
    await SpecialCharges.findOneAndUpdate(
      { providerId, chargeType: 'DOCUMENTATION_FEE', description: 'E-way Bill (Above ₹50,000)' },
      {
        providerId,
        providerName,
        state: 'ALL',
        chargeType: 'DOCUMENTATION_FEE',
        amount: 100,
        isPercentage: false,
        description: 'E-way Bill (Above ₹50,000)',
        isActive: true,
      },
      { upsert: true, new: true }
    );
    console.log('E-way Bill charge updated: ₹100');

    console.log('\n✅ Trackon Courier charges updated successfully!');
    
  } catch (error) {
    console.error('Error updating Trackon Courier charges:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
updateTrackonCourier();
