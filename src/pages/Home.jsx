import Header from '../components/Header';
import Hero from '../components/Hero';
import FeatureCard from '../components/FeatureCard';
import Footer from '../components/Footer';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const Home = () => {
  const location = useLocation();
  const features = [
    {
      title: 'Appointment Scheduling',
      description: 'Intuitive calendar interface for easy booking and management of appointments.',
      icon: '📅',
    },
    {
      title: 'AI-Powered Insights',
      description: 'Smart health summaries and predictive analytics from patient interactions.',
      icon: '🧠',
    },
  ];

  useEffect(() => {
    if (location.hash === '#features') {
      const element = document.getElementById('features');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 w-full overflow-x-hidden">
      <Header />
      <main>
        <Hero />
        <section id="features" className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold dark:text-white mb-4">
              Transform Your <span className="text-blue-600 dark:text-blue-400">Healthcare</span> Experience
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Our platform combines cutting-edge technology with intuitive design to revolutionize patient care.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <FeatureCard 
                key={index} 
                title={feature.title}
                description={feature.description}
                icon={feature.icon}
                delay={index * 100}
              />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Home;