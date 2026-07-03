import React, { useState, useEffect } from 'react';
import { Shield, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-[#0B1220]/90 backdrop-blur-md border-b border-[#1F2937] py-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)]' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          <div className="flex items-center gap-2">
            <Shield size={28} className="text-[#3B82F6] animate-pulse" />
            <span className="text-[#E5E7EB] text-xl font-bold tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              AutoForensics<span className="text-[#3B82F6]">.AI</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#9CA3AF]">
            <a href="#features" className="hover:text-[#E5E7EB] transition-colors">Features</a>
            <a href="#roles" className="hover:text-[#E5E7EB] transition-colors">Access</a>
            <a href="#workflow" className="hover:text-[#E5E7EB] transition-colors">Workflow</a>
            <a href="#architecture" className="hover:text-[#E5E7EB] transition-colors">Architecture</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="text-[#E5E7EB] text-sm font-medium hover:text-[#3B82F6] transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => navigate('/signup')}
              className="px-5 py-2.5 bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 text-[#3B82F6] text-sm font-semibold rounded-lg border border-[#3B82F6]/30 transition-all shadow-[0_0_15px_rgba(59,130,246,0.15)] hover:shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            >
              Sign Up
            </button>
          </div>

          <button
            className="md:hidden text-[#E5E7EB]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#111827] border-b border-[#1F2937]"
          >
            <div className="flex flex-col px-4 pt-2 pb-6 space-y-4 text-sm font-medium text-[#9CA3AF]">
              <a href="#features" className="hover:text-[#E5E7EB]">Features</a>
              <a href="#roles" className="hover:text-[#E5E7EB]">Access</a>
              <a href="#workflow" className="hover:text-[#E5E7EB]">Workflow</a>
              <a href="#architecture" className="hover:text-[#E5E7EB]">Architecture</a>
              <hr className="border-[#1F2937]" />
              <button className="text-left hover:text-[#E5E7EB]" onClick={() => navigate('/login')}>Login</button>
              <button
                onClick={() => navigate('/signup')}
                className="px-5 py-2.5 bg-[#3B82F6]/10 text-[#3B82F6] rounded-lg border border-[#3B82F6]/30 text-center"
              >
                Sign Up
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
