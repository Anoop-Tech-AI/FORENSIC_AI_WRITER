import React from 'react';
import { motion } from 'motion/react';
import { Shield, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Hero() {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-16 px-4 overflow-hidden bg-[#0B1220]">
      {/* Cyber Grid & Scanning Lines */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: 'linear-gradient(to right, #1F2937 1px, transparent 1px), linear-gradient(to bottom, #1F2937 1px, transparent 1px)',
            backgroundSize: '4rem 4rem',
            maskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 20%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 50% 50%, #000 20%, transparent 100%)',
          }}
        />

        {/* Scanning Line */}
        <motion.div
          animate={{ y: ['-100%', '200%'] }}
          transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
          className="absolute left-0 right-0 h-1 opacity-30"
          style={{
            background: 'linear-gradient(to right, transparent, #22D3EE, transparent)',
            boxShadow: '0 0 20px #22D3EE',
          }}
        />

        {/* Glowing Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 3 + Math.random() * 2,
              delay: Math.random() * 2,
              ease: 'easeInOut',
            }}
            className="absolute rounded-full bg-[#22D3EE]"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 2}px`,
              height: `${Math.random() * 4 + 2}px`,
              boxShadow: '0 0 10px #22D3EE',
            }}
          />
        ))}

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#3B82F6] opacity-[0.1] rounded-full pointer-events-none" style={{ filter: 'blur(120px)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#22D3EE] opacity-[0.05] rounded-full pointer-events-none" style={{ filter: 'blur(100px)' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#22D3EE]/30 bg-[#22D3EE]/10 text-[#22D3EE] text-sm font-medium mb-8"
        >
          <Shield size={16} />
          <span>Professional Investigation Platform</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight"
          style={{ fontFamily: "'Space Grotesk', sans-serif" }}
        >
          Automated Digital Forensics <br />
          <span
            className="text-transparent bg-clip-text"
            style={{ backgroundImage: 'linear-gradient(to right, #22D3EE, #3B82F6)' }}
          >
            Reporting Tool
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-[#9CA3AF] text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed"
        >
          AI-assisted system that converts raw digital forensic data such as logs and metadata into structured investigation reports that can be used as legal evidence.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            onClick={() => navigate('/login')}
            className="group relative px-8 py-4 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-semibold rounded-lg overflow-hidden transition-all duration-300 flex items-center gap-2"
            style={{ boxShadow: '0 0 20px rgba(59,130,246,0.4)' }}
          >
            <span>Start Investigation</span>
            <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
          </button>

          <button
            onClick={() => document.getElementById('workflow')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-8 py-4 bg-[#111827]/80 hover:bg-[#1F2937] text-[#E5E7EB] border border-[#1F2937] hover:border-[#22D3EE]/50 font-semibold rounded-lg transition-all duration-300 backdrop-blur-md">
            View Workflow
          </button>
        </motion.div>
      </div>
    </section>
  );
}
