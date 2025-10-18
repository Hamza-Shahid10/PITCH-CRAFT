import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, RefreshCcw, ArrowLeft, CheckCircle } from "lucide-react";
import { db } from "../firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const GeneratedPitchPage = () => {
  const { pitchId } = useParams();
  const navigate = useNavigate();
  const [pitch, setPitch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [generating, setGenerating] = useState(false);
  const hasGenerated = useRef(false); // prevent auto-regeneration loop

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  const auth = getAuth();

  // 🔹 Step 1: Fetch pitch data from Firestore
  const fetchPitchData = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, "pitches", pitchId);
      const snap = await getDoc(docRef);

      if (!snap.exists()) {
        setError("Pitch not found or invalid ID.");
        setLoading(false);
        return;
      }

      setPitch({ id: snap.id, ...snap.data() });
    } catch (err) {
      console.error(err);
      setError("Error loading pitch data.");
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Step 2: Generate pitch content with Gemini + update Firestore
  const generatePitch = async (data) => {
    if (!apiKey) {
      setError("Missing Gemini API key.");
      return;
    }

    try {
      setGenerating(true);
      setError("");
      setSaved(false);

      const prompt = `
Generate a startup pitch for an app called "${data.title}".
Tone: ${data.tone}
Audience: ${data.audience}
Description: ${data.description}
Format response like:
Title:
Tone:
Audience:
Pitch Content:
`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
          }),
        }
      );

      const json = await res.json();
      console.log("Gemini API Response:", json);

      const text =
        json?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "No content generated.";

      const titleMatch = text.match(/Title:\s*(.*)/i);
      const toneMatch = text.match(/Tone:\s*(.*)/i);
      const audienceMatch = text.match(/Audience:\s*(.*)/i);
      const contentMatch = text.match(/Pitch Content:\s*([\s\S]*)/i);

      const generated = {
        title: titleMatch?.[1]?.trim() || data.title,
        tone: toneMatch?.[1]?.trim() || data.tone,
        audience: audienceMatch?.[1]?.trim() || data.audience,
        content:
          contentMatch?.[1]?.trim() ||
          text.replace(/\n{2,}/g, "\n").trim(),
        updatedAt: new Date().toISOString(),
      };

      // 🔥 Update Firestore
      const docRef = doc(db, "pitches", pitchId);
      await updateDoc(docRef, generated);

      setPitch((prev) => ({ ...prev, ...generated }));
      setSaved(true);
    } catch (err) {
      console.error(err);
      setError("Failed to generate pitch. Check console for details.");
    } finally {
      setGenerating(false);
    }
  };

  // 🔹 Step 3: Load pitch once
  useEffect(() => {
    fetchPitchData();
  }, [pitchId]);

  // 🔹 Step 4: Generate only once after fetching data
  useEffect(() => {
    if (pitch && !hasGenerated.current) {
      hasGenerated.current = true; // mark as done
      generatePitch(pitch);
    }
  }, [pitch]);

  // Loading UI
  if (loading || generating)
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        {loading ? "Loading pitch..." : "Generating your pitch idea..."}
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen flex flex-col justify-center items-center text-red-500">
        {error}
      </div>
    );

  // Render the generated pitch
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => navigate("/create")}
          className="text-purple-600 hover:text-purple-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-3xl font-bold text-gray-800">Generated Pitch</h1>
      </header>

      <div className="bg-white p-6 rounded-xl shadow-md max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">{pitch.title}</h2>
        <p className="text-gray-600 mb-4">
          Tone: <span className="font-medium">{pitch.tone}</span> | Audience:{" "}
          <span className="font-medium">{pitch.audience}</span>
        </p>
        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
          {pitch.content || "No content yet..."}
        </p>

        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => generatePitch(pitch)}
            disabled={generating}
            className="flex items-center bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            {generating ? "Regenerating..." : "Regenerate Pitch"}
          </button>

          {saved && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="w-5 h-5 mr-1" />
              <span className="font-medium">Saved to Firebase</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
