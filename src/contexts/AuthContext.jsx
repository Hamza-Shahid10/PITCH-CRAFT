import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../firebase/config';
import { 
    createUserWithEmailAndPassword, signInWithEmailAndPassword,
    signOut, onAuthStateChanged, signInAnonymously, signInWithCustomToken 
} from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

  useEffect(() => {
    const signIn = async () => {
      try {
        if (initialAuthToken) await signInWithCustomToken(auth, initialAuthToken);
        else await signInAnonymously(auth);
      } catch (e) { setError(e.message); }
    };
    signIn();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setUserId(user ? user.uid : crypto.randomUUID());
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try { await signInWithEmailAndPassword(auth, email, password); setError(null); } 
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const register = async (email, password) => {
    setLoading(true);
    try { await createUserWithEmailAndPassword(auth, email, password); setError(null); } 
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const logout = async () => { setLoading(true); try { await signOut(auth); } finally { setLoading(false); } };

  return (
    <AuthContext.Provider value={{ currentUser, userId, login, register, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
