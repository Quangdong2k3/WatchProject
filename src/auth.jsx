import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { initializeApp } from '@firebase/app';
import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from '@firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const firebaseConfigured = Object.values(firebaseConfig).every(Boolean);
const firebaseApp = firebaseConfigured ? initializeApp(firebaseConfig) : null;
export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;

const AuthContext = createContext(null);

export function getAuthMessage(error) {
  const messages = {
    'auth/account-exists-with-different-credential': 'Email này đã được đăng ký bằng một phương thức khác. Hãy đăng nhập bằng phương thức ban đầu.',
    'auth/email-already-in-use': 'Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác.',
    'auth/invalid-credential': 'Email hoặc mật khẩu chưa chính xác.',
    'auth/invalid-email': 'Địa chỉ email không hợp lệ.',
    'auth/network-request-failed': 'Không thể kết nối dịch vụ xác thực. Kiểm tra mạng rồi thử lại.',
    'auth/operation-not-allowed': 'Phương thức này chưa được bật trong Firebase Authentication.',
    'auth/popup-blocked': 'Trình duyệt đã chặn cửa sổ đăng nhập. Cho phép popup rồi thử lại.',
    'auth/popup-closed-by-user': 'Cửa sổ đăng nhập đã được đóng trước khi hoàn tất.',
    'auth/unauthorized-domain': 'Tên miền hiện tại chưa được thêm vào danh sách Authorized domains của Firebase.',
    'auth/user-disabled': 'Tài khoản này hiện đã bị vô hiệu hóa.',
    'auth/user-not-found': 'Không tìm thấy tài khoản với email này.',
    'auth/weak-password': 'Mật khẩu cần có ít nhất 6 ký tự.',
    'auth/wrong-password': 'Email hoặc mật khẩu chưa chính xác.'
  };

  if (!firebaseConfigured) {
    return 'Đăng nhập chưa được bật. Hãy cấu hình Firebase theo hướng dẫn trong FIREBASE_AUTH.md.';
  }

  return messages[error?.code] || 'Không thể xác thực lúc này. Vui lòng thử lại sau.';
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(!firebaseConfigured);

  useEffect(() => {
    if (!firebaseAuth) return undefined;

    return onAuthStateChanged(firebaseAuth, (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);
    }, () => setAuthReady(true));
  }, []);

  const value = useMemo(() => ({
    user,
    authReady,
    configured: firebaseConfigured,
    signInEmail: async (email, password) => {
      if (!firebaseAuth) throw new Error('Firebase is not configured.');
      await setPersistence(firebaseAuth, browserLocalPersistence);
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      return credential.user;
    },
    registerEmail: async (email, password, displayName) => {
      if (!firebaseAuth) throw new Error('Firebase is not configured.');
      await setPersistence(firebaseAuth, browserLocalPersistence);
      const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      if (displayName.trim()) await updateProfile(credential.user, { displayName: displayName.trim() });
      return credential.user;
    },
    signInSocial: async (providerName) => {
      if (!firebaseAuth) throw new Error('Firebase is not configured.');
      await setPersistence(firebaseAuth, browserLocalPersistence);
      const provider = providerName === 'google' ? new GoogleAuthProvider() : new FacebookAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const credential = await signInWithPopup(firebaseAuth, provider);
      return credential.user;
    },
    signOut: async () => {
      if (firebaseAuth) await signOut(firebaseAuth);
    }
  }), [user, authReady]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider.');
  return context;
}
