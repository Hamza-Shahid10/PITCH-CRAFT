import { Home, Lightbulb, Palette, LogOut, Zap } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function Navbar({ navigate }) {
  const { currentUser, logout } = useAuth();
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/create-pitch', label: 'Create Pitch', icon: Lightbulb },
    { path: '/extras', label: 'Extras', icon: Palette },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center cursor-pointer" onClick={() => navigate('/dashboard')}>
            <Zap className="h-6 w-6 text-purple-600 mr-2" /> PitchCraft
          </div>
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <>
                {navItems.map(item => (
                  <button key={item.path} onClick={() => navigate(item.path)} className="flex items-center text-gray-600 hover:text-purple-600">
                    <item.icon className="h-5 w-5 mr-1" /> {item.label}
                  </button>
                ))}
                <button onClick={logout} className="flex items-center text-red-500 hover:text-red-700">
                  <LogOut className="h-5 w-5 mr-1" /> Logout
                </button>
              </>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="text-gray-600 hover:text-purple-600">Login</button>
                <button onClick={() => navigate('/register')} className="text-purple-600 border border-purple-600 px-3 py-1 rounded-full hover:bg-purple-50">Register</button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
