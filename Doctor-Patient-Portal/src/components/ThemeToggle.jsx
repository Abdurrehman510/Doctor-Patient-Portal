import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { SunIcon, MoonIcon } from '@heroicons/react/24/solid';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 relative group"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <MoonIcon className="w-6 h-6 text-gray-700 group-hover:text-gray-900 transition-colors" />
      ) : (
        <SunIcon className="w-6 h-6 text-yellow-400 group-hover:text-yellow-300 transition-colors" />
      )}
      <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-medium bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
        {theme === 'light' ? 'Dark mode' : 'Light mode'}
      </span>
    </button>
  );
};

export default ThemeToggle;