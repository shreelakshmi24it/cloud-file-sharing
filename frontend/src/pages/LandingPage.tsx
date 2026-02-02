import { Link } from 'react-router-dom';
import { Shield, Lock, Share2, Cloud, CheckCircle, Zap } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Cloud className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">SecureCloud</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-700 hover:text-blue-600 font-medium">
                Login
              </Link>
              <Link 
                to="/register" 
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Get Started
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Secure Cloud Storage
            <span className="block text-blue-600">with End-to-End Encryption</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Upload, share, and access your files from anywhere with military-grade encryption. 
            Your data, your control, absolute privacy.
          </p>
          <div className="flex justify-center space-x-4">
            <Link 
              to="/register" 
              className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition shadow-lg"
            >
              Start Free Trial
            </Link>
            <button className="border-2 border-blue-600 text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-50 transition">
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Why Choose SecureCloud?
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Lock className="h-12 w-12 text-blue-600" />}
            title="End-to-End Encryption"
            description="Files are encrypted on your device before upload. Only you have the decryption keys."
          />
          <FeatureCard 
            icon={<Shield className="h-12 w-12 text-blue-600" />}
            title="Zero-Knowledge Security"
            description="We can't access your files even if we wanted to. Your privacy is guaranteed."
          />
          <FeatureCard 
            icon={<Share2 className="h-12 w-12 text-blue-600" />}
            title="Secure Sharing"
            description="Share files securely with password protection and expiring links."
          />
          <FeatureCard 
            icon={<Zap className="h-12 w-12 text-blue-600" />}
            title="Fast & Reliable"
            description="Lightning-fast uploads and downloads with 99.9% uptime guarantee."
          />
          <FeatureCard 
            icon={<Cloud className="h-12 w-12 text-blue-600" />}
            title="Access Anywhere"
            description="Access your files from any device, anywhere in the world."
          />
          <FeatureCard 
            icon={<CheckCircle className="h-12 w-12 text-blue-600" />}
            title="Easy to Use"
            description="Intuitive interface that doesn't compromise on security."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Secure Your Files?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who trust SecureCloud with their data
          </p>
          <Link 
            to="/register" 
            className="bg-white text-blue-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition inline-block"
          >
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p>&copy; 2024 SecureCloud. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

export default LandingPage;