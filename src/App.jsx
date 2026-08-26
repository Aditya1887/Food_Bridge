import { useState, useEffect } from 'react';
import { ThemeProvider } from './components/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar/Navbar';
import HeroSection from './components/HeroSection/HeroSection';
import JourneySection from './components/JourneySection/JourneySection';
import WhoCanUseSection from './components/WhoCanUseSection/WhoCanUseSection';
import WhyFoodBridgeSection from './components/WhyFoodBridgeSection/WhyFoodBridgeSection';
import CtaSection from './components/CtaSection/CtaSection';
import Footer from './components/Footer/Footer';
import HowItWorks from './pages/HowItWorks/HowItWorks';
import AboutUs from './pages/AboutUs/AboutUs';
import Impact from './pages/Impact/Impact';
import Contact from './pages/Contact/Contact';
import Login from './pages/Login/Login';
import DonorDashboard from './pages/DonorDashboard/DonorDashboard';
import ReceiverDashboard from './pages/ReceiverDashboard/ReceiverDashboard';
import FoodListings from './pages/FoodListings/FoodListings';
import { PageTransition } from './components/AnimatedUI';

const PAGE_HASHES = {
  'how-it-works': '#how-it-works',
  'about-us': '#about-us',
  'impact': '#impact',
  'contact': '#contact',
  'login': '#login',
  'food-listings': '#food-listings',
  'find-food': '#food-listings',
  'donor-dashboard': '#donor-dashboard',
  'receiver-dashboard': '#receiver-dashboard',
  'dashboard': '#dashboard',
  'home': '',
};

function getPageFromHash() {
  const hash = (window.location.hash || '').toLowerCase().replace(/\/$/, '');
  if (hash === '#how-it-works' || hash === '#howitworks') return 'how-it-works';
  if (hash === '#about-us' || hash === '#about') return 'about-us';
  if (hash === '#impact') return 'impact';
  if (hash === '#contact' || hash === '#contact-us') return 'contact';
  if (hash === '#login' || hash === '#signup' || hash === '#join') return 'login';
  if (hash === '#food-listings' || hash === '#find-food' || hash === '#listings') return 'food-listings';
  if (hash === '#donor-dashboard') return 'donor-dashboard';
  if (hash === '#receiver-dashboard') return 'receiver-dashboard';
  if (hash === '#dashboard') return 'dashboard';
  return 'home';
}

function MainAppContent() {
  const [currentPage, setCurrentPage] = useState(getPageFromHash);
  const { user, role, loading } = useAuth();

  const handleNavigate = (page) => {
    setCurrentPage(page);
    window.location.hash = PAGE_HASHES[page] !== undefined ? PAGE_HASHES[page] : `#${page}`;
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const onHashChange = () => {
      const page = getPageFromHash();
      setCurrentPage(page);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'how-it-works':
        return <HowItWorks onNavigate={handleNavigate} />;
      case 'about-us':
        return <AboutUs onNavigate={handleNavigate} />;
      case 'impact':
        return <Impact onNavigate={handleNavigate} />;
      case 'contact':
        return <Contact onNavigate={handleNavigate} />;
      case 'food-listings':
      case 'find-food':
        return <FoodListings onNavigate={handleNavigate} />;
      case 'login':
        return <Login onNavigate={handleNavigate} />;

      case 'donor-dashboard':
        if (loading) {
          return <DashboardLoadingFallback />;
        }
        if (!user) {
          return <Login onNavigate={handleNavigate} />;
        }
        return <DonorDashboard onNavigate={handleNavigate} />;

      case 'receiver-dashboard':
        if (loading) {
          return <DashboardLoadingFallback />;
        }
        if (!user) {
          return <Login onNavigate={handleNavigate} />;
        }
        return <ReceiverDashboard onNavigate={handleNavigate} />;

      case 'dashboard':
        if (loading) {
          return <DashboardLoadingFallback />;
        }
        if (!user) {
          return <Login onNavigate={handleNavigate} />;
        }
        if (role === 'receiver') {
          return <ReceiverDashboard onNavigate={handleNavigate} />;
        }
        return <DonorDashboard onNavigate={handleNavigate} />;

      default:
        return (
          <>
            <Navbar onNavigate={handleNavigate} />
            <HeroSection onNavigate={handleNavigate} />
            <JourneySection onNavigate={handleNavigate} />
            <WhoCanUseSection onNavigate={handleNavigate} />
            <WhyFoodBridgeSection onNavigate={handleNavigate} />
            <CtaSection onNavigate={handleNavigate} />
            <Footer onNavigate={handleNavigate} />
          </>
        );
    }
  };

  return (
    <PageTransition pageKey={currentPage} mode="fade">
      {renderPage()}
    </PageTransition>
  );
}

function DashboardLoadingFallback() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f7faf7',
      color: '#15803d',
      fontFamily: 'sans-serif',
      gap: '16px'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid #bbf7d0',
        borderTopColor: '#16a34a',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <span style={{ fontSize: '14px', fontWeight: '600' }}>Loading FoodBridge Dashboard...</span>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainAppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
