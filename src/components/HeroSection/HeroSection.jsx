import { useTheme } from '../ThemeContext';
import ScrollSidebar from '../ScrollSidebar/ScrollSidebar';
import HeroContent from '../HeroContent/HeroContent';
import GlassWidgets from '../GlassWidgets/GlassWidgets';
import ImpactBar from '../ImpactBar/ImpactBar';
import './HeroSection.css';

export default function HeroSection({ onNavigate }) {
  const { isDark } = useTheme();

  return (
    <main
      className={`hero-section ${isDark ? 'hero-dark' : ''}`}
      id="heroSection"
    >
      <ScrollSidebar />
      <HeroContent onNavigate={onNavigate} />
      <GlassWidgets />
      <ImpactBar />
    </main>
  );
}
