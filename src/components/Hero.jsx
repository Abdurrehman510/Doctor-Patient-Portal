const Hero = () => {
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-r from-primary to-secondary dark:from-gray-800 dark:to-gray-600 text-white w-full">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">Welcome to Doctor-Patient Portal</h1>
        <p className="text-lg md:text-xl mb-8">Your modern telemedicine solution for seamless doctor-patient interactions.</p>
        <div className="space-x-4">
          <a href="/signup" className="inline-block px-6 py-3 bg-white text-primary font-semibold rounded-lg shadow-md hover:bg-gray-100">
            Get Started
          </a>
          <a href="/login" className="inline-block px-6 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-primary">
            Login
          </a>
        </div>
      </div>
    </section>
  );
};

export default Hero;