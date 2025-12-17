# 📦 Courier Partner Charges Update - Summary

## ✅ Created Files

I've created **11 new files** in the `Backend/scripts/` directory:

### Individual Courier Partner Update Scripts (9 files):

1. ✅ **updateGattiCargo.js**
2. ✅ **updateDepeeWorld.js**
3. ✅ **updateTrackonCourier.js**
4. ✅ **updateDTDCCourier.js**
5. ✅ **updateDTDCExpressCargo.js**
6. ✅ **updateTCITransport.js**
7. ✅ **updateVTrans.js**
8. ✅ **updateVisionLogistics.js**
9. ✅ **updateSafexpress.js**

### Utility Scripts (2 files):

10. ✅ **updateAllCouriers.js** - Master script to run all updates
11. ✅ **COURIER_UPDATES_README.md** - Documentation

---

## 📊 Data Coverage

Each script updates the following for its respective courier partner:

### 1. **Gatti Cargo**
- 35 state/city rates
- Fuel surcharge: 15%
- Fixed charges: Docket (₹50), COD (₹50), Holiday (₹400)
- GST: 18%

### 2. **Depee World (DP World)**
- 33 state rates + 8 city-specific rates
- Fuel surcharge: 15%
- Fixed charges: Docket (₹50), COD (₹100), Holiday (₹150)
- ODA: ₹3/kg
- GST: 18%

### 3. **Trackon Courier**
- 34 state rates + 9 city-specific rates
- Fuel surcharge: 20%
- Air service charges for Telangana & Kerala
- COD: ₹300
- E-way Bill: ₹100
- GST: 18%

### 4. **DTDC Courier**
- 34 state rates + 14 city-specific rates
- Fuel surcharge: 15%
- Air service charges for 8 cities
- Fixed charges: Docket (₹150), COD (₹150)
- E-way Bill: ₹200
- GST: 18%

### 5. **DTDC Express Cargo**
- 34 state rates + 18 city-specific rates
- Fuel surcharge: 10%
- Fixed charges: Docket (₹50), COD (₹100)
- GST: 18%

### 6. **TCI Transport**
- 35 state rates + 18 city-specific rates
- Fuel surcharge: 18%
- Fixed charges: Docket (₹50), COD (₹100), Holiday (₹250)
- Insurance: 0.001%
- GST: 18%

### 7. **V Trans**
- 34 state rates + 18 city-specific rates
- Fuel surcharge: 5%
- Fixed charges: Docket (₹50), COD (₹75)
- Insurance: 0.0001%
- **GST: 12%** (special rate)

### 8. **Vision Logistics**
- 31 state rates + 17 city-specific rates
- No fuel surcharge
- Fixed charges: Docket (₹50), COD (₹150), ODA (₹350)
- GST: 18%

### 9. **Safexpress**
- 35 state rates + 19 city-specific rates
- Fuel surcharge: 20%
- **Green Tax: ₹100** (for 13 major cities)
- Fixed charges: Docket (₹100), COD (₹250), ODA (₹1200)
- GST: 18%

---

## 🚀 How to Use

### Option 1: Update All Couriers at Once (Recommended)

```bash
cd Backend/scripts
node updateAllCouriers.js
```

This will run all 9 courier updates sequentially with proper delays between each.

### Option 2: Update Individual Courier

```bash
cd Backend/scripts
node updateGattiCargo.js
```

Replace with any specific courier script name.

---

## 🗄️ Database Collections Updated

Each script updates these MongoDB collections:

1. **providers** - Courier partner details
2. **statewisecharges** - Per-kilo rates by state/city
3. **fixedcharges** - Fixed fees (docket, COD, holiday, etc.)
4. **specialcharges** - Special charges (GST, green tax, air service, etc.)

---

## 📝 Key Features

✅ **Upsert Operations** - Safe to run multiple times, will update existing data
✅ **Auto ID Assignment** - Providers get auto-incremented IDs
✅ **City-Specific Rates** - Major cities have special rates
✅ **Service-Type Charges** - Air service surcharges where applicable
✅ **Green Tax** - Applied to major metro cities (Safexpress)
✅ **Error Handling** - Comprehensive try-catch blocks
✅ **Detailed Logging** - See exactly what's being updated
✅ **Sequential Execution** - Master script runs updates one by one

---

## 📋 Data Mapping from data.txt

The scripts parse and structure data from `Backend/utils/data.txt`:

- **State charges** → `statewisecharges` collection
- **DOCKET CHARGES** → `fixedcharges.docketCharge`
- **COD** → `fixedcharges.codCharge`
- **FUEL** → `statewisecharges.fuelSurcharge`
- **GST** → `specialcharges` (18% or 12%)
- **GREENT TAX** → `specialcharges.GREEN_TAX`
- **FOV** → `fixedcharges.insuranceChargePercent`
- **ODA** → `fixedcharges.outstationCharge`
- **Air charges** → `specialcharges.AIR_SURCHARGE`

---

## ⚙️ MongoDB Connection

All scripts use:
```
mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/
```

---

## 📊 Total Data Points

- **9 Courier Partners**
- **~300+ State/City Rate Entries**
- **~50+ Special Charges**
- **9 Fixed Charge Sets**
- **All GST Configurations**

---

## 🎯 Next Steps

1. Run the master script:
   ```bash
   node updateAllCouriers.js
   ```

2. Verify the data in MongoDB

3. Test the API endpoints to ensure charges are calculated correctly

4. Check the frontend dashboard for updated rates

---

## 🛠️ Troubleshooting

**Connection Issues?**
- Check MongoDB URI is correct
- Ensure network access to MongoDB Atlas

**Script Errors?**
- Make sure you're in the `Backend/scripts/` directory
- Run `npm install` in Backend directory if mongoose is missing

**Data Not Updating?**
- Check MongoDB collections for existing data
- Look at console output for specific errors

---

## 📞 Support

If you encounter any issues:
1. Check the console output for detailed error messages
2. Verify MongoDB connection
3. Ensure all required models exist in `Backend/models/`

---

**Created:** November 7, 2025
**Status:** Ready to Use ✅
