import React, { useRef } from 'react';
import { motion, useScroll } from 'motion/react';
import { UploadCloud, Hash, FileSearch, Database, Bot, Download } from 'lucide-react';

const steps = [
  { id: 1, title: 'Upload Evidence', icon: <UploadCloud /> },
  { id: 2, title: 'Generate SHA-256 Hash', icon: <Hash /> },
  { id: 3, title: 'Extract Metadata & Logs', icon: <FileSearch /> },
  { id: 4, title: 'Structure Data into JSON', icon: <Database /> },
  { id: 5, title: 'AI Generates Report', icon: <Bot /> },
  { id: 6, title: 'Download Report', icon: <Download /> },
];

export function WorkflowTimeline() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start center', 'end center'],
  });

  return (
    <section id="workflow" ref={containerRef} className="py-32 bg-[#0B1220] relative border-t border-[#1F2937]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-24">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
            className="text-[#22D3EE] font-semibold tracking-wider uppercase text-sm mb-3"
          >
            Pipeline
          </motion.h2>
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Investigation Workflow
          </motion.h3>
        </div>

        <div className="relative">
          {/* Background Timeline Line */}
          <div className="absolute top-0 bottom-0 left-[27px] md:left-1/2 w-[4px] bg-[#1F2937] rounded-full" style={{ marginLeft: '-2px' }} />

          {/* Animated Glow Timeline Line */}
          <motion.div
            style={{
              scaleY: scrollYProgress,
              originY: 0,
              background: 'linear-gradient(to bottom, #22D3EE, #3B82F6, #a855f7)',
              boxShadow: '0 0 15px rgba(34,211,238,0.8)',
              marginLeft: '-2px',
            }}
            className="absolute top-0 bottom-0 left-[27px] md:left-1/2 w-[4px] rounded-full z-0"
          />

          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, margin: '-150px' }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
              className={`relative flex items-center mb-20 md:mb-32 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
            >
              {/* Center Icon Node */}
              <div className="absolute left-0 md:left-1/2 w-14 h-14 rounded-xl border-2 border-[#1F2937] bg-[#0B1220] flex items-center justify-center z-10 text-[#9CA3AF] shadow-xl" style={{ transform: 'translateX(-50%)' }}>
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: false, margin: '-150px' }}
                  className="absolute inset-0 rounded-xl border-2 border-[#22D3EE] bg-[#22D3EE]/10"
                  style={{ boxShadow: '0 0 20px #22D3EE' }}
                />
                <div className="relative z-10 text-white">
                  {React.cloneElement(step.icon, { size: 24 })}
                </div>
              </div>

              {/* Content Box */}
              <div className="ml-20 md:ml-0 md:w-1/2 flex flex-col justify-center px-4">
                <div
                  className={`p-8 bg-[#111827]/80 backdrop-blur-md rounded-2xl border border-[#1F2937] hover:border-[#22D3EE]/50 transition-all duration-300 relative group shadow-lg ${index % 2 === 0 ? 'md:mr-16' : 'md:ml-16'}`}
                >
                  <span
                    className="absolute -top-6 -right-4 text-8xl font-bold text-[#1F2937]/20 select-none z-0"
                    style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                  >
                    0{step.id}
                  </span>
                  <div className="relative z-10">
                    <h4
                      className="text-2xl font-bold text-[#E5E7EB] group-hover:text-[#22D3EE] transition-colors"
                      style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {step.title}
                    </h4>
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
