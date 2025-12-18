const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
const StatewiseCharges = require('../models/statewiseCharges.model');
const FixedCharges = require('../models/fixedCharges.model');
const SpecialCharges = require('../models/specialCharges.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

// DTDC Courier statewise charges
const statewiseData = [
  { state: 'Andhra Pradesh', perKiloFee: 56 },
  { state: 'Arunachal Pradesh', perKiloFee: 56 },
  { state: 'Assam', perKiloFee: 70 },
  { state: 'Bihar', perKiloFee: 56 },
  { state: 'Chhattisgarh', perKiloFee: 56 },
  { state: 'Goa', perKiloFee: 56 },
  { state: 'Gujarat', perKiloFee: 56 },
  { state: 'Haryana', perKiloFee: 15 },
  { state: 'Himachal Pradesh', perKiloFee: 15 },
  { state: 'Jharkhand', perKiloFee: 56 },
  { state: 'Karnataka', perKiloFee: 56 },
  { state: 'Kerala', perKiloFee: 56 },
  { state: 'Madhya Pradesh', perKiloFee: 56 },
  { state: 'Maharashtra', perKiloFee: 56 },
  { state: 'Manipur', perKiloFee: 75 },
  { state: 'Meghalaya', perKiloFee: 75 },
  { state: 'Mizoram', perKiloFee: 75 },
  { state: 'Nagaland', perKiloFee: 75 },
  { state: 'Odisha', perKiloFee: 56 },
  { state: 'Punjab', perKiloFee: 15 },
  { state: 'Rajasthan', perKiloFee: 33 },
  { state: 'Sikkim', perKiloFee: 70 },
  { state: 'Tamil Nadu', perKiloFee: 56 },
  { state: 'Telangana', perKiloFee: 56 },
  { state: 'Tripura', perKiloFee: 75 },
  { state: 'Uttar Pradesh', perKiloFee: 33 },
  { state: 'Uttarakhand', perKiloFee: 33 },
  { state: 'West Bengal', perKiloFee: 56 },
  { state: 'Jammu and Kashmir', perKiloFee: 33 },
  { state: 'Jammu', perKiloFee: 33 },
  { state: 'Daman and Diu', perKiloFee: 56 },
  { state: 'Dadra and Nagar Haveli', perKiloFee: 56 },
  { state: 'Puducherry', perKiloFee: 56 },
  { state: 'Delhi', perKiloFee: 33 },
];

// City-specific charges (major cities with lower rates)
const cityCharges = [
  { city: 'Gurugram', perKiloFee: 33 },
  { city: 'Bengloor', perKiloFee: 46 },
  { city: 'Bangalore', perKiloFee: 46 },
  { city: 'Hydrabad', perKiloFee: 46 },
  { city: 'Hyderabad', perKiloFee: 46 },
  { city: 'Chennai', perKiloFee: 46 },
  { city: 'Kolkata', perKiloFee: 46 },
  { city: 'Kolkatta', perKiloFee: 46 },
  { city: 'Mumbai', perKiloFee: 46 },
  { city: 'Ahmedabad', perKiloFee: 46 },
  { city: 'Coimbatore', perKiloFee: 56 },
  { city: 'Siliguri', perKiloFee: 56 },
  { city: 'Nashik', perKiloFee: 56 },
  { city: 'Kerala', perKiloFee: 56 },
];

// Air service charges for specific states/cities
const airServiceData = [
  { state: 'Arunachal Pradesh', perKiloFee: 210, serviceType: 'AIR' },
  { city: 'Chennai', perKiloFee: 140, serviceType: 'AIR' },
  { city: 'Kolkata', perKiloFee: 140, serviceType: 'AIR' },
  { city: 'Hyderabad', perKiloFee: 140, serviceType: 'AIR' },
  { city: 'Mumbai', perKiloFee: 140, serviceType: 'AIR' },
  { city: 'Bengloor', perKiloFee: 140, serviceType: 'AIR' },
  { city: 'Bangalore', perKiloFee: 140, serviceType: 'AIR' },
  { city: 'Ahmedabad', perKiloFee: 140, serviceType: 'AIR' },
];

async function updateDTDCCourier() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully');

    const providerName = 'DTDC Courier';

    // Step 1: Create or update provider
    let provider = await Provider.findOne({ providerName });
    if (!provider) {
      provider = new Provider({
        providerName,
        description: 'DTDC Courier service',
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
          fuelSurcharge: 0.15,
        },
        { upsert: true, new: true }
      );
      console.log(`Updated ${city.city}: ₹${city.perKiloFee}/kg`);
    }

    // Step 4: Add air service special charges
    console.log('Adding air service charges...');
    for (const air of airServiceData) {
      const location = air.state || air.city;
      await SpecialCharges.findOneAndUpdate(
        { 
          providerId, 
          state: location,
          chargeType: 'AIR_SURCHARGE',
          description: 'Air Service Charge'
        },
        {
          providerId,
          providerName,
          state: location,
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
      console.log(`Added air service for ${location}: ₹${air.perKiloFee}/kg`);
    }

    // Step 5: Update fixed charges
    console.log('Updating fixed charges...');
    await FixedCharges.findOneAndUpdate(
      { providerId },
      {
        providerId,
        docketCharge: 50,
        codCharge: 150,
        holidayCharge: 0,
        outstationCharge: 0,
        insuranceChargePercent: 0,
        ngtGreenTax: 0,
        keralaHandlingCharge: 0,
        volumetricDivisor: 4750, // L×W×H ÷ 4,750
        minimumChargeableWeight: 3, // Minimum 3 kg
      },
      { upsert: true, new: true }
    );
    console.log('Fixed charges updated with volumetric divisor: 4750, min weight: 3kg');

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
        amount: 200,
        isPercentage: false,
        description: 'E-way Bill (Above ₹50,000)',
        isActive: true,
      },
      { upsert: true, new: true }
    );
    console.log('E-way Bill charge updated: ₹200');

    console.log('\n✅ DTDC Courier charges updated successfully!');
    
  } catch (error) {
    console.error('Error updating DTDC Courier charges:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
updateDTDCCourier();
