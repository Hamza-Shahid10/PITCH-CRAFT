import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";

export const RegisterPage = () => {
    const { register, loading, error } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    // Add state for password confirmation
    const [confirmPassword, setConfirmPassword] = useState("");
    const [localError, setLocalError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError(""); // Clear previous local errors

        if (password !== confirmPassword) {
            setLocalError("Passwords do not match.");
            return;
        }

        try {
            await register(email, password);
            // Only navigate on successful registration
            navigate("/dashboard");
        } catch (err) {
            // The useAuth hook should handle setting the global error state
            console.error("Registration failed:", err);
        }
    };

    // Show loader if currently loading and there is no error preventing it
    if (loading && !error && !localError) return <Loader message="Registering..." />;

    const displayError = error || localError;

    return (
        // Responsive Container: min-h-screen for full height, centered content
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gray-100">
            {/* Form Container (The Card) */}
            <div className="max-w-md w-full bg-white p-8 sm:p-10 shadow-2xl rounded-xl">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-8 text-center">
                    Create an Account
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Email Input */}
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
                                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 focus:border-purple-600 text-base transition duration-150 ease-in-out"
                            />
                        </div>
                    </div>
                    
                    {/* Password Input */}
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
                                autoComplete="new-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 focus:border-purple-600 text-base transition duration-150 ease-in-out"
                            />
                        </div>
                    </div>

                    {/* Password Confirmation Input (NEW) */}
                    <div>
                        <label 
                            htmlFor="confirm-password" 
                            className="block text-sm font-medium text-gray-700"
                        >
                            Confirm Password
                        </label>
                        <div className="mt-1">
                            <input
                                id="confirm-password"
                                name="confirm-password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 focus:border-purple-600 text-base transition duration-150 ease-in-out"
                            />
                        </div>
                    </div>

                    {/* Error Display */}
                    {displayError && (
                        <p className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-200 text-center">
                            {displayError}
                        </p>
                    )}
                    
                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-md text-base font-semibold text-white bg-purple-700 hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
                    >
                        {loading ? <Loader /> : 'Register'}
                    </button>
                </form>

                {/* Login Link */}
                <p className="mt-8 text-center text-sm text-gray-600">
                    Already have an account?{' '}
                    <button 
                        onClick={() => navigate('/login')} 
                        className="font-semibold text-purple-700 hover:text-purple-600 transition"
                        type="button" 
                    >
                        Login
                    </button>
                </p>
            </div>
        </div>
    );
};