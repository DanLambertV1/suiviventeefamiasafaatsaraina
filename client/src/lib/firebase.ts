import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Production Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyArF2HQYsikpctyr_B38MJyDQhtOznP9iI",
  authDomain: "suiviventes-v3-moderne.firebaseapp.com",
  projectId: "suiviventes-v3-moderne",
  storageBucket: "suiviventes-v3-moderne.firebasestorage.app",
  messagingSenderId: "570814845718",
  appId: "1:570814845718:web:0b5225abca8bf440947637"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services for production
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Configure auth settings for production
auth.useDeviceLanguage(); // Use device language for auth UI
auth.settings.appVerificationDisabledForTesting = false; // Enable app verification

export default app;

// Firestore collection names
export const COLLECTIONS = {
  REGISTER_SALES: 'register_sales',
  PRODUCTS: 'products',
  USERS: 'users',
  ALERTS: 'alerts',
  SETTINGS: 'settings'
} as const;

// Firestore data types
export interface FirestoreRegisterSale {
  id: string;
  product: string;
  category: string;
  register: string;
  date: string; // ISO string
  seller: string;
  quantity: number;
  price: number;
  total: number;
  createdAt: string; // ISO string
  // ✅ NEW: Categorization metadata field
  category_metadata?: {
    category: string;
    subcategory?: string | null;
    categorized_at: string;
    categorized_by: string;
  };
}

export interface FirestoreProduct {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number; // Final quantity
  initialStock?: number; // Initial quantity from stock import
  quantitySold?: number; // Quantity sold from sales import
  minStock: number;
  description?: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface FirestoreUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'seller' | 'viewer';
  createdAt: string; // ISO string
  lastLogin?: string; // ISO string
}

export interface FirestoreAlert {
  id: string;
  type: 'low-stock' | 'high-sales' | 'system' | 'duplicate';
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: string; // ISO string
  read: boolean;
  userId?: string;
}

// Production environment configuration
export const ENV_CONFIG = {
  isDevelopment: false,
  isProduction: true,
  apiUrl: 'https://suiviventes-v3-moderne.firebaseapp.com',
  enableAnalytics: true,
  enablePerformanceMonitoring: true,
  logLevel: 'error' // Only log errors in production
};

// Security configuration for production
export const SECURITY_CONFIG = {
  sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  requireEmailVerification: true,
  enableTwoFactorAuth: false, // Can be enabled later
  passwordMinLength: 8,
  passwordRequireSpecialChars: true
};

// Performance configuration
export const PERFORMANCE_CONFIG = {
  enableOfflineSupport: true,
  cacheSizeBytes: 40 * 1024 * 1024, // 40MB
  enablePersistence: true,
  syncSettings: {
    cacheSizeBytes: 40 * 1024 * 1024
  }
};