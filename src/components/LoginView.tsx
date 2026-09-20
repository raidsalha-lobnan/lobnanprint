import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Lock, Mail, KeyRound, ArrowRight, UserPlus, LogIn, AlertCircle, ShieldCheck, Check } from 'lucide-react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { DEFAULT_SYSTEM_USERS } from '../data/defaultCompanyBranchUserData';

export const LoginView: React.FC<{ onLocalLogin?: (id: string) => void }> = ({ onLocalLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('raid.salha@gmail.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const directAdminLogin = () => {
    const adminUser = DEFAULT_SYSTEM_USERS[0];
    const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    localStorage.setItem('active_session_id', sessionId);
    localStorage.setItem('alnoor_press_accounting_v1_current_user_id', adminUser.id);
    if (onLocalLogin) {
      onLocalLogin(adminUser.id);
    } else {
      window.location.reload();
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setErrorCode('');
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      if (res.user && res.user.email) {
        const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);
        localStorage.setItem('active_session_id', sessionId);
        try {
          await setDoc(doc(db, 'userSessions', res.user.email.toLowerCase()), { sessionId, timestamp: Date.now() });
        } catch(e) {}
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول بواسطة جوجل');
    } finally {
      setLoading(false);
    }
  };

  
  const handleLocalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Fetch local users or fallback to default system users
    const localData = localStorage.getItem('alnoor_press_accounting_v1_users');
    let users = DEFAULT_SYSTEM_USERS;
    try {
      if (localData) {
        users = JSON.parse(localData);
      }
    } catch(e) {
      users = DEFAULT_SYSTEM_USERS;
    }
    
    const user = users.find((u: any) => (u.email === email || u.username === email) && u.password === password);
    if (user) {
      const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);
      localStorage.setItem('active_session_id', sessionId);
      try {
        await setDoc(doc(db, 'userSessions', user.id), { sessionId, timestamp: Date.now() });
      } catch(e) { console.error("Firestore session error:", e); }
      
      localStorage.setItem('alnoor_press_accounting_v1_current_user_id', user.id);
      if (onLocalLogin) {
        onLocalLogin(user.id);
      } else {
        window.location.reload();
      }
    } else {
      setError('البريد الإلكتروني/اسم المستخدم أو كلمة المرور غير صحيحة');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setErrorCode('');
    setLoading(true);
    setResetSent(false);

    try {
      let userEmail = email.toLowerCase();
      if (isLogin) {
        const res = await signInWithEmailAndPassword(auth, email, password);
        if (res.user && res.user.email) userEmail = res.user.email.toLowerCase();
      } else {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        if (res.user && res.user.email) userEmail = res.user.email.toLowerCase();
      }
      
      const sessionId = Date.now().toString(36) + Math.random().toString(36).substring(2);
      localStorage.setItem('active_session_id', sessionId);
      try {
        await setDoc(doc(db, 'userSessions', userEmail), { sessionId, timestamp: Date.now() });
      } catch(e) {}
      
    } catch (err: any) {
      console.error(err);
      setErrorCode(err.code);
      if (err.code === 'auth/operation-not-allowed') {
         setError('تسجيل الدخول بالبريد غير مفعل في Firebase. يرجى تفعيله من لوحة التحكم.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
         setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else if (err.code === 'auth/email-already-in-use') {
         setError('البريد الإلكتروني مستخدم مسبقاً');
      } else if (err.code === 'auth/weak-password') {
         setError('كلمة المرور ضعيفة جداً');
      } else {
         setError(err.message || 'حدث خطأ أثناء المصادقة');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setError('الرجاء إدخال البريد الإلكتروني أولاً لإرسال رابط التعيين');
      return;
    }
    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError('');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء إرسال رابط إعادة التعيين');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans text-right" dir="rtl">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
        <div className="flex justify-center mb-6 text-blue-600">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">
          {isLogin ? 'تسجيل الدخول للنظام' : 'إنشاء حساب جديد'}
        </h2>
        <p className="text-center text-slate-500 mb-8 text-sm">
          نظام المحاسبة الشامل وإدارة الموارد
        </p>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-700 text-sm font-semibold rounded-lg flex flex-col items-start gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
            {errorCode === 'auth/operation-not-allowed' && (
              <a 
                href="https://console.firebase.google.com/project/rich-web-kq6d2/authentication/providers" 
                target="_blank" 
                rel="noreferrer"
                className="text-xs bg-rose-600 text-white px-3 py-1.5 rounded-lg hover:bg-rose-700 mt-1 inline-block"
              >
                اضغط هنا لفتح إعدادات Firebase وتفعيلها
              </a>
            )}
          </div>
        )}

        {resetSent && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-lg">
            تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني بنجاح.
          </div>
        )}

        
        
        {/* Instant Preview Login Button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={directAdminLogin}
            className="w-full py-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer border border-blue-400/30"
          >
            <ShieldCheck className="w-5 h-5 text-amber-300" />
            <span>دخول فوري كمدير النظام (أ. رائد صالحة)</span>
          </button>
          <p className="text-center text-[11px] text-slate-400 mt-1.5">
            للمعاينة المباشرة وتجربة كافة الشاشات والصلاحيات بنقرة واحدة
          </p>
        </div>

        <form onSubmit={handleLocalSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">اسم المستخدم / البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3 top-2.5 h-5 w-5 text-slate-400" />
              <input
                type="text"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left outline-none font-mono"
                placeholder="email@example.com"
                dir="ltr"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">كلمة المرور</label>
            <div className="relative">
              <KeyRound className="absolute right-3 top-2.5 h-5 w-5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-3 pr-10 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-left outline-none font-mono"
                placeholder="••••••••"
                dir="ltr"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <LogIn className="w-5 h-5" />
            <span>تسجيل الدخول للموظفين</span>
          </button>
          
          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-semibold">أو للمدير فقط</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full py-3 bg-white border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl transition-colors flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-lg">دخول المدير (Google)</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
