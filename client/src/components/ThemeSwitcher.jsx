import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeSwitcher = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all border border-white/5 group"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
            {theme === 'dark' ? (
                <Sun size={18} className="text-gray-400 group-hover:text-yellow-400 transition-colors" />
            ) : (
                <Moon size={18} className="text-gray-400 group-hover:text-blue-400 transition-colors" />
            )}
        </button>
    );
};

export default ThemeSwitcher;
