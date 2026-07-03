import React from 'react';
import { motion } from 'motion/react';
import { Upload, Hash, Database, Sparkles, Scale, ArrowRight } from 'lucide-react';

const lifecycle = [
  { id: 1, title: 'Upload Evidence', icon: <Upload /> },
  { id: 2, title: 'Generate Hash', icon: <Hash /> },
  { id: 3, title: 'Store Metadata', icon: <Database /> },
  { id: 4, title: 'AI Report Generation', icon: <Sparkles /> },
  { id: 5, title: 'Court Ready Report', icon: <Scale /> },
];

export function ChainOfCustody() {
  return (
    <section className="py-32 bg-[#0B1220] relative border-t border-[#1F2937] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
            className="text-[#22D3EE] font-semibold tracking-wider uppercase text-sm mb-3"
          >
            Lifecycle
          </motion.h2>
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Chain of Custody
          </motion.h3>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-4">
          {lifecycle.map((step, idx) => (
            <React.Fragment key={step.id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="flex flex-col items-center group relative z-10 w-40"
              >
                <div className="w-24 h-24 rounded-2xl bg-[#111827] border-2 border-[#1F2937] flex items-center justify-center text-[#9CA3AF] shadow-2xl relative overflow-hidden transition-colors duration-300 group-hover:border-[#22D3EE] group-hover:text-[#22D3EE]"
                  style={{ '--hover-shadow': '0 0 30px rgba(34,211,238,0.2)' }}
                >
                  <div className="absolute inset-0 bg-[#22D3EE]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  {React.cloneElement(step.icon, { size: 32 })}
                </div>
                <div className="mt-6 text-center">
                  <span className="text-[#22D3EE] font-mono text-xs mb-2 block">PHASE 0{step.id}</span>
                  <h4
                    className="text-[#E5E7EB] font-bold leading-tight"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    {step.title}
                  </h4>
                </div>
              </motion.div>

              {idx < lifecycle.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 + 0.2 }}
                  className="hidden lg:flex items-center justify-center flex-1 relative"
                  style={{ height: '2px', background: '#1F2937' }}
                >
                  <motion.div
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: idx * 0.1 + 0.3 }}
                    className="absolute top-0 left-0 w-full h-full origin-left"
                    style={{
                      background: 'linear-gradient(to right, transparent, #22D3EE, transparent)',
                      boxShadow: '0 0 10px #22D3EE',
                    }}
                  />
                  <ArrowRight className="text-[#22D3EE] absolute bg-[#0B1220] px-1" size={24} />
                </motion.div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
