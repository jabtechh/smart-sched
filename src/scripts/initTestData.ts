import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const ADMIN_USER = {
  email: 'admin@example.com',
  password: 'password123',
  role: 'admin',
  displayName: 'Admin User'
};

const PROFESSOR_USER = {
  email: 'professor@example.com',
  password: 'password123',
  role: 'professor',
  displayName: 'Professor User'
};

const TEST_ROOMS = [
  {
    name: 'Room 101',
    building: 'Main Building',
    floor: '1st Floor',
    capacity: 30,
    facilities: ['Projector', 'Whiteboard', 'Air Conditioning'],
    status: 'available'
  },
  {
    name: 'Computer Lab 1',
    building: 'Technology Building',
    floor: '2nd Floor',
    capacity: 40,
    facilities: ['Computers', 'Projector', 'Air Conditioning'],
    status: 'available'
  },
  {
    name: 'Science Lab',
    building: 'Science Building',
    floor: '1st Floor',
    capacity: 25,
    facilities: ['Lab Equipment', 'Whiteboard', 'Sink'],
    status: 'maintenance'
  },
  {
    name: 'Room 201',
    building: 'Main Building',
    floor: '2nd Floor',
    capacity: 35,
    facilities: ['Projector', 'Whiteboard', 'Air Conditioning'],
    status: 'occupied'
  }
];

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
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log(`Created user ${userData.email} with role ${userData.role}`);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`User ${userData.email} already exists`);
      } else {
        console.error(`Error creating user ${userData.email}:`, error);
      }
    }
  }

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