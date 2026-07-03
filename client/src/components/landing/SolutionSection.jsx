import React from 'react';
import { motion } from 'motion/react';
import { Hash, Sparkles, Lock, Scale } from 'lucide-react';

const solutions = [
  {
    icon: <Hash size={32} className="text-[#22D3EE]" />,
    title: 'SHA-256 Evidence Integrity',
    desc: 'Cryptographic hashing guarantees evidence is untouched, proving chain of custody without a doubt.',
  },
  {
    icon: <Sparkles size={32} className="text-[#3B82F6]" />,
    title: 'AI Generated Reports',
    desc: 'LLaMA2 converts structured forensic data into human-readable narratives instantly.',
  },
  {
    icon: <Lock size={32} className="text-[#22D3EE]" />,
    title: 'Secure Evidence Storage',
    desc: 'Military-grade encryption for all uploaded raw evidence, logs, and associated metadata.',
  },
  {
    icon: <Scale size={32} className="text-[#3B82F6]" />,
    title: 'Neutral Court Ready Reports',
    desc: 'Objectively stated, non-biased documentation that stands up to rigorous legal scrutiny.',
  },
];

export function SolutionSection() {
  return (
    <section className="py-32 bg-[#0B1220] relative border-t border-[#1F2937]">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(34,211,238,0.05), transparent 70%)' }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
            className="text-[#22D3EE] font-semibold tracking-wider uppercase text-sm mb-3"
          >
            The Solution
          </motion.h2>
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Automated Forensic Intelligence
          </motion.h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {solutions.map((sol, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative p-[1px] rounded-2xl overflow-hidden"
              style={{ background: 'linear-gradient(to bottom right, #1F2937, transparent)' }}
            >
              <div className="relative h-full bg-[#111827]/80 backdrop-blur-xl p-10 rounded-2xl border border-transparent group-hover:border-[#22D3EE]/20 transition-all duration-300">
                <div className="flex items-start gap-6">
                  <div
                    className="p-4 rounded-xl bg-[#0B1220] border border-[#1F2937] group-hover:scale-110 transition-transform duration-300"
                    style={{ boxShadow: 'inset 0 0 15px rgba(34,211,238,0.1)' }}
                  >
                    {sol.icon}
                  </div>
                  <div>
                    <h4
                      className="text-xl font-bold text-[#E5E7EB] mb-3 group-hover:text-[#22D3EE] transition-colors"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {sol.title}
                    </h4>
                    <p className="text-[#9CA3AF] leading-relaxed">{sol.desc}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
