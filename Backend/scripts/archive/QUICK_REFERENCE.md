# 🚀 QUICK COMMAND REFERENCE

## Update All Couriers
```powershell
cd Backend/scripts
node updateAllCouriers.js
```

## Run Quick Test (5 sec)
```powershell
node testQuick.js
```
or double-click: `runQuickTest.bat`

## Run Full Test (30-60 sec)
```powershell
node testCouriersComplete.js
```

## Run All Tests
```powershell
node runAllTests.js
```

## Test Freight Calculator
```powershell
cd Backend/utils
node freightCalculator.js
```

---

## Expected Results

### ✅ Success:
```
✅ Gatti Cargo | Divisor: 27000 | Min: 6 kg
✅ Depee World | Divisor: 27000 | Min: 6 kg
... (all 9 couriers)
```

### ❌ If you see errors:
1. Run updates first: `node updateAllCouriers.js`
2. Check MongoDB connection
3. Verify .env has correct ATLAS_URI

---

## File Locations

- **Update Scripts:** `Backend/scripts/update*.js`
- **Test Scripts:** `Backend/scripts/test*.js`
- **Utilities:** `Backend/utils/freightCalculator.js`
- **Models:** `Backend/models/fixedCharges.model.js`
- **Documentation:** `Backend/scripts/*.md`

---

## Volumetric Weight Reference

| Courier | Divisor | Min Weight |
|---------|---------|------------|
| Gatti Cargo | 27,000 | 6 kg |
| Depee World | 27,000 | 6 kg |
| Trackon | 4,500 | 0 kg |
| DTDC | 4,750 | 3 kg |
| DTDC Express | 27,000 | 25 kg |
| TCI | 27,000 | 20 kg |
| V Trans | 27,000 | 30 kg |
| Vision | 27,000 | 20 kg |
| Safexpress | 27,000 | 20 kg |

---

## Quick Calculation Formula

```
1. Volumetric = (L × W × H) ÷ Divisor
2. Chargeable = MAX(Actual, Volumetric, Minimum)
3. Freight = Chargeable × Rate
4. Add Fuel Surcharge + Docket + GST
```

---

**Need Help?** Check `TESTING_README.md` or `VOLUMETRIC_IMPLEMENTATION.md`
