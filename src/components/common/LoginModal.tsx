import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { X, LogIn, ShieldAlert, GraduationCap, Briefcase, Mail, User as UserIcon, Clock } from 'lucide-react';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../../services/firebase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  defaultRole?: UserRole;
}

// Strictly defined admin accounts for PT. JASA PRIMA PAPUA
const ADMIN_EMAILS = ['mpigome44@gmail.com'];

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  defaultRole = 'student',
}) => {
  const { t } = useLanguage();
  
  // Toggle between Sign In and Sign Up
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>(defaultRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [approvalMessage, setApprovalMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real Google SSO Authentication Handler
  const handleGoogleSSO = async () => {
    setLoading(true);
    setError(null);
    setApprovalMessage(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      if (!firebaseUser.email) {
        throw new Error('Google account does not have a verified email address.');
      }

      const cleanEmail = firebaseUser.email.toLowerCase().trim();

      // Determine Role
      let assignedRole: UserRole = 'student';
      let isApproved = true;
      let requestedRole: UserRole | undefined = undefined;

      if (ADMIN_EMAILS.includes(cleanEmail)) {
        assignedRole = 'admin';
      } else {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userDocRef);

        if (userSnap.exists()) {
          assignedRole = userSnap.data().role || 'student';
          isApproved = userSnap.data().isApproved !== false; // default true if not set
        } else {
          // NEW: If they want instructor role, mark as pending
          if (selectedRole === 'instructor') {
            assignedRole = 'student'; // Default to student until approved
            isApproved = false;
            requestedRole = 'instructor';
          } else {
            assignedRole = selectedRole;
          }
        }
      }

      const authenticatedUser: User = {
        id: firebaseUser.uid,
        name: firebaseUser.displayName || cleanEmail.split('@')[0],
        email: cleanEmail,
        role: assignedRole,
        avatarUrl: firebaseUser.photoURL || undefined,
        isApproved,
        requestedRole,
      };

      // Upsert User Document in Firestore
      await setDoc(
        doc(db, 'users', firebaseUser.uid),
        {
          uid: firebaseUser.uid,
          email: cleanEmail,
          displayName: authenticatedUser.name,
          photoURL: authenticatedUser.avatarUrl || '',
          role: assignedRole,
          isApproved,
          requestedRole: requestedRole || null,
          approvalRequestedAt: !isApproved ? new Date().toISOString() : null,
          lastLogin: new Date().toISOString(),
        },
        { merge: true }
      );

      // Show approval message if pending
      if (!isApproved && requestedRole === 'instructor') {
        setApprovalMessage(
          'Your instructor access request has been submitted for admin approval. You will receive an email once approved.'
        );
        // Still log them in, but as student
        setTimeout(() => {
          onLoginSuccess(authenticatedUser);
          onClose();
        }, 3000);
      } else {
        onLoginSuccess(authenticatedUser);
        onClose();
      }
    } catch (err: any) {
      console.error('Google SSO Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Login cancelled by user.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized in Firebase Console.');
      } else {
        setError(err.message || 'Failed to sign in with Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Standard Email / Password Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setApprovalMessage(null);

    try {
      let firebaseUser;

      if (isSignUp) {
        // Create new account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        firebaseUser = userCredential.user;
        
        // Update Firebase profile with name
        await updateProfile(firebaseUser, { displayName: name });
      } else {
        // Sign into existing account
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        firebaseUser = userCredential.user;
      }

      const cleanEmail = (firebaseUser.email || email).toLowerCase().trim();
      let assignedRole: UserRole = ADMIN_EMAILS.includes(cleanEmail) ? 'admin' : 'student';
      let isApproved = true;
      let requestedRole: UserRole | undefined = undefined;

      // NEW: If signing up as instructor, mark as pending
      if (isSignUp && selectedRole === 'instructor' && assignedRole !== 'admin') {
        assignedRole = 'student';
        isApproved = false;
        requestedRole = 'instructor';
      }

      const authenticatedUser: User = {
        id: firebaseUser.uid,
        name: isSignUp ? name : (firebaseUser.displayName || cleanEmail.split('@')[0]),
        email: cleanEmail,
        role: assignedRole,
        avatarUrl: firebaseUser.photoURL || undefined,
        isApproved,
        requestedRole,
      };

      // Upsert User Document in Firestore
      await setDoc(
        doc(db, 'users', firebaseUser.uid),
        {
          uid: firebaseUser.uid,
          email: cleanEmail,
          displayName: authenticatedUser.name,
          photoURL: authenticatedUser.avatarUrl || '',
          role: assignedRole,
          isApproved,
          requestedRole: requestedRole || null,
          approvalRequestedAt: !isApproved ? new Date().toISOString() : null,
          lastLogin: new Date().toISOString(),
        },
        { merge: true }
      );

      // Show approval message if pending
      if (!isApproved && requestedRole === 'instructor') {
        setApprovalMessage(
          'Your instructor access request has been submitted for admin approval. You will receive an email once approved.'
        );
        // Still log them in, but as student
        setTimeout(() => {
          onLoginSuccess(authenticatedUser);
          onClose();
        }, 3000);
      } else {
        onLoginSuccess(authenticatedUser);
        onClose();
      }
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email is already in use. Please sign in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password must be at least 6 characters long.');
      } else if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password.');
      } else {
        setError(err.message || 'Authentication failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#E2E8F0] border-b border-[#CBD5E1] flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <LogIn className="w-5 h-5 text-[#0EA5E9]" />
            <h2 className="text-sm font-extrabold text-[#0F172A]">
              {isSignUp ? 'Create an Account' : t('auth.title', 'Sign In to PT. JASA PRIMA PAPUA')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl">
              {error}
            </div>
          )}

          {approvalMessage && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold rounded-xl flex items-start space-x-2">
              <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{approvalMessage}</span>
            </div>
          )}

          {/* Role Intent Selection (Only show on Sign Up, or keep for contextual login) */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider">
              Portal Access Intent
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole('student')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition ${
                  selectedRole === 'student'
                    ? 'border-[#0EA5E9] bg-cyan-50 text-[#0EA5E9]'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Student</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('instructor')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition ${
                  selectedRole === 'instructor'
                    ? 'border-[#0EA5E9] bg-cyan-50 text-[#0EA5E9]'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Instructor</span>
              </button>
            </div>
            {isSignUp && selectedRole === 'instructor' && (
              <p className="text-[10px] text-slate-500 mt-2 italic">
                ℹ️ Instructor accounts require admin approval after registration.
              </p>
            )}
          </div>

          {/* Google SSO Button */}
          <button
            type="button"
            onClick={handleGoogleSSO}
            disabled={loading}
            className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-[#CBD5E1] rounded-xl font-bold text-xs text-slate-700 shadow-sm transition flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>{loading ? 'Opening Google...' : isSignUp ? 'Sign up with Google' : 'Continue with Google'}</span>
          </button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-[#CBD5E1] w-full" />
            <span className="bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest absolute">
              or continue with email
            </span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isSignUp && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Yohanes Pigome"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-[#CBD5E1] rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. name@jasaprimapapua.co.id"
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-[#CBD5E1] rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0EA5E9]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-slate-50 border border-[#CBD5E1] rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0EA5E9]"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-xl text-xs font-extrabold shadow-md transition flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}</span>
            </button>
          </form>

          {/* Toggle between Sign In / Sign Up */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setApprovalMessage(null);
              }}
              className="text-[11px] font-extrabold text-slate-500 hover:text-[#0EA5E9] transition cursor-pointer"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>

          {/* Security Banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-amber-900 font-medium leading-tight">
              Role-Based Access Control (RBAC) enforced. Instructor access requires admin approval. Super Admin access is restricted to verified email accounts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
