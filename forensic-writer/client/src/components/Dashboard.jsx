import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Shield, FileCode, Clock, FileWarning, Hash, Zap, Database, Scale, User, ChevronRight } from 'lucide-react';

const ParticleBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', resize);
    resize();

    const particles = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#00f2ff';
      ctx.strokeStyle = '#00f2ff';
      ctx.lineWidth = 0.2;

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Connect particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            ctx.globalAlpha = 1 - dist / 100;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
        ctx.globalAlpha = 1;
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="particle-canvas" />;
};

const Navbar = () => (
  <nav className="fixed top-0 w-full z-50 glass-nav">
    <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-cyan-bright/10 border border-cyan-bright/30 rounded flex items-center justify-center">
          <Shield className="w-5 h-5 text-cyan-bright" />
        </div>
        <span className="text-xl font-bold tracking-tight text-white font-orbitron">
          AutoForensics<span className="text-cyan-bright">.AI</span>
        </span>
      </div>
      <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
        {['Features', 'Access', 'Workflow', 'Architecture'].map((item) => (
          <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-cyan-bright transition-colors">{item}</a>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <button className="text-sm font-medium text-white hover:text-cyan-bright transition-colors">Sign In</button>
        <button className="px-5 py-2 bg-white/5 border border-white/10 rounded-full text-sm font-semibold hover:bg-white/10 transition-all">
          Request Demo
        </button>
      </div>
    </div>
  </nav>
);

const Dashboard = () => {
  return (
    <div className="dashboard-reveal">
      <ParticleBackground />
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-bright/5 border border-cyan-bright/20 mb-8"
          >
            <div className="w-2 h-2 rounded-full bg-cyan-bright animate-pulse" />
            <span className="text-xs font-bold text-cyan-bright uppercase tracking-widest">Professional Investigation Platform</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
          >
            Automated Digital Forensics <br />
            <span className="cyan-glow-text text-cyan-bright">Reporting Tool</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            AI-assisted system that converts raw digital forensic data such as logs and metadata 
            into structured investigation reports that can be used as legal evidence.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <button className="px-8 py-4 rounded-xl btn-cyan flex items-center gap-2 group">
              Start Investigation
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all">
              View Workflow
            </button>
          </motion.div>
        </div>
      </section>

      {/* The Challenge Section */}
      <section id="features" className="py-24 px-6 bg-navy-dark/30 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-cyan-bright font-bold tracking-widest uppercase text-xs">The Challenge</span>
            <h2 className="text-4xl font-bold text-white mt-4">Why Investigations Fail</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: FileCode, title: "Raw Forensic Data is Complex", desc: "Investigators are overwhelmed by massive log files, obscure hex dumps, and unstructured metadata." },
              { icon: Clock, title: "Manual Analysis Takes Time", desc: "Hours are wasted manually cross-referencing events, calculating hashes, and building timelines." },
              { icon: FileWarning, title: "Reports are Inconsistent", desc: "Human error leads to subjective reporting, missed details, and potentially inadmissible evidence." }
            ].map((card, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="feature-card"
              >
                <div className="w-12 h-12 rounded-lg bg-cyan-bright/10 flex items-center justify-center mb-6">
                  <card.icon className="w-6 h-6 text-cyan-bright" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4">{card.title}</h3>
                <p className="text-text-muted leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Solution Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-cyan-bright font-bold tracking-widest uppercase text-xs">The Solution</span>
            <h2 className="text-4xl font-bold text-white mt-4">Automated Forensic Intelligence</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { icon: Hash, title: "SHA-256 Evidence Integrity", desc: "Cryptographic hashing guarantees evidence is untouched, proving chain of custody without a doubt." },
              { icon: Zap, title: "AI Generated Reports", desc: "LLaMA2 converts structured forensic data into human-readable narratives instantly." },
              { icon: Database, title: "Secure Evidence Storage", desc: "Military-grade encryption for all uploaded raw evidence, logs, and associated metadata." },
              { icon: Scale, title: "Neutral Court Ready Reports", desc: "Objectively stated, non-biased documentation that stands up to rigorous legal scrutiny." }
            ].map((card, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-6 p-8 rounded-2xl bg-gradient-to-br from-navy-medium to-transparent border border-white/5"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-cyan-bright/5 border border-cyan-bright/20 flex items-center justify-center">
                  <card.icon className="w-6 h-6 text-cyan-bright" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                  <p className="text-text-muted leading-relaxed">{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Access Control Section */}
      <section id="access" className="py-24 px-6 bg-navy-dark/50 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-cyan-bright font-bold tracking-widest uppercase text-xs">Access Control</span>
            <h2 className="text-4xl font-bold text-white mt-4">Role Based System Access</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="p-10 rounded-3xl bg-navy-medium/50 border border-white/5">
              <div className="w-16 h-16 rounded-2xl bg-cyan-bright/10 flex items-center justify-center mb-8">
                <User className="w-8 h-8 text-cyan-bright" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-6">System Administrator</h3>
              <ul className="space-y-4 mb-8">
                {[
                  "Manage users and permissions",
                  "Assign system roles",
                  "Monitor overarching system activity"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-white/80">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-bright" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="pt-8 border-t border-white/10">
                <p className="text-sm text-white/50 mb-4 italic">Scroll Down to Explore Roles ↓</p>
              </div>
            </div>

            <div className="terminal-mockup">
              <div className="terminal-header">
                <div className="dot dot-red" />
                <div className="dot dot-yellow" />
                <div className="dot dot-green" />
                <span className="text-[10px] text-white/30 ml-4 font-mono">admin_console.sh</span>
              </div>
              <div className="p-6 font-mono text-sm">
                <div className="text-cyan-bright mb-2">Admin Console Active</div>
                <div className="w-full h-2 bg-white/5 rounded mb-4" />
                <div className="w-3/4 h-2 bg-white/5 rounded mb-4" />
                <div className="w-1/2 h-2 bg-white/5 rounded mb-8" />
                <div className="px-4 py-2 rounded border border-cyan-bright/50 text-cyan-bright text-center">
                  Access Authorized
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-10 text-center text-white/30 text-sm border-t border-white/5">
        © 2026 AutoForensics.AI. All rights reserved. Professional Forensic Intelligence.
      </footer>
    </div>
  );
};

export default Dashboard;
