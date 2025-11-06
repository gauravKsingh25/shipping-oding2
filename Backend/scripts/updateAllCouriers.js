const { exec } = require('child_process');
const path = require('path');

// List of all courier partner update scripts
const scripts = [
  'updateGattiCargo.js',
  'updateDepeeWorld.js',
  'updateTrackonCourier.js',
  'updateDTDCCourier.js',
  'updateDTDCExpressCargo.js',
  'updateTCITransport.js',
  'updateVTrans.js',
  'updateVisionLogistics.js',
  'updateSafexpress.js'
];

console.log('=============================================');
console.log('🚀 Starting Courier Partner Charges Update');
console.log('=============================================\n');

let currentIndex = 0;

function runNextScript() {
  if (currentIndex >= scripts.length) {
    console.log('\n=============================================');
    console.log('✅ All courier partner charges updated successfully!');
    console.log('=============================================');
    return;
  }

  const script = scripts[currentIndex];
  const scriptPath = path.join(__dirname, script);
  
  console.log(`\n[${currentIndex + 1}/${scripts.length}] Running ${script}...`);
  console.log('---------------------------------------------');

  exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error running ${script}:`, error.message);
      console.error(stderr);
    } else {
      console.log(stdout);
    }

    currentIndex++;
    // Add a small delay between scripts to avoid connection issues
    setTimeout(runNextScript, 2000);
  });
}

// Start running scripts sequentially
runNextScript();
