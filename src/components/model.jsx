import React, { useState, useEffect, useContext, createContext, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, setLogLevel } from 'firebase/firestore';
import { Home, Lightbulb, Zap, User, LogOut, Loader2, Save, Send, Edit, RefreshCw, Download, Layers, Palette, Users, ChevronLeft } from 'lucide-react';

// External Library Imports
// We use a shim for jsPDF since direct npm imports are not available.
// In a real environment, you would import { jsPDF } from 'jspdf'.
const jsPDF = typeof window !== 'undefined' && window.jspdf ? window.jspdf.jsPDF : null;

// --- 1. FIREBASE CONFIGURATION & GLOBALS ---

// Global variables provided by the Canvas environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'pitchcraft-default';
// const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
const firebaseConfig = {
  apiKey: "AIzaSyA8BOukqMk2PQeRPKWGxCU-sOnmmGIO1as",
  authDomain: "smitchaman.firebaseapp.com",
  projectId: "smitchaman",
  storageBucket: "smitchaman.firebasestorage.app",
  messagingSenderId: "268285812047",
  appId: "1:268285812047:web:af5f6fb10227a93ed2793a",
  measurementId: "G-6DMQD8TCWF"
};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialize Firebase (will be done inside AuthProvider)
let app, auth, db;
if (firebaseConfig) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    setLogLevel('Debug');
  } catch (e) {
    console.error("Firebase initialization failed:", e);
  }
}

// Helper to construct the private user path
const getPitchCollectionRef = (userId) => {
  if (!db || !userId) return null;
  // Firestore Path: /artifacts/{appId}/users/{userId}/pitches
  return collection(db, `artifacts/${appId}/users/${userId}/pitches`);
};

// --- 2. AUTH CONTEXT & PROVIDER ---

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      setError("Firebase not configured.");
      return;
    }

    const signIn = async () => {
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Initial sign-in failed:", e);
        setError("Could not sign in initially.");
      }
    };

    signIn();

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setUserId(user ? user.uid : crypto.randomUUID());
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setError(null);
    } catch (e) {
      console.error("Login failed:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password) => {
    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setError(null);
    } catch (e) {
      console.error("Registration failed:", e);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (e) {
      console.error("Logout failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const value = { currentUser, userId, loading, error, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => useContext(AuthContext);

// --- 3. COMMON COMPONENTS ---

const Loader = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center p-8 bg-white/90 rounded-xl shadow-lg">
    <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
    <p className="mt-4 text-gray-700 font-medium">{message}</p>
  </div>
);

const Card = ({ children, className = '' }) => (
  <div className={`bg-white p-6 rounded-2xl shadow-xl border border-gray-100 ${className}`}>
    {children}
  </div>
);

const Navbar = ({ navigate, logout, currentUser }) => {
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home, requiresAuth: true },
    { path: '/create-pitch', label: 'Create Pitch', icon: Lightbulb, requiresAuth: true },
    { path: '/extras', label: 'Extras', icon: Palette, requiresAuth: true },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate('/dashboard')}>
            <Zap className="h-6 w-6 text-purple-600 mr-2" />
            <span className="text-2xl font-extrabold text-gray-800">PitchCraft</span>
          </div>
          <div className="flex items-center space-x-4">
            {currentUser && (
              <>
                {navItems.filter(item => item.requiresAuth).map(item => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="flex items-center text-sm font-medium text-gray-600 hover:text-purple-600 transition duration-150"
                  >
                    <item.icon className="h-5 w-5 mr-1" />
                    {item.label}
                  </button>
                ))}
                <div className="h-6 w-px bg-gray-200" />
                <button
                  onClick={logout}
                  className="flex items-center text-sm font-medium text-red-500 hover:text-red-700 transition duration-150"
                >
                  <LogOut className="h-5 w-5 mr-1" />
                  Logout
                </button>
              </>
            )}
            {!currentUser && (
              <>
                <button onClick={() => navigate('/login')} className="text-sm font-medium text-gray-600 hover:text-purple-600">Login</button>
                <button onClick={() => navigate('/register')} className="text-sm font-medium text-purple-600 border border-purple-600 px-3 py-1 rounded-full hover:bg-purple-50 transition duration-150">Register</button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

// --- 4. PAGES & CORE LOGIC ---

const LoginPage = ({ navigate }) => {
  const { login, loading, error, currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    login(email, password);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Login to PitchCraft</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <button onClick={() => navigate('/register')} className="font-medium text-purple-600 hover:text-purple-500">
            Register
          </button>
        </p>
      </Card>
    </div>
  );
};

const RegisterPage = ({ navigate }) => {
  const { register, loading, error, currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    register(email, password);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Create Your PitchCraft Account</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password (min 6 chars)</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Register'}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="font-medium text-purple-600 hover:text-purple-500">
            Login
          </button>
        </p>
      </Card>
    </div>
  );
};

const PitchCard = ({ pitch, navigate, deletePitch }) => {
  return (
    <Card className="flex flex-col justify-between h-full hover:shadow-xl transition duration-300">
      <div>
        <h3 className="text-xl font-semibold text-gray-900 line-clamp-2 mb-2">{pitch.title}</h3>
        <p className="text-sm text-purple-600 font-medium mb-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pitch.tone === 'Formal' ? 'bg-indigo-100 text-indigo-800' : pitch.tone === 'Fun' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
            {pitch.tone}
          </span>
        </p>
        <p className="text-gray-500 text-sm line-clamp-3 mb-4">{pitch.content}</p>
      </div>
      <div className="flex space-x-2 mt-4">
        <button
          onClick={() => navigate(`/export/${pitch.id}`)}
          className="flex-1 flex items-center justify-center p-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          <Download className="w-4 h-4 mr-1" /> PDF
        </button>
        <button
          onClick={() => navigate(`/create-pitch?editId=${pitch.id}`)}
          className="flex-1 flex items-center justify-center p-2 border border-purple-600 bg-purple-600 rounded-lg text-sm font-medium text-white hover:bg-purple-700 transition"
        >
          <Edit className="w-4 h-4 mr-1" /> Edit
        </button>
        <button
          onClick={() => deletePitch(pitch.id)}
          className="p-2 border border-red-500 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition"
          aria-label="Delete"
        >
          <LogOut className="w-4 h-4 transform rotate-180" />
        </button>
      </div>
    </Card>
  );
};

const DashboardPage = ({ navigate, setGeneratedPitch, pitches, deletePitch, loadingPitches }) => {
  const { userId } = useAuth();

  const handleEdit = (pitch) => {
    setGeneratedPitch(pitch);
    navigate('/generated');
  };

  if (!userId || loadingPitches) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-64px)]">
        <Loader message="Fetching your pitches..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-2">Welcome Back, User {userId.substring(0, 8)}...</h1>
      <p className="text-gray-500 mb-8">Your unique collection of groundbreaking startup pitches.</p>

      {pitches.length === 0 ? (
        <div className="text-center p-16 bg-white rounded-2xl shadow-lg border border-dashed border-gray-300">
          <Lightbulb className="w-12 h-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800">No pitches saved yet</h3>
          <p className="mt-2 text-gray-500">Time to generate your first pitch!</p>
          <button
            onClick={() => navigate('/create-pitch')}
            className="mt-6 inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-purple-600 hover:bg-purple-700 transition"
          >
            <Zap className="w-5 h-5 mr-2" /> Start Generating
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pitches.map(pitch => (
            <PitchCard key={pitch.id} pitch={pitch} navigate={navigate} deletePitch={deletePitch} />
          ))}
        </div>
      )}
    </div>
  );
};


const CreatePitchPage = ({ navigate, setGeneratedPitch, currentPitch, setCurrentPitch }) => {
  const [title, setTitle] = useState(currentPitch?.title || '');
  const [description, setDescription] = useState(currentPitch?.description || '');
  const [audience, setAudience] = useState(currentPitch?.audience || '');
  const [tone, setTone] = useState(currentPitch?.tone || 'Persuasive');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generatePitch = async (pitchTitle, pitchDescription, pitchTone, pitchAudience) => {
    if (!pitchTitle || !pitchDescription || !pitchAudience) {
        setError("All fields (Title, Description, Audience) must be filled.");
        return;
    }
    setLoading(true);
    setError(null);

    const systemPrompt = `You are PitchCraft, an AI startup pitch expert. Your task is to generate a powerful, concise, and compelling startup pitch.`;
    const userQuery = `Generate a ${pitchTone} startup pitch for '${pitchTitle}'. 
        Here is the description of the product/service: '${pitchDescription}'. 
        The primary target audience is: '${pitchAudience}'. 
        The pitch must be structured to be catchy, clear, and highly persuasive.`;
    
    const apiKey = "AIzaSyDYQpQGu9st8njNOZCfFoBzL_l4XLiVuXM";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ parts: [{ text: userQuery }] }],
        systemInstruction: { parts: [{ text: systemPrompt }] },
    };

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;

        if (generatedText) {
            const newPitch = {
                id: crypto.randomUUID(), // Temp ID
                title: pitchTitle,
                description: pitchDescription,
                audience: pitchAudience,
                tone: pitchTone,
                content: generatedText,
                timestamp: Date.now(),
                isNew: true,
                originalId: currentPitch?.id, // Keep track of original ID for update
            };
            setGeneratedPitch(newPitch);
            setCurrentPitch(null); // Clear form state from edit mode
            navigate('/generated');
        } else {
            setError("Failed to generate pitch. Please try again.");
        }
    } catch (e) {
        console.error("API call failed:", e);
        setError("Network error or API failure. Check console for details.");
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    generatePitch(title, description, tone, audience);
  };
  
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8">
        {currentPitch ? 'Edit Pitch Details' : 'Generate a New Pitch'}
      </h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-1">Startup/Product Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-inner focus:ring-purple-500 focus:border-purple-500 text-lg"
              placeholder="e.g., PitchCraft"
            />
          </div>
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-1">Description (What problem do you solve? How?)</label>
            <textarea
              required
              rows="4"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-inner focus:ring-purple-500 focus:border-purple-500 text-lg"
              placeholder="e.g., We use AI to instantly generate customized, data-driven pitch decks, saving entrepreneurs hours of writing."
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-1">Target Audience</label>
              <input
                type="text"
                required
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-inner focus:ring-purple-500 focus:border-purple-500 text-lg"
                placeholder="e.g., Venture Capitalists, Angel Investors"
              />
            </div>
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-1">Tone</label>
              <select
                required
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-inner focus:ring-purple-500 focus:border-purple-500 text-lg"
              >
                <option value="Persuasive">Persuasive (Default)</option>
                <option value="Formal">Formal & Professional</option>
                <option value="Fun">Fun & Casual</option>
                <option value="Inspiring">Inspiring & Visionary</option>
              </select>
            </div>
          </div>
          {error && <p className="text-sm text-red-500 text-center mt-4">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center py-3 px-6 border border-transparent rounded-xl shadow-lg text-lg font-semibold text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 transition"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Send className="w-6 h-6 mr-2" />}
            {currentPitch ? 'Regenerate Pitch' : 'Generate Pitch'}
          </button>
        </form>
      </Card>
    </div>
  );
};

const GeneratedPitchPage = ({ navigate, generatedPitch, setGeneratedPitch, savePitch, loadingSave }) => {
  const [pitchContent, setPitchContent] = useState(generatedPitch?.content || '');
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!generatedPitch) {
      navigate('/create-pitch');
    } else {
      setPitchContent(generatedPitch.content);
      setSaveSuccess(false); // Reset success message on new pitch load
      if (generatedPitch.originalId) {
        // If we are regenerating from an existing pitch, start in edit mode
        setIsEditing(true);
      }
    }
  }, [generatedPitch, navigate]);

  const handleSave = async () => {
    const pitchToSave = {
      ...generatedPitch,
      content: pitchContent,
      timestamp: Date.now(),
    };
    // The savePitch function handles the update/add logic based on originalId
    await savePitch(pitchToSave);
    setSaveSuccess(true);
    // Remove the temp flags after successful save
    setGeneratedPitch(prev => ({ ...prev, isNew: false, originalId: undefined }));
    setTimeout(() => navigate('/dashboard'), 1500); // Redirect to dashboard after save
  };

  const handleRegenerate = () => {
    // Navigate back to the creation page with the current data pre-filled
    navigate('/create-pitch');
  };

  if (!generatedPitch) return null;

  return (
    <div className="max-w-4xl mx-auto p-8">
      <button onClick={() => navigate('/create-pitch')} className="flex items-center text-purple-600 hover:text-purple-700 mb-6">
        <ChevronLeft className="w-5 h-5 mr-1" /> Back to Creator
      </button>

      <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
        {generatedPitch.title} Pitch Draft
      </h1>
      <p className="text-gray-500 mb-6">Tone: {generatedPitch.tone} | Audience: {generatedPitch.audience}</p>

      <Card className="mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800 flex items-center">
            <Layers className="w-6 h-6 mr-2 text-purple-600" /> Generated Pitch Content
        </h2>
        {isEditing ? (
          <textarea
            value={pitchContent}
            onChange={(e) => setPitchContent(e.target.value)}
            rows="10"
            className="w-full p-4 border border-gray-300 rounded-xl shadow-inner focus:ring-purple-500 focus:border-purple-500 text-lg"
          />
        ) : (
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-lg p-4 bg-gray-50 rounded-lg">
            {pitchContent}
          </div>
        )}
      </Card>

      <div className="flex justify-end space-x-4">
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`flex items-center px-4 py-2 border rounded-full text-sm font-medium transition ${isEditing ? 'bg-red-50 text-red-600 border-red-300 hover:bg-red-100' : 'bg-yellow-50 text-yellow-600 border-yellow-300 hover:bg-yellow-100'}`}
        >
          <Edit className="w-5 h-5 mr-2" /> {isEditing ? 'Exit Edit Mode' : 'Edit Content'}
        </button>

        <button
          onClick={handleRegenerate}
          className="flex items-center px-4 py-2 border border-gray-300 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
          disabled={loadingSave}
        >
          <RefreshCw className="w-5 h-5 mr-2" /> Regenerate
        </button>

        <button
          onClick={handleSave}
          className="flex items-center px-6 py-2 border border-transparent rounded-full text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition"
          disabled={loadingSave}
        >
          {loadingSave ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
          {generatedPitch.originalId ? 'Update Pitch' : 'Save Pitch'}
        </button>
      </div>
      {saveSuccess && (
        <p className="mt-4 text-center text-green-600 font-medium">Pitch saved successfully!</p>
      )}
    </div>
  );
};


const ExportPage = ({ navigate, pitches }) => {
    const { userId } = useAuth();
    const currentPath = window.location.pathname;
    const pitchId = currentPath.split('/export/')[1];
    const pitch = pitches.find(p => p.id === pitchId);
    const [status, setStatus] = useState('ready'); // ready, generating, error

    const handleDownloadPdf = useCallback(() => {
        if (!pitch || !jsPDF) {
            setStatus('error');
            console.error("Pitch data missing or jsPDF not available.");
            return;
        }

        setStatus('generating');

        try {
            // A4 size in points (595x842)
            const doc = new jsPDF({
                unit: 'pt',
                format: 'a4'
            });

            const margin = 50;
            let currentY = margin;
            const maxWidth = doc.internal.pageSize.getWidth() - 2 * margin;

            // Title
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text(pitch.title, margin, currentY);
            currentY += 30;

            // Metadata
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(100, 100, 100);
            doc.text(`Tone: ${pitch.tone} | Audience: ${pitch.audience} | Saved: ${new Date(pitch.timestamp).toLocaleDateString()}`, margin, currentY);
            currentY += 25;

            // Separator
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, currentY, doc.internal.pageSize.getWidth() - margin, currentY);
            currentY += 20;
            
            // Pitch Content
            doc.setFontSize(14);
            doc.setTextColor(0, 0, 0);
            doc.setFont('helvetica', 'normal');

            // Split the text to fit within the page width
            const splitText = doc.splitTextToSize(pitch.content, maxWidth);
            
            splitText.forEach(line => {
                if (currentY > doc.internal.pageSize.getHeight() - margin) {
                    doc.addPage();
                    currentY = margin;
                }
                doc.text(line, margin, currentY);
                currentY += 20; // Line height
            });

            // Footer
            if (currentY > doc.internal.pageSize.getHeight() - margin) {
                doc.addPage();
                currentY = margin;
            }
            currentY = doc.internal.pageSize.getHeight() - margin;
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Generated by PitchCraft (User ID: ${userId.substring(0, 8)}...)`, margin, currentY, { align: 'left' });

            doc.save(`${pitch.title.replace(/\s/g, '_')}_Pitch.pdf`);
            setStatus('ready');

        } catch (e) {
            console.error("PDF generation failed:", e);
            setStatus('error');
        }
    }, [pitch, userId]);

    useEffect(() => {
        // Load jsPDF dynamically if not already available
        if (!jsPDF && typeof window !== 'undefined' && !document.getElementById('jspdf-script')) {
            const script = document.createElement('script');
            script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
            script.id = 'jspdf-script';
            script.onload = () => {
                window.jspdf = window.jspdf.default || window.jspdf;
                console.log("jsPDF loaded.");
            };
            document.head.appendChild(script);
        }
    }, []);

    if (!pitch) {
        return (
            <div className="max-w-4xl mx-auto p-8 text-center">
                <p className="text-xl text-red-500">Pitch not found or ID is invalid.</p>
                <button onClick={() => navigate('/dashboard')} className="mt-4 text-purple-600 hover:underline">Go to Dashboard</button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-8">
            <button onClick={() => navigate('/dashboard')} className="flex items-center text-purple-600 hover:text-purple-700 mb-6">
                <ChevronLeft className="w-5 h-5 mr-1" /> Back to Dashboard
            </button>
            <Card>
                <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center">
                    <Download className="w-7 h-7 mr-3 text-purple-600" /> Export Pitch: {pitch.title}
                </h1>
                <p className="text-gray-600 mb-6">Preview and download your pitch as a professional PDF document, ready for presentation.</p>

                <div className="p-6 bg-gray-50 border border-gray-200 rounded-xl mb-6">
                    <h3 className="text-xl font-semibold mb-2">Pitch Details</h3>
                    <p className="text-sm text-gray-700">Tone: <span className="font-medium">{pitch.tone}</span></p>
                    <p className="text-sm text-gray-700">Audience: <span className="font-medium">{pitch.audience}</span></p>
                    <p className="text-sm text-gray-700 mt-4 whitespace-pre-wrap">{pitch.content.substring(0, 200)}...</p>
                </div>

                <button
                    onClick={handleDownloadPdf}
                    disabled={status !== 'ready' || !jsPDF}
                    className="w-full flex items-center justify-center py-3 px-6 border border-transparent rounded-xl shadow-lg text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
                >
                    {status === 'generating' ? (
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                    ) : (
                        <Download className="w-6 h-6 mr-2" />
                    )}
                    {status === 'generating' ? 'Generating PDF...' : jsPDF ? 'Download as PDF' : 'Loading PDF Library...'}
                </button>

                {status === 'error' && <p className="mt-4 text-center text-red-500">Error generating PDF. Check console.</p>}
                {!jsPDF && <p className="mt-4 text-center text-yellow-600">Please wait while the PDF library loads.</p>}
            </Card>
        </div>
    );
};

const ColorLogoGeneratorPage = () => {
    // This page is an optional feature and will be mocked as a wireframe.
    return (
        <div className="max-w-4xl mx-auto p-8">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-8 flex items-center">
                <Palette className="w-9 h-9 mr-3 text-purple-600" /> Idea Branding & Extras
            </h1>
            <Card className="p-8">
                <div className="text-center">
                    <p className="text-xl font-semibold text-gray-800 mb-4">Color Palette & Logo Generator (Feature Coming Soon)</p>
                    <p className="text-gray-600 mb-8">
                        This feature would use an image generation model (`imagen-3.0-generate-002`)
                        to create unique branding assets based on your pitch idea.
                    </p>
                    <div className="flex justify-center space-x-4">
                        <div className="w-24 h-24 bg-red-400 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-2xl">L1</div>
                        <div className="w-24 h-24 bg-blue-400 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-2xl">L2</div>
                        <div className="w-24 h-24 bg-green-400 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-2xl">L3</div>
                    </div>
                    <div className="mt-8 p-4 bg-gray-200 rounded-xl text-gray-800">
                        **Mock Input:** Generate 3 logo concepts and a vibrant color palette for "PitchCraft" targeting investors.
                    </div>
                </div>
            </Card>
        </div>
    );
};


// --- 5. MAIN APP COMPONENT & ROUTING ---

const AppContent = () => {
  const { currentUser, userId, loading: authLoading, logout, error: authError } = useAuth();
  const [route, setRoute] = useState(currentUser ? '/dashboard' : '/login');
  const [pitches, setPitches] = useState([]);
  const [loadingPitches, setLoadingPitches] = useState(true);
  const [generatedPitch, setGeneratedPitch] = useState(null);
  const [loadingSave, setLoadingSave] = useState(false);
  const [currentPitch, setCurrentPitch] = useState(null); // Used for editing existing pitch form

  // Custom Navigation function
  const navigate = useCallback((newRoute) => {
    // Check for pitch edit state and pre-populate form
    if (newRoute.startsWith('/create-pitch?editId=')) {
      const id = newRoute.split('=')[1];
      const pitchToEdit = pitches.find(p => p.id === id);
      if (pitchToEdit) {
        setCurrentPitch(pitchToEdit);
      }
      setRoute('/create-pitch');
    } else {
      setRoute(newRoute);
      setCurrentPitch(null); // Clear edit state on non-edit navigation
    }
    window.scrollTo(0, 0);
  }, [pitches]);

  // Firestore Data Listener (Pitches)
  useEffect(() => {
    if (!userId || !db || authLoading) {
      setPitches([]);
      setLoadingPitches(false);
      return;
    }

    const pitchesRef = getPitchCollectionRef(userId);
    if (!pitchesRef) {
      setLoadingPitches(false);
      return;
    }

    setLoadingPitches(true);
    // Real-time listener for pitches
    const unsubscribe = onSnapshot(pitchesRef, (snapshot) => {
      const fetchedPitches = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)); // Sort by newest first
      setPitches(fetchedPitches);
      setLoadingPitches(false);
    }, (error) => {
      console.error("Firestore snapshot error:", error);
      setLoadingPitches(false);
    });

    return () => unsubscribe();
  }, [userId, authLoading]);

  // Redirect Logic
  useEffect(() => {
    if (!authLoading) {
      if (currentUser && (route === '/login' || route === '/register')) {
        setRoute('/dashboard');
      } else if (!currentUser && route !== '/login' && route !== '/register') {
        setRoute('/login');
      }
    }
  }, [currentUser, authLoading, route]);


  // Firestore Save/Update Pitch
  const savePitch = async (pitch) => {
    if (!userId || !db) return;
    setLoadingSave(true);
    const pitchesRef = getPitchCollectionRef(userId);

    const pitchData = {
        title: pitch.title,
        description: pitch.description,
        audience: pitch.audience,
        tone: pitch.tone,
        content: pitch.content,
        timestamp: pitch.timestamp,
        userId: userId,
    };

    try {
        if (pitch.originalId) {
            // Update existing pitch
            await updateDoc(doc(pitchesRef, pitch.originalId), pitchData);
        } else {
            // Add new pitch
            await addDoc(pitchesRef, pitchData);
        }
    } catch (e) {
        console.error("Error saving pitch:", e);
    } finally {
        setLoadingSave(false);
    }
  };

  // Firestore Delete Pitch
  const deletePitch = async (id) => {
    if (!userId || !db || !window.confirm("Are you sure you want to delete this pitch?")) return;

    try {
        const pitchesRef = getPitchCollectionRef(userId);
        await deleteDoc(doc(pitchesRef, id));
    } catch (e) {
        console.error("Error deleting pitch:", e);
    }
  };


  if (authLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader message="Authenticating user..." />
      </div>
    );
  }

  // --- Router Switch ---
  let PageContent;
  const pageProps = { navigate };

  switch (route) {
    case '/login':
      PageContent = <LoginPage {...pageProps} />;
      break;
    case '/register':
      PageContent = <RegisterPage {...pageProps} />;
      break;
    case '/dashboard':
      PageContent = <DashboardPage {...pageProps} pitches={pitches} deletePitch={deletePitch} loadingPitches={loadingPitches} setGeneratedPitch={setGeneratedPitch} />;
      break;
    case '/create-pitch':
      PageContent = <CreatePitchPage {...pageProps} setGeneratedPitch={setGeneratedPitch} currentPitch={currentPitch} setCurrentPitch={setCurrentPitch} />;
      break;
    case '/generated':
      PageContent = <GeneratedPitchPage {...pageProps} generatedPitch={generatedPitch} setGeneratedPitch={setGeneratedPitch} savePitch={savePitch} loadingSave={loadingSave} />;
      break;
    case '/extras':
        PageContent = <ColorLogoGeneratorPage {...pageProps} />;
        break;
    default:
        // Handle dynamic routes like /export/:id
        if (route.startsWith('/export/')) {
            PageContent = <ExportPage {...pageProps} pitches={pitches} />;
        } else {
            PageContent = (
                <div className="max-w-7xl mx-auto p-8 text-center min-h-[calc(100vh-64px)] flex flex-col justify-center items-center">
                    <h1 className="text-4xl font-extrabold text-red-600">404 - Page Not Found</h1>
                    <p className="mt-4 text-lg text-gray-700">The path <code>{route}</code> does not exist.</p>
                    <button onClick={() => navigate('/dashboard')} className="mt-8 text-purple-600 hover:underline">Go to Dashboard</button>
                </div>
            );
        }
        break;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar navigate={navigate} logout={logout} currentUser={currentUser} />
      <main className="pb-12">
        {PageContent}
      </main>
      <div className="fixed bottom-0 right-0 p-2 text-xs text-gray-400 bg-white/50 rounded-tl-lg shadow-inner">
        UID: {userId ? userId : 'N/A'}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <script src="https://cdn.tailwindcss.com"></script>
      <AppContent />
    </AuthProvider>
  );
}