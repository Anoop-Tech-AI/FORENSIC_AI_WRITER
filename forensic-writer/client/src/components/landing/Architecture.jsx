import React from 'react';
import { motion } from 'motion/react';
import { ArrowDown, Users, Monitor, Server, Database, BrainCircuit, FileDown } from 'lucide-react';

const architectureNodes = [
  { label: 'User', icon: <Users size={24} />, color: '#22D3EE' },
  { label: 'React Frontend', icon: <Monitor size={24} />, color: '#3B82F6' },
  { label: 'Node + Express Backend', icon: <Server size={24} />, color: '#22D3EE' },
  { label: 'MongoDB Database', icon: <Database size={24} />, color: '#3B82F6' },
  { label: 'AI API (HuggingFace LLaMA2)', icon: <BrainCircuit size={24} />, color: '#A855F7' },
  { label: 'Forensic Report Generator', icon: <FileDown size={24} />, color: '#22D3EE' },
];

export function Architecture() {
  return (
    <section id="architecture" className="py-32 bg-[#0B1220] relative border-t border-[#1F2937] overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at bottom right, rgba(34,211,238,0.1), transparent 50%)' }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-24">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
            className="text-[#22D3EE] font-semibold tracking-wider uppercase text-sm mb-3"
          >
            System Design
          </motion.h2>
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Architecture Visualization
          </motion.h3>
        </div>

        <div className="flex flex-col items-center max-w-xl mx-auto">
          {architectureNodes.map((node, idx) => (
            <div key={idx} className="w-full flex flex-col items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 30 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="w-full bg-[#111827]/90 backdrop-blur-md rounded-2xl p-6 flex items-center gap-6 border border-[#1F2937] hover:border-[#22D3EE]/50 transition-colors duration-300 shadow-2xl relative group"
              >
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
                  style={{ backgroundColor: node.color }}
                />
                <div
                  className="p-4 rounded-xl bg-[#0B1220] border border-[#1F2937]"
                  style={{
                    color: node.color,
                    boxShadow: `inset 0 0 15px ${node.color}20`,
                  }}
                >
                  {node.icon}
                </div>
                <span
                  className="text-[#E5E7EB] font-bold text-xl tracking-wide"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {node.label}
                </span>
              </motion.div>

              {idx < architectureNodes.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  whileInView={{ opacity: 1, height: 'auto' }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.4, delay: idx * 0.1 + 0.2 }}
                  className="py-4 relative flex items-center justify-center"
                >
                  <div
                    className="absolute top-0 bottom-0 w-[2px] animate-pulse"
                    style={{
                      background: 'linear-gradient(to bottom, transparent, #22D3EE, transparent)',
                      boxShadow: '0 0 10px #22D3EE',
                    }}
                  />
                  <ArrowDown
                    size={32}
                    className="text-[#22D3EE] z-10"
                    style={{ filter: 'drop-shadow(0 0 8px #22D3EE)' }}
                  />
                </motion.div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
