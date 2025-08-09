import Header from '../components/Header';
import Hero from '../components/Hero';
import FeatureCard from '../components/FeatureCard';
import Footer from '../components/Footer';

const Home = () => {
  const features = [
    {
      title: 'Secure Chat',
      description: 'Real-time, encrypted communication between doctors and patients.',
      icon: '💬',
    },
    {
      title: 'Appointment Scheduling',
      description: 'Easily book and manage appointments with a built-in calendar.',
      icon: '📅',
    },
    {
      title: 'AI-Powered Insights',
      description: 'Smart health summaries generated from your conversations.',
      icon: '🧠',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 w-full overflow-x-hidden">
      <Header />
      <main className="pt-16">
        <Hero />
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-center mb-8 dark:text-white">Our Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <FeatureCard key={index} {...feature} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Home;