import { config } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '..', '.env') });
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, setDoc, doc, collection, getDoc, updateDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';

// Load environment variables
const envPath = join(__dirname, '..', '.env');
console.log('Loading environment variables from:', envPath);
config({ path: envPath });

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
  apiKey: '***' // Hide sensitive data
});

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function createTestUsers() {
  console.log('Starting test user creation...');

  async function getOrCreateUser(email: string, password: string) {
    try {
      // Try to sign in first
      console.log(`Attempting to sign in ${email}...`);
      const signInResult = await signInWithEmailAndPassword(auth, email, password);
      console.log(`Successfully signed in ${email} with UID:`, signInResult.user.uid);
      return signInResult.user;
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // If user doesn't exist, create them
        console.log(`User ${email} not found, creating new account...`);
        const createResult = await createUserWithEmailAndPassword(auth, email, password);
        console.log(`Successfully created new user ${email} with UID:`, createResult.user.uid);
        return createResult.user;
      }
      throw error;
    }
  }

  async function ensureUserInFirestore(user: any, role: string, displayName: string) {
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
    console.error('Error in createTestUsers:', error);
    throw error;
  }
}

async function createTestRooms() {
  const rooms = [
    {
      name: 'Room 101',
      capacity: 30,
      building: 'Main Building',
      floor: '1st',
      type: 'classroom'
    },
    {
      name: 'Computer Lab 1',
      capacity: 25,
      building: 'Technology Building',
      floor: '2nd',
      type: 'laboratory'
    },
    {
      name: 'Conference Room A',
      capacity: 15,
      building: 'Admin Building',
      floor: '3rd',
      type: 'conference'
    }
  ];

  for (const room of rooms) {
    try {
      const roomRef = doc(collection(db, 'rooms'));
      await setDoc(roomRef, {
        ...room,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Room ${room.name} created successfully`);
    } catch (error) {
      console.error(`Error creating room ${room.name}:`, error);
    }
  }
}

// Run initialization
async function initializeTestData() {
  console.log('Starting test data initialization...');
  await createTestUsers();
  await createTestRooms();
  console.log('Test data initialization complete!');
}

initializeTestData().catch(console.error);