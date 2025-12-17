# Courier Partner Charges Update Scripts

This directory contains scripts to update courier partner charges in MongoDB based on the data from `utils/data.txt`.

## Available Scripts

### Individual Courier Partner Scripts:

1. **updateGattiCargo.js** - Updates Gatti Cargo charges
2. **updateDepeeWorld.js** - Updates Depee World (DP World) charges
3. **updateTrackonCourier.js** - Updates Trackon Courier charges
4. **updateDTDCCourier.js** - Updates DTDC Courier charges
5. **updateDTDCExpressCargo.js** - Updates DTDC Express Cargo charges
6. **updateTCITransport.js** - Updates TCI Transport charges
7. **updateVTrans.js** - Updates V Trans charges
8. **updateVisionLogistics.js** - Updates Vision Logistics charges
9. **updateSafexpress.js** - Updates Safexpress charges

### Master Script:

- **updateAllCouriers.js** - Runs all courier update scripts sequentially

## How to Run

### Update All Courier Partners at Once:

```bash
cd Backend/scripts
node updateAllCouriers.js
```

### Update Individual Courier Partner:

```bash
cd Backend/scripts
node updateGattiCargo.js
# or
node updateDepeeWorld.js
# or any other specific courier script
```

## What Each Script Does

Each script performs the following operations:

1. **Creates/Updates Provider** - Adds the courier partner to the providers collection if not exists
2. **Updates Statewise Charges** - Sets per-kilo rates for each state with fuel surcharge
3. **Updates City-Specific Charges** - Sets special rates for major cities
4. **Updates Fixed Charges** - Sets docket charges, COD charges, holiday charges, etc.
5. **Updates Special Charges** - Adds GST, green tax, air surcharges, etc.

## Database Structure

The scripts update the following collections:

- **providers** - Courier partner information
- **statewisecharges** - Per-kilo rates for each state/city
- **fixedcharges** - Fixed charges like docket fee, COD, etc.
- **specialcharges** - Special charges like GST, green tax, air service, etc.

## Data Source

All data is parsed from `Backend/utils/data.txt` and structured according to:

- State-wise charges per kilogram
- City-specific charges
- Fuel surcharge percentages
- Fixed charges (docket, COD, holiday, etc.)
- Special charges (GST, green tax, ODA, etc.)
- Service-specific charges (Air service, etc.)

## Notes

- Scripts use **upsert** operations, so running them multiple times will update existing data
- All monetary values are in Indian Rupees (₹)
- Fuel surcharge varies by courier partner (5% - 20%)
- GST is typically 18% (V Trans uses 12%)
- Connection string is configured in each script (can be moved to .env for production)

## MongoDB Connection

The scripts connect to:
```
mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/
```

## Error Handling

Each script includes:
- Try-catch blocks for error handling
- Detailed console logging
- Automatic database connection cleanup
- Descriptive error messages

## Requirements

- Node.js installed
- MongoDB connection access
- Required npm packages:
  - mongoose
  - (already in package.json)
