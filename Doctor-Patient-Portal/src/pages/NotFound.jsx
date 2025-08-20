import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center text-center p-4">
        <h1 className="text-6xl md:text-9xl font-extrabold text-blue-600 dark:text-blue-400">404</h1>
        <h2 className="mt-4 text-2xl md:text-4xl font-bold text-gray-800 dark:text-white">Page Not Found</h2>
        <p className="mt-4 max-w-md text-gray-600 dark:text-gray-400">
          Sorry, we couldn't find the page you're looking for. It might have been moved or deleted.
        </p>
        <Link 
          to="/" 
          className="mt-8 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105"
        >
          Go back home
        </Link>
      </main>
      <Footer />
    </div>
  );
};

export default NotFound;