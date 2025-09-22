const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Import models
const Provider = require('../models/provider.model');
const StatewiseCharges = require('../models/statewiseCharges.model');
const FixedCharges = require('../models/fixedCharges.model');

// Courier name mapping between Excel columns and our system
const COURIER_MAPPINGS = {
  // Excel column names -> Our provider names
  'dtdc courier rates': 'DTDC',
  'dtdc courier rates by air': 'DTDC Air',
  'dtdc express cargo': 'DTDC Express',
  'tci transport': 'TCI Express',
  'track on courier': 'Trackon',
  'track on courier by air rate': 'Trackon Air',
  'vision logistics': 'Vision',
  'safexpress': 'Safe Express',
  'v trans': 'V Trans',
  'depee world': 'DP World',
  'gatti cargo': 'Gati',
  'green tax safexpress': 'Safe Express Green Tax'
};

// State name mapping (cities to proper state names)
const STATE_MAPPINGS = {
  'Mumbai': 'Maharashtra',
  'Chenai': 'Tamil Nadu',
  'Chennai': 'Tamil Nadu',
  'Kolkatta': 'West Bengal',
  'Kolkata': 'West Bengal',
  'Hydrabad': 'Telangana',
  'Hyderabad': 'Telangana',
  'Bengloor': 'Karnataka',
  'Bangalore': 'Karnataka',
  'Delhi': 'Delhi',
  'Gurgaon': 'Haryana',
  'Noida': 'Uttar Pradesh',
  'Pune': 'Maharashtra',
  'Ahmedabad': 'Gujarat',
  'Jaipur': 'Rajasthan',
  'Lucknow': 'Uttar Pradesh',
  'Kanpur': 'Uttar Pradesh',
  'Nagpur': 'Maharashtra',
  'Indore': 'Madhya Pradesh',
  'Thane': 'Maharashtra',
  'Bhopal': 'Madhya Pradesh',
  'Visakhapatnam': 'Andhra Pradesh',
  'Pimpri': 'Maharashtra',
  'Patna': 'Bihar',
  'Vadodara': 'Gujarat',
  'Ludhiana': 'Punjab',
  'Agra': 'Uttar Pradesh',
  'Nashik': 'Maharashtra',
  'Faridabad': 'Haryana',
  'Meerut': 'Uttar Pradesh',
  'Rajkot': 'Gujarat',
  'Kalyan': 'Maharashtra',
  'Vasai': 'Maharashtra',
  'Varanasi': 'Uttar Pradesh',
  'Srinagar': 'Jammu and Kashmir',
  'Aurangabad': 'Maharashtra',
  'Dhanbad': 'Jharkhand',
  'Amritsar': 'Punjab',
  'Allahabad': 'Uttar Pradesh',
  'Prayagraj': 'Uttar Pradesh',
  'Gwalior': 'Madhya Pradesh',
  'Jabalpur': 'Madhya Pradesh',
  'Coimbatore': 'Tamil Nadu',
  'Madurai': 'Tamil Nadu',
  'Jodhpur': 'Rajasthan',
  'Kota': 'Rajasthan',
  'Guwahati': 'Assam',
  'Chandigarh': 'Chandigarh',
  'Solapur': 'Maharashtra',
  'Hubli': 'Karnataka',
  'Tiruchirappalli': 'Tamil Nadu',
  'Bareilly': 'Uttar Pradesh',
  'Moradabad': 'Uttar Pradesh',
  'Mysore': 'Karnataka',
  'Gurgaon': 'Haryana',
  'Aligarh': 'Uttar Pradesh',
  'Jalandhar': 'Punjab',
  'Bhubaneswar': 'Odisha',
  'Salem': 'Tamil Nadu',
  'Warangal': 'Telangana',
  'Mira': 'Maharashtra',
  'Bhiwandi': 'Maharashtra',
  'Saharanpur': 'Uttar Pradesh',
  'Gorakhpur': 'Uttar Pradesh',
  'Bikaner': 'Rajasthan',
  'Amravati': 'Maharashtra',
  'Noida': 'Uttar Pradesh',
  'Jamshedpur': 'Jharkhand',
  'Bhilai': 'Chhattisgarh',
  'Cuttak': 'Odisha',
  'Firozabad': 'Uttar Pradesh',
  'Kochi': 'Kerala',
  'Nellore': 'Andhra Pradesh',
  'Bhavnagar': 'Gujarat',
  'Dehradun': 'Uttarakhand',
  'Durgapur': 'West Bengal',
  'Asansol': 'West Bengal',
  'Rourkela': 'Odisha',
  'Nanded': 'Maharashtra',
  'Kolhapur': 'Maharashtra',
  'Ajmer': 'Rajasthan',
  'Akola': 'Maharashtra',
  'Gulbarga': 'Karnataka',
  'Jamnagar': 'Gujarat',
  'Ujjain': 'Madhya Pradesh',
  'Loni': 'Uttar Pradesh',
  'Siliguri': 'West Bengal',
  'Jhansi': 'Uttar Pradesh',
  'Ulhasnagar': 'Maharashtra',
  'Jammu': 'Jammu and Kashmir',
  'Sangli': 'Maharashtra',
  'Mangalore': 'Karnataka',
  'Erode': 'Tamil Nadu',
  'Belgaum': 'Karnataka',
  'Ambattur': 'Tamil Nadu',
  'Tirunelveli': 'Tamil Nadu',
  'Malegaon': 'Maharashtra',
  'Gaya': 'Bihar',
  'Jalgaon': 'Maharashtra',
  'Udaipur': 'Rajasthan',
  'Maheshtala': 'West Bengal'
};

// Special charges configuration
const SPECIAL_CHARGES = {
  'GREEN_TAX_DELHI': {
    states: ['Delhi', 'Haryana', 'Uttar Pradesh'], // NCR region
    cities: ['Delhi', 'Gurgaon', 'Gurugram', 'Noida', 'Faridabad', 'Ghaziabad'],
    charge: 100,
    applicableProviders: ['Safe Express', 'TCI Express'],
    description: 'Green Tax for Delhi NCR region'
  },
  'AIR_SURCHARGE': {
    identifiers: ['by air', 'air rate', 'air'],
    multiplier: 2.5,
    description: 'Air transportation surcharge'
  },
  'MINIMUM_CHARGES': {
    providers: {
      'Vision': { minCharge: 450, minWeight: 20 },
      'Safe Express': { minCharge: 400, minWeight: 20 },
      'DTDC Express': { minCharge: 300, minWeight: 25 },
      'V Trans': { minCharge: 500, minWeight: 30 }
    }
  }
};

class ExcelDataIntegrator {
  constructor() {
    this.jsonData = null;
    this.newProviders = new Map();
    this.statewiseData = [];
    this.specialCharges = new Map();
  }

  async loadJsonData() {
    try {
      const jsonPath = path.join(__dirname, 'transport_rate1_parsed_v2.json');
      const rawData = fs.readFileSync(jsonPath, 'utf8');
      this.jsonData = JSON.parse(rawData);
      console.log('✅ JSON data loaded successfully');
      return true;
    } catch (error) {
      console.error('❌ Error loading JSON data:', error.message);
      return false;
    }
  }

  extractCourierData() {
    if (!this.jsonData?.couriers) {
      console.error('❌ No couriers data found in JSON');
      return;
    }

    console.log('🔄 Extracting courier data from JSON...');
    
    // Process each courier in the JSON
    Object.entries(this.jsonData.couriers).forEach(([courierKey, courierData]) => {
      if (courierKey === 'UNKNOWN_COURIER') return;
      
      // Process states for this courier
      Object.entries(courierData.states || {}).forEach(([stateKey, stateData]) => {
        if (stateKey === 'UNKNOWN_STATE') return;
        
        // Process conditions (default conditions)
        const conditions = stateData.conditions?.default;
        if (!conditions?.entries) return;
        
        conditions.entries.forEach(entry => {
          this.processEntry(entry, courierKey, stateKey);
        });
      });
    });

    // Also process entries from raw_row data to extract pricing from different columns
    this.processRawRowData();
    
    console.log(`✅ Extracted data for ${this.newProviders.size} providers`);
    console.log(`✅ Generated ${this.statewiseData.length} statewise charge entries`);
  }

  processEntry(entry, courierKey, stateKey) {
    if (!entry.raw_row) return;
    
    const row = entry.raw_row;
    
    // Extract pricing data from different courier columns
    Object.entries(COURIER_MAPPINGS).forEach(([excelColumn, providerName]) => {
      const rate = row[excelColumn];
      if (rate && !isNaN(parseFloat(rate)) && parseFloat(rate) > 0) {
        
        // Determine the state name
        let stateName = this.normalizeStateName(stateKey, row);
        if (!stateName) return;
        
        // Handle special charges
        this.handleSpecialCharges(excelColumn, rate, stateName, providerName, row);
        
        // Create provider if not exists
        if (!this.newProviders.has(providerName)) {
          this.newProviders.set(providerName, {
            providerName: providerName,
            description: `Integrated from Excel data`,
            isActive: true
          });
        }
        
        // Add statewise charge
        this.addStatewiseCharge(providerName, stateName, rate, excelColumn, row);
      }
    });
  }

  processRawRowData() {
    // Process UNKNOWN_COURIER entries which contain the main data
    const unknownCourier = this.jsonData.couriers['UNKNOWN_COURIER'];
    if (!unknownCourier?.states?.['UNKNOWN_STATE']?.conditions?.default?.entries) {
      return;
    }

    unknownCourier.states['UNKNOWN_STATE'].conditions.default.entries.forEach(entry => {
      if (!entry.raw_row) return;
      
      const row = entry.raw_row;
      
      // Get state name from andhra pradesh column (which contains city/state info)
      const locationInfo = row['andhra pradesh'];
      if (!locationInfo) return;
      
      const stateName = this.normalizeStateName(locationInfo, row);
      if (!stateName) return;
      
      // Process each courier column
      Object.entries(COURIER_MAPPINGS).forEach(([excelColumn, providerName]) => {
        const rate = row[excelColumn];
        if (rate && !isNaN(parseFloat(rate)) && parseFloat(rate) > 0) {
          
          // Handle special charges
          this.handleSpecialCharges(excelColumn, rate, stateName, providerName, row);
          
          // Create provider if not exists
          if (!this.newProviders.has(providerName)) {
            this.newProviders.set(providerName, {
              providerName: providerName,
              description: `Integrated from Excel data`,
              isActive: true
            });
          }
          
          // Add statewise charge
          this.addStatewiseCharge(providerName, stateName, rate, excelColumn, row);
        }
      });

      // Handle green tax separately
      const greenTax = row['green tax safexpress'];
      if (greenTax && !isNaN(parseFloat(greenTax)) && parseFloat(greenTax) > 0) {
        this.addSpecialCharge('GREEN_TAX', 'Safe Express', stateName, parseFloat(greenTax));
      }
    });
  }

  normalizeStateName(input, row) {
    if (!input || typeof input !== 'string') return null;
    
    const cleanInput = input.trim();
    
    // Check if it's a city that needs to be mapped to a state
    if (STATE_MAPPINGS[cleanInput]) {
      return STATE_MAPPINGS[cleanInput];
    }
    
    // Check if it's already a proper state name
    const properStates = [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
      'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
      'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
      'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
      'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
      'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
      'Lakshadweep', 'Puducherry'
    ];
    
    // Find case-insensitive match
    const matchedState = properStates.find(state => 
      state.toLowerCase() === cleanInput.toLowerCase()
    );
    
    if (matchedState) return matchedState;
    
    // Skip numeric values or invalid entries
    if (!isNaN(parseFloat(cleanInput)) || cleanInput.length < 2) {
      return null;
    }
    
    // Return as is for potential new states (with proper capitalization)
    return cleanInput.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  addStatewiseCharge(providerName, stateName, rate, excelColumn, row) {
    // Calculate fuel surcharge (default 12% if not specified)
    let fuelSurcharge = 12;
    
    // Try to extract fuel surcharge from specific patterns
    if (excelColumn.includes('air')) {
      fuelSurcharge = 15; // Higher fuel surcharge for air transport
    }
    
    // Check for existing entry to avoid duplicates
    const existingIndex = this.statewiseData.findIndex(item => 
      item.providerName === providerName && 
      item.state === stateName &&
      Math.abs(parseFloat(item.perKiloFee) - parseFloat(rate)) < 0.01
    );
    
    if (existingIndex === -1) {
      this.statewiseData.push({
        providerName: providerName,
        state: stateName,
        perKiloFee: parseFloat(rate),
        fuelSurcharge: fuelSurcharge,
        source: excelColumn,
        isAir: excelColumn.includes('air')
      });
    }
  }

  handleSpecialCharges(excelColumn, rate, stateName, providerName, row) {
    // Handle Green Tax
    if (excelColumn === 'green tax safexpress' || row['green tax safexpress']) {
      const greenTaxAmount = row['green tax safexpress'] || rate;
      if (!isNaN(parseFloat(greenTaxAmount)) && parseFloat(greenTaxAmount) > 0) {
        this.addSpecialCharge('GREEN_TAX', providerName, stateName, parseFloat(greenTaxAmount));
      }
    }
    
    // Handle Air Surcharge
    if (excelColumn.includes('air')) {
      this.addSpecialCharge('AIR_SURCHARGE', providerName, stateName, parseFloat(rate));
    }
    
    // Handle Delhi NCR Green Tax specifically
    if ((stateName === 'Delhi' || stateName === 'Haryana' || stateName === 'Uttar Pradesh') &&
        row['unnamed__7'] && row['unnamed__7'].toString().toLowerCase().includes('green tax delhi')) {
      this.addSpecialCharge('GREEN_TAX_DELHI', providerName, stateName, 100);
    }
  }

  addSpecialCharge(chargeType, providerName, stateName, amount) {
    const key = `${chargeType}_${providerName}_${stateName}`;
    if (!this.specialCharges.has(key)) {
      this.specialCharges.set(key, {
        chargeType,
        providerName,
        stateName,
        amount,
        description: SPECIAL_CHARGES[chargeType]?.description || chargeType
      });
    }
  }

  async connectToDatabase() {
    try {
      const mongoUri = process.env.ATLAS_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/shipping-drodin';
      await mongoose.connect(mongoUri);
      console.log('✅ Connected to MongoDB');
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message);
      return false;
    }
  }

  async updateProviders() {
    console.log('🔄 Updating providers...');
    
    for (const [providerName, providerData] of this.newProviders) {
      try {
        // Check if provider already exists
        let provider = await Provider.findOne({ providerName: providerName });
        
        if (!provider) {
          // Create new provider
          provider = new Provider(providerData);
          await provider.save();
          console.log(`✅ Created new provider: ${providerName}`);
        } else {
          console.log(`ℹ️ Provider already exists: ${providerName}`);
        }
      } catch (error) {
        console.error(`❌ Error updating provider ${providerName}:`, error.message);
      }
    }
  }

  async updateStatewiseCharges() {
    console.log('🔄 Updating statewise charges...');
    
    // Group by provider for better organization
    const providerGroups = new Map();
    this.statewiseData.forEach(charge => {
      if (!providerGroups.has(charge.providerName)) {
        providerGroups.set(charge.providerName, []);
      }
      providerGroups.get(charge.providerName).push(charge);
    });
    
    for (const [providerName, charges] of providerGroups) {
      try {
        // Get provider ID
        const provider = await Provider.findOne({ providerName: providerName });
        if (!provider) {
          console.warn(`⚠️ Provider not found: ${providerName}`);
          continue;
        }
        
        for (const charge of charges) {
          // Check if charge already exists
          const existingCharge = await StatewiseCharges.findOne({
            providerId: provider.providerId,
            state: charge.state,
            perKiloFee: charge.perKiloFee
          });
          
          if (!existingCharge) {
            // Create new statewise charge
            const newCharge = new StatewiseCharges({
              providerId: provider.providerId,
              providerName: provider.providerName,
              state: charge.state,
              perKiloFee: charge.perKiloFee,
              fuelSurcharge: charge.fuelSurcharge
            });
            
            await newCharge.save();
            console.log(`✅ Added charge: ${providerName} -> ${charge.state} @ ₹${charge.perKiloFee}/kg`);
          } else {
            // Update existing charge if rate is different
            if (existingCharge.perKiloFee !== charge.perKiloFee) {
              existingCharge.perKiloFee = charge.perKiloFee;
              existingCharge.fuelSurcharge = charge.fuelSurcharge;
              await existingCharge.save();
              console.log(`🔄 Updated charge: ${providerName} -> ${charge.state} @ ₹${charge.perKiloFee}/kg`);
            }
          }
        }
      } catch (error) {
        console.error(`❌ Error updating statewise charges for ${providerName}:`, error.message);
      }
    }
  }

  async createSpecialChargesModel() {
    // Create a new model for special charges if it doesn't exist
    const SpecialChargesSchema = new mongoose.Schema({
      providerId: { type: Number, required: true },
      providerName: { type: String, required: true },
      state: { type: String, required: true },
      chargeType: { type: String, required: true },
      amount: { type: Number, required: true },
      description: { type: String, required: true },
      isActive: { type: Boolean, default: true }
    }, {
      timestamps: true,
    });
    
    // Create compound index for efficient queries
    SpecialChargesSchema.index({ providerId: 1, state: 1, chargeType: 1 });
    
    return mongoose.model('SpecialCharges', SpecialChargesSchema);
  }

  async updateSpecialCharges() {
    if (this.specialCharges.size === 0) {
      console.log('ℹ️ No special charges to update');
      return;
    }

    console.log('🔄 Updating special charges...');
    
    try {
      const SpecialCharges = await this.createSpecialChargesModel();
      
      for (const [key, chargeData] of this.specialCharges) {
        const provider = await Provider.findOne({ providerName: chargeData.providerName });
        if (!provider) {
          console.warn(`⚠️ Provider not found for special charge: ${chargeData.providerName}`);
          continue;
        }
        
        // Check if special charge already exists
        const existingCharge = await SpecialCharges.findOne({
          providerId: provider.providerId,
          state: chargeData.stateName,
          chargeType: chargeData.chargeType
        });
        
        if (!existingCharge) {
          const newSpecialCharge = new SpecialCharges({
            providerId: provider.providerId,
            providerName: provider.providerName,
            state: chargeData.stateName,
            chargeType: chargeData.chargeType,
            amount: chargeData.amount,
            description: chargeData.description
          });
          
          await newSpecialCharge.save();
          console.log(`✅ Added special charge: ${chargeData.chargeType} for ${chargeData.providerName} in ${chargeData.stateName}`);
        }
      }
    } catch (error) {
      console.error('❌ Error updating special charges:', error.message);
    }
  }

  async generateReport() {
    console.log('\n📊 INTEGRATION REPORT');
    console.log('=====================================');
    console.log(`Total Providers: ${this.newProviders.size}`);
    console.log(`Total Statewise Charges: ${this.statewiseData.length}`);
    console.log(`Total Special Charges: ${this.specialCharges.size}`);
    
    console.log('\n🏢 PROVIDERS:');
    for (const [name, data] of this.newProviders) {
      console.log(`  - ${name}`);
    }
    
    console.log('\n📍 STATES COVERED:');
    const uniqueStates = new Set(this.statewiseData.map(charge => charge.state));
    uniqueStates.forEach(state => console.log(`  - ${state}`));
    
    console.log('\n💰 SPECIAL CHARGES:');
    for (const [key, charge] of this.specialCharges) {
      console.log(`  - ${charge.chargeType}: ${charge.providerName} -> ${charge.stateName} = ₹${charge.amount}`);
    }
    
    console.log('\n✅ Integration completed successfully!');
  }

  async run() {
    console.log('🚀 Starting Excel Data Integration...\n');
    
    // Load JSON data
    if (!(await this.loadJsonData())) {
      return false;
    }
    
    // Extract courier data
    this.extractCourierData();
    
    // Connect to database
    if (!(await this.connectToDatabase())) {
      return false;
    }
    
    // Update providers
    await this.updateProviders();
    
    // Update statewise charges
    await this.updateStatewiseCharges();
    
    // Update special charges
    await this.updateSpecialCharges();
    
    // Generate report
    await this.generateReport();
    
    // Close database connection
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
    
    return true;
  }
}

// Run the integration if this file is executed directly
if (require.main === module) {
  const integrator = new ExcelDataIntegrator();
  integrator.run().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Integration failed:', error);
    process.exit(1);
  });
}

module.exports = ExcelDataIntegrator;