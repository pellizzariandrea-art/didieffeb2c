// cleanup-orphaned-tokens.js
// Script to clean up tokens and data from users that no longer exist in Firebase Auth

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, '..', 'admin', 'didieffeb2b-ecommerce-firebase-adminsdk-fbsvc-fbd636cc08.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

const db = admin.firestore();
const auth = admin.auth();

async function checkUserExists(userId) {
  try {
    await auth.getUser(userId);
    return true;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      return false;
    }
    throw error;
  }
}

async function cleanupOrphanedTokens() {
  console.log('🧹 Starting cleanup of orphaned tokens...\n');

  let stats = {
    emailVerifications: { checked: 0, deleted: 0 },
    passwordTokens: { checked: 0, deleted: 0 },
    users: { checked: 0, orphaned: 0 },
  };

  try {
    // 1. Clean up email verification tokens
    console.log('📧 Checking email verification tokens...');
    const emailVerifications = await db.collection('email_verifications').get();
    stats.emailVerifications.checked = emailVerifications.size;

    for (const doc of emailVerifications.docs) {
      const data = doc.data();
      const userId = data.userId;

      if (userId) {
        const userExists = await checkUserExists(userId);
        if (!userExists) {
          console.log(`  ❌ User ${userId} not found - deleting token ${doc.id}`);
          await doc.ref.delete();
          stats.emailVerifications.deleted++;
        }
      } else {
        console.log(`  ⚠️  Token ${doc.id} has no userId - deleting`);
        await doc.ref.delete();
        stats.emailVerifications.deleted++;
      }
    }

    // 2. Clean up password setup tokens
    console.log('\n🔐 Checking password setup tokens...');
    const passwordTokens = await db.collection('password_setup_tokens').get();
    stats.passwordTokens.checked = passwordTokens.size;

    for (const doc of passwordTokens.docs) {
      const data = doc.data();
      const userId = data.userId;

      if (userId) {
        const userExists = await checkUserExists(userId);
        if (!userExists) {
          console.log(`  ❌ User ${userId} not found - deleting token ${doc.id}`);
          await doc.ref.delete();
          stats.passwordTokens.deleted++;
        }
      } else {
        console.log(`  ⚠️  Token ${doc.id} has no userId - deleting`);
        await doc.ref.delete();
        stats.passwordTokens.deleted++;
      }
    }

    // 3. Check for orphaned user documents (in Firestore but not in Auth)
    console.log('\n👤 Checking user documents...');
    const users = await db.collection('users').get();
    stats.users.checked = users.size;

    for (const doc of users.docs) {
      const userId = doc.id;
      const userExists = await checkUserExists(userId);

      if (!userExists) {
        console.log(`  ⚠️  User document ${userId} exists in Firestore but not in Auth`);
        console.log(`     Email: ${doc.data().email || 'N/A'}`);
        console.log(`     Name: ${doc.data().nome || doc.data().ragioneSociale || 'N/A'}`);
        stats.users.orphaned++;

        // Ask if we should delete (we'll just report for now)
        // Uncomment the following lines if you want to auto-delete orphaned user docs
        // console.log(`     Deleting orphaned user document...`);
        // await doc.ref.delete();
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 CLEANUP SUMMARY');
    console.log('='.repeat(60));
    console.log(`\n📧 Email Verification Tokens:`);
    console.log(`   Total checked: ${stats.emailVerifications.checked}`);
    console.log(`   Deleted: ${stats.emailVerifications.deleted}`);

    console.log(`\n🔐 Password Setup Tokens:`);
    console.log(`   Total checked: ${stats.passwordTokens.checked}`);
    console.log(`   Deleted: ${stats.passwordTokens.deleted}`);

    console.log(`\n👤 User Documents:`);
    console.log(`   Total checked: ${stats.users.checked}`);
    console.log(`   Orphaned (in Firestore but not Auth): ${stats.users.orphaned}`);

    console.log('\n✅ Cleanup completed successfully!');

    if (stats.users.orphaned > 0) {
      console.log('\n⚠️  Note: Orphaned user documents were found but NOT deleted.');
      console.log('   Review them above and delete manually if needed from Firebase Console.');
    }

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    throw error;
  }
}

// Run the cleanup
cleanupOrphanedTokens()
  .then(() => {
    console.log('\n👋 Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
