const labels = require('./frontend/config/ui-labels.json');

console.log('✅ Checking auth labels...\n');

const requiredLabels = [
  'email',
  'password',
  'login',
  'register',
  'logout',
  'forgot_password',
  'admin_panel',
  'user_panel'
];

let allGood = true;

requiredLabels.forEach(label => {
  if (!labels.auth[label]) {
    console.log(`❌ Missing: auth.${label}`);
    allGood = false;
  } else if (!labels.auth[label].en) {
    console.log(`❌ Missing English translation: auth.${label}.en`);
    allGood = false;
  } else {
    console.log(`✅ auth.${label} - OK`);
  }
});

if (allGood) {
  console.log('\n✅ All labels present!');
} else {
  console.log('\n❌ Some labels are missing!');
  process.exit(1);
}
