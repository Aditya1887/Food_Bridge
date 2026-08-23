import { useState, useEffect } from 'react';
import { ThemeProvider } from './components/ThemeContext';
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
import { PageTransition } from './components/AnimatedUI';

const PAGE_HASHES = {
  'how-it-works': '#how-it-works',
  'about-us': '#about-us',
  'impact': '#impact',
  'contact': '#contact',
  'login': '#login',
  'home': '',
};

function getPageFromHash() {
  const hash = (window.location.hash || '').toLowerCase().replace(/\/$/, '');
  if (hash === '#how-it-works' || hash === '#howitworks') return 'how-it-works';
  if (hash === '#about-us' || hash === '#about') return 'about-us';
  if (hash === '#impact') return 'impact';
  if (hash === '#contact' || hash === '#contact-us') return 'contact';
  if (hash === '#login' || hash === '#signup' || hash === '#join') return 'login';
  return 'home';
}

export default function App() {
  const [currentPage, setCurrentPage] = useState(getPageFromHash);

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
      case 'login':
        return <Login onNavigate={handleNavigate} />;
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
    <ThemeProvider>
      <PageTransition pageKey={currentPage} mode="fade">
        {renderPage()}
      </PageTransition>
    </ThemeProvider>
  );
}
