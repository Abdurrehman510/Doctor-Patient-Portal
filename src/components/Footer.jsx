import React from 'react';
const Footer = () => {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 py-6">
      <div className="container mx-auto px-4 text-center">
        <p className="text-gray-600 dark:text-gray-300">&copy; 2025 Doctor-Patient Portal. All rights reserved.</p>
        <div className="mt-4 space-x-4">
          <a href="/about" className="hover:text-secondary">About</a>
          <a href="/contact" className="hover:text-secondary">Contact</a>
          <a href="/privacy" className="hover:text-secondary">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;