import { createContext, useContext, useEffect, useState } from 'react';
import { 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

type UserRole = 'admin' | 'professor';

interface AuthUser {
  uid: string;
  email: string | null;
  role: UserRole;
  displayName: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
      if (firebaseUser) {
        // Get user role from Firestore
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.data();
        
        if (userData) {
          console.log('Firestore user data:', userData);
          const userInfo = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: userData.role as UserRole,
            displayName: userData.displayName,
          };
          console.log('Setting user info:', userInfo);
          setUser(userInfo);
          localStorage.setItem('userRole', userInfo.role);
          console.log('Role saved to localStorage:', userInfo.role);
        } else {
          console.log('No user data found in Firestore');
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('Starting sign in for:', email);
    const credential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User authenticated:', credential.user.uid);
    
    const userDocRef = doc(db, 'users', credential.user.uid);
    console.log('Fetching user doc from:', userDocRef.path);
    
    const userDoc = await getDoc(userDocRef);
    console.log('User doc exists:', userDoc.exists());
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      console.log('User data:', userData);
      
      const userInfo = {
        uid: credential.user.uid,
        email: credential.user.email,
        role: userData.role as UserRole,
        displayName: userData.displayName,
      };
      console.log('Setting user info:', userInfo);
      setUser(userInfo);
      localStorage.setItem('userRole', userData.role);
      console.log('User role saved to localStorage:', userData.role);
    } else {
      console.error('No Firestore document found for user:', credential.user.uid);
      throw new Error('User data not found');
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    localStorage.removeItem('userRole');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};