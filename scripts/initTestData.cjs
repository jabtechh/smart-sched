require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, getDoc, setDoc, updateDoc } = require('firebase/firestore');

// Validate environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

console.log('Initializing Firebase with config:', {
  ...firebaseConfig,
  apiKey: '***'
});

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function getOrCreateUser(email, password) {
  try {
    console.log(`Attempting to sign in ${email}...`);
    const signInResult = await signInWithEmailAndPassword(auth, email, password);
    console.log(`Successfully signed in ${email} with UID:`, signInResult.user.uid);
    return signInResult.user;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.log(`User ${email} not found, creating new account...`);
      const createResult = await createUserWithEmailAndPassword(auth, email, password);
      console.log(`Successfully created new user ${email} with UID:`, createResult.user.uid);
      return createResult.user;
    }
    throw error;
  }
}

async function ensureUserInFirestore(user, role, displayName) {
  const userRef = doc(db, 'users', user.uid);
  console.log(`Checking Firestore document at path: ${userRef.path}`);
  
  const userData = {
    email: user.email,
    role,
    displayName,
    updatedAt: new Date(),
  };

  try {
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      console.log(`Updating existing Firestore document for ${user.email}`);
      await updateDoc(userRef, userData);
    } else {
      console.log(`Creating new Firestore document for ${user.email}`);
      await setDoc(userRef, {
        ...userData,
        createdAt: new Date(),
      });
    }
    
    // Verify the document was created/updated
    const verifyDoc = await getDoc(userRef);
    if (verifyDoc.exists()) {
      console.log(`Verified Firestore document for ${user.email}:`, verifyDoc.data());
    } else {
      throw new Error('Document was not created/updated successfully');
    }
  } catch (error) {
    console.error(`Error managing Firestore document for ${user.email}:`, error);
    throw error;
  }
}

async function initializeTestData() {
  try {
    // Set up admin user
    console.log('Setting up admin user...');
    const adminUser = await getOrCreateUser('admin@example.com', 'adminpass123');
    await ensureUserInFirestore(adminUser, 'admin', 'Admin User');
    console.log('Admin user setup complete');

    // Set up professor user
    console.log('Setting up professor user...');
    const profUser = await getOrCreateUser('professor@example.com', 'profpass123');
    await ensureUserInFirestore(profUser, 'professor', 'Professor User');
    console.log('Professor user setup complete');
  } catch (error) {
    console.error('Error in initializeTestData:', error);
    process.exit(1);
  }
}

initializeTestData().then(() => {
  console.log('Test data initialization complete!');
  process.exit(0);
}).catch(error => {
  console.error('Failed to initialize test data:', error);
  process.exit(1);
});