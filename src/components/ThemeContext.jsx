import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('foodbridge_theme');
      if (savedTheme !== null) {
        return savedTheme === 'dark';
      }
      // Always default to light mode on first visit
      return false;
    } catch {
      return false;
    }
  });

  const toggleTheme = useCallback(() => {
    setIsDark((prev) => {
      const nextTheme = !prev;
      try {
        localStorage.setItem('foodbridge_theme', nextTheme ? 'dark' : 'light');
      } catch (err) {
        console.warn('Could not save theme to localStorage:', err);
      }
      return nextTheme;
    });
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark-mode');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
      document.body.classList.remove('dark-mode');
    }
  }, [isDark]);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <div className={isDark ? 'app dark-mode' : 'app'}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
