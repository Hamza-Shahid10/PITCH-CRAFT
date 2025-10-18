import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebase/config";
import { collection, addDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { useNavigate, useSearchParams } from "react-router-dom";
import Loader from "../components/Loader"; // Your existing Loader
// Assuming you have a Card component and icons (like lucide-react or similar)
// For demonstration, I'll use placeholders for the icons.
const Card = ({ children }) => <div className="bg-white p-8 rounded-2xl shadow-xl">{children}</div>;
const Loader2 = ({ className }) => <div className={className}>...</div>; // Placeholder
const Send = ({ className }) => <div className={className}></div>; // Placeholder


export const CreatePitchPage = () => {
  const { userId, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("editId");

  // State variables for the enhanced form inputs
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState(""); // NEW
  const [audience, setAudience] = useState(""); // NEW
  const [tone, setTone] = useState("Persuasive"); // Changed default tone
  const [loading, setLoading] = useState(false); // Local loading state for form submission
  const [error, setError] = useState(null); // Local error state
  const currentPitch = editId; // Alias for clarity in JSX

  // --- Data Fetching for Edit Mode ---
  useEffect(() => {
    if (!editId || authLoading) return; // Wait for userId to be ready

    const fetchPitch = async () => {
      setLoading(true);
      setError(null);
      try {
        const docRef = doc(db, "pitches", editId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          // Map existing fields and populate new fields (assuming they might not exist)
          setTitle(data.title || "");
          setDescription(data.description || data.content || ""); // Use description, fallback to content
          setAudience(data.audience || "");
          setTone(data.tone || "Persuasive");
        } else {
          setError("Pitch not found.");
        }
      } catch (e) {
        setError("Failed to load pitch data.");
        console.error("Error fetching document:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchPitch();
  }, [editId, authLoading]);

  // --- Form Submission Handler ---
  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError(null);

  const pitchData = {
    title,
    description,
    audience,
    tone,
    userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    if (editId) {
      await updateDoc(doc(db, "pitches", editId), pitchData);
      navigate(`/generated/${editId}`); // navigate to generator for that pitch
    } else {
      const docRef = await addDoc(collection(db, "pitches"), pitchData);
      navigate(`/generated/${docRef.id}`); // 👈 pass new pitchId
    }
  } catch (e) {
    setError("Failed to save pitch. Please try again.");
    console.error("Error submitting pitch:", e);
  } finally {
    setLoading(false);
  }
};


  // Show global or local loader
  if (authLoading || loading) return <Loader message={editId ? "Loading pitch..." : "Processing..."} />;

  return (
    // Responsive Container with better padding
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-4 sm:p-8">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center sm:text-left">
          {currentPitch ? 'Edit Pitch Details' : 'Generate a New Pitch'} 🚀
        </h1>
        
        {/* Card component for visual separation */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Title Input */}
            <div>
              <label htmlFor="title" className="block text-lg font-medium text-gray-700 mb-1">Startup/Product Title</label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-inner focus:ring-purple-600 focus:border-purple-600 text-lg transition duration-150"
                placeholder="e.g., PitchCraft"
              />
            </div>

            {/* Description/Content Textarea */}
            <div>
              <label htmlFor="description" className="block text-lg font-medium text-gray-700 mb-1">Description (What problem do you solve? How?)</label>
              <textarea
                id="description"
                required
                rows="5" // Increased rows for more input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-inner focus:ring-purple-600 focus:border-purple-600 text-lg transition duration-150 resize-none"
                placeholder="e.g., We use AI to instantly generate customized, data-driven pitch decks, saving entrepreneurs hours of writing."
              />
            </div>

            {/* Audience & Tone (Responsive Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Target Audience Input */}
              <div>
                <label htmlFor="audience" className="block text-lg font-medium text-gray-700 mb-1">Target Audience</label>
                <input
                  id="audience"
                  type="text"
                  required
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-inner focus:ring-purple-600 focus:border-purple-600 text-lg transition duration-150"
                  placeholder="e.g., Venture Capitalists, Angel Investors"
                />
              </div>

              {/* Tone Select */}
              <div>
                <label htmlFor="tone" className="block text-lg font-medium text-gray-700 mb-1">Tone</label>
                <select
                  id="tone"
                  required
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="mt-1 block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-inner focus:ring-purple-600 focus:border-purple-600 text-lg appearance-none bg-white transition duration-150"
                >
                  <option value="Persuasive">Persuasive (Default)</option>
                  <option value="Formal">Formal & Professional</option>
                  <option value="Fun">Fun & Casual</option>
                  <option value="Inspiring">Inspiring & Visionary</option>
                </select>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <p className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 text-center">
                {error}
              </p>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || authLoading}
              className="w-full flex items-center justify-center py-3 px-6 border border-transparent rounded-xl shadow-lg text-lg font-semibold text-white bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150"
            >
              {/* Use local loading state for button spinner */}
              {loading ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <Send className="w-6 h-6 mr-2" />}
              {currentPitch ? 'Update Pitch' : 'Generate Pitch'}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
};