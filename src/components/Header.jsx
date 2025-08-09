import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const Header = () => {
  const { theme } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);

  return (
    <header className={`fixed w-full max-w-full top-0 z-50 shadow-md ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
      <nav className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">Doctor-Patient Portal</Link>
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-gray-600 dark:text-gray-300">Hello, {user.name}</span>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="hover:text-secondary">Login</Link>
              <Link to="/signup" className="hover:text-secondary">Signup</Link>
            </>
          )}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
};

export default Header;