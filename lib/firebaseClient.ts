import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  UserCredential,
  updateProfile,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  getDocs,
  QueryDocumentSnapshot,
} from "firebase/firestore";

// Firebase configuration interface
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// User profile interface
export interface UserProfile {
  uid: string;
  email: string;
  username: string;
  displayName?: string;
  photoURL?: string;
  emailVerified?: boolean; // Trạng thái xác thực OTP
  role?: "user" | "owner"; // Role-based authentication
  lastLoginAt?: string; // Lần đăng nhập cuối
  createdAt: string;
  updatedAt: string;
}

// Check if email is owner
export function isOwnerEmail(email: string): boolean {
  return email === "owner@gmail.com";
}

// Get user role based on email (deprecated - use getUserRoleFromDB instead)
export function getUserRole(email: string): "user" | "owner" {
  return isOwnerEmail(email) ? "owner" : "user";
}

// Get user role from database
export async function getUserRoleFromDB(
  uid: string
): Promise<"user" | "owner"> {
  try {
    const userProfile = await getUserProfile(uid);
    return userProfile?.role || "user";
  } catch (error) {
    console.error("Error getting user role:", error);
    return "user";
  }
}

// Account interface for game accounts
export interface GameAccount {
  id: string;
  name: string;
  productCode: string;
  price: string;
  description: string;
  images: string[];
  specifications: AccountSpecification[];
  type: "available" | "preorder"; // Acc có sẵn hoặc đặt trước
  createdAt: string;
  updatedAt: string;
  createdBy: string; // owner uid
}

// Product interface cho user (không bao gồm gameAccount)
export interface Product {
  id: string;
  name: string;
  productCode: string;
  price: string;
  description: string;
  images: string[]; // URLs from backend server
  thumbnailImage?: string; // Ảnh đại diện
  specifications: AccountSpecification[];
  type: "available" | "preorder";
  status: "in_stock" | "out_of_stock" | "discontinued"; // Trạng thái sản phẩm
  server: "NA" | "JP" | "TW" | "KR" | "EN" | "Global"; // Server game
  createdAt: string;
  updatedAt: string;
  createdBy: string; // owner uid
}

// Product interface cho owner (bao gồm gameAccount)
export interface ProductWithCredentials extends Product {
  // Thông tin tài khoản game được mã hóa - CHỈ DÀNH CHO OWNER
  gameAccount?: {
    username: string; // Mã hóa AES-256
    password: string; // Mã hóa AES-256
    encryptionKeyId: string; // ID để xác định key đã dùng
  };
}

// Account specification interface
export interface AccountSpecification {
  label: string;
  value: string;
}

// Initialize Firebase app (reads config from environment variables)
const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// Firebase error messages in Vietnamese
const errorMessages: Record<string, string> = {
  "auth/email-already-in-use": "Email này đã được sử dụng",
  "auth/weak-password": "Mật khẩu quá yếu (ít nhất 6 ký tự)",
  "auth/invalid-email": "Email không hợp lệ",
  "auth/user-not-found": "Không tìm thấy tài khoản với email này",
  "auth/wrong-password": "Mật khẩu không đúng",
  "auth/too-many-requests": "Quá nhiều lần thử. Vui lòng thử lại sau",
  "auth/network-request-failed": "Lỗi kết nối mạng",
  "auth/popup-closed-by-user": "Đăng nhập Google bị hủy",
  "auth/cancelled-popup-request": "Đăng nhập Google bị hủy",
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const firebaseError = error as { code?: string };
    return errorMessages[firebaseError.code || ""] || error.message;
  }
  return String(error);
}

function ensureConfig() {
  const missing = Object.entries(firebaseConfig).filter(([, v]) => !v);
  if (missing.length) {
    console.warn(
      "Firebase config missing values for:",
      missing.map(([k]) => k)
    );
  }
}

ensureConfig();

if (!getApps().length) {
  initializeApp(firebaseConfig);
}

const auth = getAuth();
const db = getFirestore();

// Create or update user profile in Firestore
async function createUserProfile(
  user: User,
  additionalData: Partial<UserProfile> = {}
): Promise<void> {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const { displayName, email, photoURL } = user;
    const createdAt = new Date().toISOString();

    const userData: UserProfile = {
      uid: user.uid,
      email: email || "",
      username: additionalData.username || displayName || "",
      displayName: displayName || "",
      photoURL: photoURL || "",
      role:
        additionalData.role || (isOwnerEmail(email || "") ? "owner" : "user"), // Auto-assign role
      createdAt,
      updatedAt: createdAt,
      ...additionalData,
    };

    await setDoc(userRef, userData);
  } else {
    // Update existing user profile
    await updateDoc(userRef, {
      updatedAt: new Date().toISOString(),
      ...additionalData,
    });
  }
}

// Sign up with email and password - CHỈ TẠO TÀI KHOẢN, KHÔNG ĐĂNG NHẬP
export async function signUpWithEmail(
  email: string,
  password: string,
  username: string
): Promise<UserCredential> {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);

    // Update Firebase Auth profile
    await updateProfile(cred.user, {
      displayName: username,
    });

    // Create user profile in Firestore với trạng thái đã verify
    await createUserProfile(cred.user, {
      username,
      emailVerified: true, // Đánh dấu đã verify OTP
    });

    // KHÔNG đăng xuất - để user tiếp tục đăng nhập tự động
    return cred;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// Sign in with email and password - KIỂM TRA EMAIL VERIFICATION
export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  try {
    // Import authApi để kiểm tra verification
    const { authApi } = await import("./apiHelpers");

    // Kiểm tra email đã được verify OTP chưa
    console.log("Checking verification for email:", email);
    const verificationResult = await authApi.checkVerification(email);
    console.log("Verification result:", verificationResult);

    if (!verificationResult.success || !verificationResult.data?.verified) {
      throw new Error(
        "Email chưa được xác thực. Vui lòng xác thực OTP trước khi đăng nhập."
      );
    }

    // Nếu đã verify, cho phép đăng nhập
    const result = await signInWithEmailAndPassword(auth, email, password);

    // Cập nhật trạng thái verified trong user profile
    if (result.user) {
      const userRef = doc(db, "users", result.user.uid);
      await updateDoc(userRef, {
        emailVerified: true,
        lastLoginAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return result;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// Sign in with Google
export async function signInWithGoogle(): Promise<UserCredential> {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: "select_account",
    });

    const result = await signInWithPopup(auth, provider);

    // Create/update user profile in Firestore
    await createUserProfile(result.user);

    return result;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// Sign out user
export async function signOutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// Get user profile from Firestore
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

// Update user profile
export async function updateUserProfile(
  uid: string,
  data: Partial<UserProfile>
): Promise<void> {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// Auth state observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Check if user is owner by uid
export async function isOwner(uid: string): Promise<boolean> {
  try {
    // Get user role from database
    const userRole = await getUserRoleFromDB(uid);
    return userRole === "owner";
  } catch (error) {
    console.error("Error checking owner status:", error);
    return false;
  }
}

// Check if user is owner by user object (deprecated - use async isOwner instead)
export function isOwnerUser(user: User | null): boolean {
  return user ? isOwnerEmail(user.email || "") : false;
}

// Check if user is owner by user object (async version)
export async function isOwnerUserAsync(user: User | null): Promise<boolean> {
  if (!user) return false;
  return await isOwner(user.uid);
}

// Account Management Functions

// Add new account (owner only)
export async function addAccount(
  accountData: Omit<
    GameAccount,
    "id" | "createdAt" | "updatedAt" | "createdBy"
  >,
  ownerUid: string
): Promise<string> {
  try {
    // Check if user is owner
    if (!(await isOwner(ownerUid))) {
      throw new Error("Unauthorized: Only owners can add accounts");
    }

    const accountRef = doc(collection(db, "accounts"));
    const timestamp = new Date().toISOString();

    const newAccount: GameAccount = {
      ...accountData,
      id: accountRef.id,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: ownerUid,
    };

    await setDoc(accountRef, newAccount);
    return accountRef.id;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// Update account (owner only)
export async function updateAccount(
  accountId: string,
  updates: Partial<GameAccount>,
  ownerUid: string
): Promise<void> {
  try {
    // Check if user is owner
    if (!(await isOwner(ownerUid))) {
      throw new Error("Unauthorized: Only owners can update accounts");
    }

    const accountRef = doc(db, "accounts", accountId);
    await updateDoc(accountRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// Delete account (owner only)
export async function deleteAccount(
  accountId: string,
  ownerUid: string
): Promise<void> {
  try {
    // Check if user is owner
    if (!(await isOwner(ownerUid))) {
      throw new Error("Unauthorized: Only owners can delete accounts");
    }

    const accountRef = doc(db, "accounts", accountId);
    await deleteDoc(accountRef);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}

// Get all accounts
export async function getAllAccounts(): Promise<GameAccount[]> {
  try {
    const accountsRef = collection(db, "accounts");
    const snapshot = await getDocs(accountsRef);
    return snapshot.docs.map(
      (doc: QueryDocumentSnapshot) => doc.data() as GameAccount
    );
  } catch (error) {
    console.error("Error getting accounts:", error);
    return [];
  }
}

// Get account by ID
export async function getAccountById(
  accountId: string
): Promise<GameAccount | null> {
  try {
    const accountRef = doc(db, "accounts", accountId);
    const accountSnap = await getDoc(accountRef);

    if (accountSnap.exists()) {
      return accountSnap.data() as GameAccount;
    }
    return null;
  } catch (error) {
    console.error("Error getting account:", error);
    return null;
  }
}

export { auth, db };

// Get all products (VERSION CHO USER - KHÔNG CÓ GAME ACCOUNT)
export async function getAllProducts(): Promise<Product[]> {
  try {
    const productsRef = collection(db, "products");
    const snapshot = await getDocs(productsRef);
    return snapshot.docs.map((doc: QueryDocumentSnapshot) => {
      const data = doc.data() as ProductWithCredentials;
      // Loại bỏ gameAccount khi trả về cho user
      const { gameAccount, ...productWithoutCredentials } = data;
      return productWithoutCredentials as Product;
    });
  } catch (error) {
    console.error("Error getting products:", error);
    return [];
  }
}

// Get product by ID (VERSION CHO USER - KHÔNG CÓ GAME ACCOUNT)
export async function getProductById(
  productId: string
): Promise<Product | null> {
  try {
    const productRef = doc(db, "products", productId);
    const productSnap = await getDoc(productRef);

    if (productSnap.exists()) {
      const data = productSnap.data() as ProductWithCredentials;
      // Loại bỏ gameAccount khi trả về cho user
      const { gameAccount, ...productWithoutCredentials } = data;
      return productWithoutCredentials as Product;
    }
    return null;
  } catch (error) {
    console.error("Error getting product:", error);
    return null;
  }
}
