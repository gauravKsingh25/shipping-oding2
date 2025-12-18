// Test to demonstrate correct minimum weight logic

console.log('='.repeat(80));
console.log('📊 MINIMUM WEIGHT LOGIC - CORRECT vs WRONG');
console.log('='.repeat(80));
console.log('\n📦 Example: 3 boxes of 55×44×33 cm, 6 kg each\n');

const boxes = [
  { length: 55, breadth: 44, height: 33, weight: 6, qty: 3 }
];

const divisor = 27000; // Gatti Cargo
const minWeight = 15; // Minimum weight for entire shipment

// Calculate totals
const totalActual = boxes[0].weight * boxes[0].qty; // 6 × 3 = 18 kg
const volPerBox = (boxes[0].length * boxes[0].breadth * boxes[0].height) / divisor;
const totalVolumetric = volPerBox * boxes[0].qty; // 2.96 × 3 = 8.88 kg

console.log('❌ WRONG METHOD (applying minimum per box):');
console.log('─'.repeat(80));
console.log('   Per box calculation:');
console.log(`     Volumetric: ${volPerBox.toFixed(2)} kg`);
console.log(`     Actual: ${boxes[0].weight} kg`);
console.log(`     Minimum: ${minWeight} kg`);
console.log(`     Chargeable per box: MAX(${volPerBox.toFixed(2)}, ${boxes[0].weight}, ${minWeight}) = ${Math.max(volPerBox, boxes[0].weight, minWeight)} kg`);
console.log(`   Total: ${Math.max(volPerBox, boxes[0].weight, minWeight)} × 3 = ${(Math.max(volPerBox, boxes[0].weight, minWeight) * 3).toFixed(2)} kg ❌`);
console.log(`   Problem: Each box gets charged 15 kg even though total is only 18 kg!\n`);

console.log('✅ CORRECT METHOD (applying minimum to total shipment):');
console.log('─'.repeat(80));
console.log('   Total calculation:');
console.log(`     Total Actual: ${boxes[0].weight} × 3 = ${totalActual} kg`);
console.log(`     Total Volumetric: ${volPerBox.toFixed(2)} × 3 = ${totalVolumetric.toFixed(2)} kg`);
console.log(`     Minimum (for entire shipment): ${minWeight} kg`);
console.log(`     Chargeable: MAX(${totalActual}, ${totalVolumetric.toFixed(2)}, ${minWeight}) = ${Math.max(totalActual, totalVolumetric, minWeight)} kg ✅`);
console.log(`   Correct! Using actual weight of 18 kg since it's more than minimum 15 kg\n`);

console.log('='.repeat(80));
console.log('\n📦 Another Example: 2 boxes of 30×20×10 cm, 3 kg each\n');

const boxes2 = [
  { length: 30, breadth: 20, height: 10, weight: 3, qty: 2 }
];

const totalActual2 = boxes2[0].weight * boxes2[0].qty; // 3 × 2 = 6 kg
const volPerBox2 = (boxes2[0].length * boxes2[0].breadth * boxes2[0].height) / divisor;
const totalVolumetric2 = volPerBox2 * boxes2[0].qty; // 0.22 × 2 = 0.44 kg

console.log('❌ WRONG METHOD:');
console.log('─'.repeat(80));
console.log(`   Per box: MAX(${volPerBox2.toFixed(2)}, 3, 15) = 15 kg`);
console.log(`   Total: 15 × 2 = 30 kg ❌\n`);

console.log('✅ CORRECT METHOD:');
console.log('─'.repeat(80));
console.log(`   Total Actual: 3 × 2 = ${totalActual2} kg`);
console.log(`   Total Volumetric: ${volPerBox2.toFixed(2)} × 2 = ${totalVolumetric2.toFixed(2)} kg`);
console.log(`   Minimum: ${minWeight} kg`);
console.log(`   Chargeable: MAX(${totalActual2}, ${totalVolumetric2.toFixed(2)}, ${minWeight}) = ${Math.max(totalActual2, totalVolumetric2, minWeight)} kg ✅`);
console.log(`   Correct! Using minimum of 15 kg since both actual (6 kg) and volumetric (0.44 kg) are less\n`);

console.log('='.repeat(80));
console.log('🎯 KEY POINT: Minimum weight applies to ENTIRE SHIPMENT, not per box!');
console.log('='.repeat(80));
