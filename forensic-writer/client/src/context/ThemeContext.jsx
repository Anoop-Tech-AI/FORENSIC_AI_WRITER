import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

// Theme application function
const applyTheme = (theme) => {
  const root = document.documentElement;

  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  localStorage.setItem('forensic-theme', theme);
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('forensic-theme');
        return savedTheme || 'dark'; // Default to dark theme
    });

    useEffect(() => {
        // Apply theme on mount and when theme changes
        applyTheme(theme);
    }, [theme]);

    const setThemeState = (newTheme) => {
        if (['light', 'dark'].includes(newTheme)) {
            setTheme(newTheme);
        }
    };

    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };

    // Get theme-specific classes for conditional styling
    const getThemeClasses = (lightClass, darkClass) => {
        return {
            [lightClass]: theme === 'light',
            [darkClass]: theme === 'dark'
        };
    };

    return (
        <ThemeContext.Provider value={{ 
            theme, 
            setTheme: setThemeState, 
            toggleTheme, 
            getThemeClasses 
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
