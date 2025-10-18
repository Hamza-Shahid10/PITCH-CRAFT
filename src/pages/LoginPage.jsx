import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";

export const LoginPage = () => {
    const { login, loading, error } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            // Only navigate on successful login
            navigate("/dashboard");
        } catch (err) {
            // The useAuth hook should handle setting the error state,
            // so no need to explicitly handle it here unless specific
            // local state manipulation is required.
            console.error("Login failed:", err);
        }
    };

    if (loading && !error) return <Loader message="Logging in..." />;

    return (
        // **Responsive Enhancements:**
        // - min-h-screen for full height on all viewports.
        // - flex, items-center, justify-center to center content vertically and horizontally.
        // - p-4/p-6 for padding on small/medium screens.
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gray-100">
            {/* **Form Container:**
            // - max-w-md to limit width on large screens.
            // - w-full to ensure it takes full width on small screens.
            // - bg-white, shadow-xl, and rounded-xl for a modern card look.
            // - p-8/p-10 for internal padding. */}
            <div className="max-w-md w-full bg-white p-8 sm:p-10 shadow-2xl rounded-xl">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">
                    Login to PitchCraft
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label 
                            htmlFor="email" 
                            className="block text-sm font-medium text-gray-700"
                        >
                            Email address
                        </label>
                        <div className="mt-1">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                // Focus ring purple 600 for better contrast
                                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 focus:border-purple-600 text-base transition duration-150 ease-in-out"
                            />
                        </div>
                    </div>
                    <div>
                        <label 
                            htmlFor="password" 
                            className="block text-sm font-medium text-gray-700"
                        >
                            Password
                        </label>
                        <div className="mt-1">
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 focus:border-purple-600 text-base transition duration-150 ease-in-out"
                            />
                        </div>
                    </div>
                    {/* **Error Display:** Enhanced visibility */}
                    {error && (
                        <p className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 text-center">
                            {error}
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-semibold text-white bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
                    >
                        {/* Only show Loader component if loading and there is no error */}
                        {loading && !error ? <Loader /> : 'Sign In'}
                    </button>
                </form>

                {/* **Registration Link:** */}
                <p className="mt-8 text-center text-sm text-gray-600">
                    Don't have an account?{' '}
                    <button 
                        onClick={() => navigate('/register')} 
                        className="font-semibold text-purple-700 hover:text-purple-600 transition"
                        type="button" // Important for buttons outside a form
                    >
                        Register
                    </button>
                </p>
            </div>
        </div>
    );
};