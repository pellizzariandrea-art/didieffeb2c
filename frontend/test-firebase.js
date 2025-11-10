// Test Firebase Connection
const { initializeApp } = require('firebase/app');
const { getAuth, connectAuthEmulator } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyDuLe-a7fN_SSdkVittSJxcjnvrSbHKpGE",
  authDomain: "didieffeb2b-ecommerce.firebaseapp.com",
  projectId: "didieffeb2b-ecommerce",
  storageBucket: "didieffeb2b-ecommerce.firebasestorage.app",
  messagingSenderId: "333046451505",
  appId: "1:333046451505:web:3eab0cab2b8917ca783410"
};

console.log('🔥 Testing Firebase Configuration...\n');
console.log('Config:', JSON.stringify(firebaseConfig, null, 2));

try {
  const app = initializeApp(firebaseConfig);
  console.log('✅ Firebase app initialized successfully');

  const auth = getAuth(app);
  console.log('✅ Firebase Auth initialized');
  console.log('📍 Auth Domain:', auth.config.apiHost);

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Full error:', error);
}
