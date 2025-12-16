import { config } from 'dotenv';
import { resolve } from 'path';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, collection, addDoc, serverTimestamp, getDoc, updateDoc, query, where, getDocs } from 'firebase/firestore';

// Load env from root
config({ path: resolve('./.env') });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const ADMIN_USER = {
  email: 'admin@pateros.edu.ph',
  password: 'password123',
  role: 'admin',
  displayName: 'Administrator'
};

const PROFESSOR_USER = {
  email: 'professor@pateros.edu.ph',
  password: 'password123',
  role: 'professor',
  displayName: 'Professor'
};

const SUPER_ADMIN_USER = {
  email: 'superadmin@pateros.edu.ph',
  password: 'password123',
  role: 'super-admin',
  displayName: 'Super Administrator'
};

const TEST_ROOMS: any[] = [];


async function createTestUsers() {
  // Create test users
  async function createUser(userData: typeof ADMIN_USER) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userData.email,
        role: userData.role,
        displayName: userData.displayName,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log(`Created user ${userData.email} with role ${userData.role}`);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`User ${userData.email} already exists, updating if necessary...`);
        // Try to find the user by email and update them
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('email', '==', userData.email));
          const snapshot = await getDocs(q);
          
          if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            await updateDoc(userDoc.ref, {
              role: userData.role,
              displayName: userData.displayName,
              status: 'active',
              updatedAt: serverTimestamp()
            });
            console.log(`Updated existing user ${userData.email}`);
          }
        } catch (updateError) {
          console.error(`Could not update user ${userData.email}:`, updateError);
        }
      } else {
        console.error(`Error creating user ${userData.email}:`, error);
      }
    }
  }

  await createUser(SUPER_ADMIN_USER);
  await createUser(ADMIN_USER);
  await createUser(PROFESSOR_USER);
}

async function createTestRooms() {
  // Create test rooms
  for (const room of TEST_ROOMS) {
    try {
      await addDoc(collection(db, 'rooms'), {
        ...room,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      console.log(`Created room ${room.name}`);
    } catch (error) {
      console.error(`Error creating room ${room.name}:`, error);
    }
  }
}

export async function initializeTestData() {
  console.log('Initializing test data...');
  await createTestUsers();
  await createTestRooms();
  console.log('Test data initialization complete');
}

// Run initialization if this is run directly
if (require.main === module) {
  initializeTestData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Error initializing test data:', error);
      process.exit(1);
    });
}