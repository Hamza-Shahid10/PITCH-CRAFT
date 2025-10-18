import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";
import { collection, query, where, onSnapshot, deleteDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import { PitchCard } from "../components/PitchCard";
import { Lightbulb, Zap } from "lucide-react";

export const DashboardPage = () => {
  const { userId, loading } = useAuth();
  const [pitches, setPitches] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    const q = query(collection(db, "pitches"), where("userId", "==", userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPitches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [userId]);

  const deletePitch = async (id) => {
    if (confirm("Are you sure you want to delete this pitch?")) {
      await deleteDoc(doc(db, "pitches", id));
    }
  };

  if (loading) return <Loader message="Loading your pitches..." />;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pitches.map(pitch => (
            <PitchCard key={pitch.id} pitch={pitch} navigate={navigate} deletePitch={deletePitch} />
          ))}
        </div>
      )}
    </div>
  );
};
