const { exec } = require('child_process');
const path = require('path');

console.log('\n' + '='.repeat(70));
console.log('🧪 COURIER PARTNER TEST SUITE');
console.log('='.repeat(70));

const tests = [
  {
    name: 'Quick Database Test',
    script: 'testQuick.js',
    description: 'Checks if all couriers have volumetric weight config'
  },
  {
    name: 'Comprehensive Test',
    script: 'testCouriersComplete.js',
    description: 'Tests all couriers with sample shipments'
  }
];

let currentTest = 0;

function runNextTest() {
  if (currentTest >= tests.length) {
    console.log('\n' + '='.repeat(70));
    console.log('✅ ALL TESTS COMPLETED');
    console.log('='.repeat(70) + '\n');
    return;
  }

  const test = tests[currentTest];
  const scriptPath = path.join(__dirname, test.script);

  console.log(`\n[${'='.repeat(66)}]`);
  console.log(`  Test ${currentTest + 1}/${tests.length}: ${test.name}`);
  console.log(`  ${test.description}`);
  console.log(`[${'='.repeat(66)}]\n`);

  exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Test failed: ${error.message}`);
      console.error(stderr);
    } else {
      console.log(stdout);
    }

    currentTest++;
    setTimeout(runNextTest, 1000);
  });
}

runNextTest();
