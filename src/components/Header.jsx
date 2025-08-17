import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const Header = () => {
  const { theme } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);

  return (
    <header className={`sticky top-0 z-50 shadow-sm backdrop-blur-md transition-colors duration-300 ${theme === 'dark' ? 'bg-gray-900/95 text-gray-100 border-b border-gray-700' : 'bg-white/95 text-gray-900 border-b border-gray-200'}`}>
      <nav className="max-w-7xl mx-auto px-6 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-teal-500 bg-clip-text text-transparent">
            HealthPlus
          </span>
        </Link>
        
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
                  {user.name.charAt(0)}
                </div>
                <span className="text-sm font-medium">Hi, {user.name.split(' ')[0]}</span>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                className="hidden md:block px-4 py-2 text-sm font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Sign in
              </Link>
              <Link 
                to="/signup" 
                className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 text-white shadow-md hover:shadow-lg transition-all"
              >
                Get started
              </Link>
            </>
          )}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
};

export default Header;