import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Landing/Navbar';
import HeroSection from '../components/Landing/HeroSection';
import FeaturesSection from '../components/Landing/FeaturesSection';
import DashboardPreview from '../components/Landing/DashboardPreview';
import WhyChooseUs from '../components/Landing/WhyChooseUs';
import PricingSection from '../components/Landing/PricingSection';
import CTASection from '../components/Landing/CTASection';
import Footer from '../components/Landing/Footer';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect authenticated users straight to their dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate('/school-admin', { replace: true });
    }
  }, [user, loading, navigate]);

  // Smooth scroll behaviour
  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth';
  }, []);

  // Don't flash the landing page while auth state is resolving
  if (loading) return null;

  return (
    <div style={{ minHeight:'100vh', background:'#050508', overflowX:'hidden' }}>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <DashboardPreview />
        <WhyChooseUs />
        <PricingSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
