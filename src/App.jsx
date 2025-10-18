import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import { Navbar } from "./components/Navbar";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { CreatePitchPage } from "./pages/CreatePitchPage";
import { GeneratedPitchPage } from "./pages/GeneratedPitchPage";
import { ExportPage } from "./pages/ExportPage";
import { ExtrasPage } from "./pages/ExtrasPage";

const ProtectedRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  if (!currentUser) return <Navigate to="/login" />;
  return children;
};

function AppContent() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  return (
    <>
      <Navbar navigate={navigate} currentUser={currentUser} logout={logout} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />
        <Route path="/create-pitch" element={
          <ProtectedRoute><CreatePitchPage /></ProtectedRoute>
        } />
        <Route path="/generated/:pitchId" element={
          <ProtectedRoute><GeneratedPitchPage /></ProtectedRoute>
        } />
        <Route path="/export/:pitchId" element={
          <ProtectedRoute><ExportPage /></ProtectedRoute>
        } />
        <Route path="/extras" element={
          <ProtectedRoute><ExtrasPage /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </>
  );
}

export const App = () => (
  <AuthProvider>
    <Router>
      <AppContent />
    </Router>
  </AuthProvider>
);
