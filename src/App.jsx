import { useState, useEffect, lazy, Suspense } from 'react';
import { ThemeProvider } from './components/ThemeContext';
import { AuthProvider, useAuth, checkIsAdmin } from './context/AuthContext';
import Navbar from './components/Navbar/Navbar';
import HeroSection from './components/HeroSection/HeroSection';
import JourneySection from './components/JourneySection/JourneySection';
import WhoCanUseSection from './components/WhoCanUseSection/WhoCanUseSection';
import WhyFoodBridgeSection from './components/WhyFoodBridgeSection/WhyFoodBridgeSection';
import CtaSection from './components/CtaSection/CtaSection';
import Footer from './components/Footer/Footer';
import { PageTransition } from './components/AnimatedUI';

// Code-split / lazy-loaded pages for optimal bundle performance
const HowItWorks = lazy(() => import('./pages/HowItWorks/HowItWorks'));
const AboutUs = lazy(() => import('./pages/AboutUs/AboutUs'));
const Impact = lazy(() => import('./pages/Impact/Impact'));
const Contact = lazy(() => import('./pages/Contact/Contact'));
const Login = lazy(() => import('./pages/Login/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword/ForgotPassword'));
const DonorDashboard = lazy(() => import('./pages/DonorDashboard/DonorDashboard'));
const ReceiverDashboard = lazy(() => import('./pages/ReceiverDashboard/ReceiverDashboard'));
const FoodListings = lazy(() => import('./pages/FoodListings/FoodListings'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard/AdminDashboard'));
const PickupDrop = lazy(() => import('./pages/PickupDrop/PickupDrop'));

const PAGE_HASHES = {
  'how-it-works': '#how-it-works',
  'about-us': '#about-us',
  'impact': '#impact',
  'contact': '#contact',
  'login': '#login',
  'forgot-password': '#forgot-password',
  'reset-password': '#reset-password',
  'food-listings': '#food-listings',
  'find-food': '#food-listings',
  'donor-dashboard': '#donor-dashboard',
  'receiver-dashboard': '#receiver-dashboard',
  'admin-dashboard': '#admin-dashboard',
  'pickup-drop': '#pickup-drop',
  'delivery': '#pickup-drop',
  'dashboard': '#dashboard',
  'home': '',
};

function getPageFromHash() {
  const hash = (window.location.hash || '').toLowerCase().replace(/\/$/, '');

  // If hash contains OAuth tokens from Supabase redirect (Google login callback),
  // treat as dashboard-pending — Supabase client will parse the tokens automatically
  if (hash.includes('access_token=') || hash.includes('token_type=')) {
    return 'dashboard';
  }

  // If hash contains error or recovery tokens from Supabase email redirect
  if (
    hash.includes('error=access_denied') ||
    hash.includes('otp_expired') ||
    hash.includes('type=recovery') ||
    hash.includes('reset-password') ||
    hash.includes('forgot-password') ||
    hash.includes('forgotpassword') ||
    hash.includes('resetpassword')
  ) {
    return 'forgot-password';
  }

  if (hash === '#how-it-works' || hash === '#howitworks') return 'how-it-works';
  if (hash === '#about-us' || hash === '#about') return 'about-us';
  if (hash === '#impact') return 'impact';
  if (hash === '#contact' || hash === '#contact-us') return 'contact';
  if (hash === '#login' || hash === '#signup' || hash === '#join') return 'login';
  if (hash === '#food-listings' || hash === '#find-food' || hash === '#listings') return 'food-listings';
  if (hash === '#donor-dashboard') return 'donor-dashboard';
  if (hash === '#receiver-dashboard') return 'receiver-dashboard';
  if (hash === '#admin-dashboard' || hash === '#admin') return 'admin-dashboard';
  if (hash === '#pickup-drop' || hash === '#pickupdrop' || hash === '#delivery') return 'pickup-drop';
  if (hash === '#dashboard') return 'dashboard';
  return 'home';
}

function MainAppContent() {
  const [currentPage, setCurrentPage] = useState(getPageFromHash);
  const { user, role, profile, isAdmin, loading } = useAuth();

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

  // After OAuth callback: once Supabase has parsed the tokens and user is set,
  // clean the raw token hash and replace with a proper dashboard route
  useEffect(() => {
    const hash = window.location.hash || '';
    if (user && !loading && (hash.includes('access_token=') || hash.includes('token_type='))) {
      const isUserAdmin = isAdmin || role === 'admin' || checkIsAdmin(user, profile, role);
      const targetPage = isUserAdmin ? 'admin-dashboard' : role === 'receiver' ? 'receiver-dashboard' : 'donor-dashboard';
      window.location.hash = PAGE_HASHES[targetPage] || '#dashboard';
    }
  }, [user, loading, role, isAdmin, profile]);

  // Auto-redirect #dashboard to role-specific dashboard hash
  useEffect(() => {
    if (currentPage === 'dashboard' && user && !loading) {
      const isUserAdmin = isAdmin || role === 'admin' || checkIsAdmin(user, profile, role);
      const targetPage = isUserAdmin ? 'admin-dashboard' : role === 'receiver' ? 'receiver-dashboard' : 'donor-dashboard';
      const targetHash = PAGE_HASHES[targetPage];
      if (targetHash && window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }
    }
  }, [currentPage, user, loading, role, isAdmin, profile]);

  const renderPage = () => {
    const isAdminUser = isAdmin || role === 'admin' || checkIsAdmin(user, profile, role);

    switch (currentPage) {
      case 'how-it-works':
        return <HowItWorks onNavigate={handleNavigate} />;
      case 'about-us':
        return <AboutUs onNavigate={handleNavigate} />;
      case 'impact':
        return <Impact onNavigate={handleNavigate} />;
      case 'contact':
        return <Contact onNavigate={handleNavigate} />;
      case 'pickup-drop':
      case 'delivery':
        return <PickupDrop onNavigate={handleNavigate} />;
      case 'food-listings':
      case 'find-food':
        return <FoodListings onNavigate={handleNavigate} />;
      case 'login':
        return <Login onNavigate={handleNavigate} />;
      case 'forgot-password':
      case 'reset-password':
        return <ForgotPassword onNavigate={handleNavigate} />;

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

      case 'admin-dashboard':
        if (loading) {
          return <DashboardLoadingFallback />;
        }
        if (!user) {
          return <Login onNavigate={handleNavigate} />;
        }
        if (!isAdminUser) {
          // Non-admin users: redirect to their appropriate dashboard
          return role === 'receiver'
            ? <ReceiverDashboard onNavigate={handleNavigate} />
            : <DonorDashboard onNavigate={handleNavigate} />;
        }
        return <AdminDashboard onNavigate={handleNavigate} />;

      case 'dashboard':
        if (loading) {
          return <DashboardLoadingFallback />;
        }
        if (!user) {
          return <Login onNavigate={handleNavigate} />;
        }
        if (isAdminUser) {
          return <AdminDashboard onNavigate={handleNavigate} />;
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
      <Suspense fallback={<DashboardLoadingFallback />}>
        {renderPage()}
      </Suspense>
    </PageTransition>
  );
}

function DashboardLoadingFallback() {
  return (
    <div className="fb-loading-overlay">
      <div className="fb-spinner fb-spinner-lg" />
      <span className="fb-loading-text">Loading FoodBridge Dashboard...</span>
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
