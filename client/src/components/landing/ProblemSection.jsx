import React from 'react';
import { motion } from 'motion/react';
import { FileCode, Clock, FileWarning } from 'lucide-react';

const problems = [
  {
    icon: <FileCode size={32} className="text-red-400" />,
    title: 'Raw Forensic Data is Complex',
    description: 'Investigators are overwhelmed by massive log files, obscure hex dumps, and unstructured metadata.',
    glowColor: 'rgba(248,113,113,0.15)',
  },
  {
    icon: <Clock size={32} className="text-orange-400" />,
    title: 'Manual Analysis Takes Time',
    description: 'Hours are wasted manually cross-referencing events, calculating hashes, and building timelines.',
    glowColor: 'rgba(251,146,60,0.15)',
  },
  {
    icon: <FileWarning size={32} className="text-yellow-400" />,
    title: 'Reports are Inconsistent',
    description: 'Human error leads to subjective reporting, missed details, and potentially inadmissible evidence.',
    glowColor: 'rgba(250,204,21,0.15)',
  },
];

export function ProblemSection() {
  return (
    <section id="features" className="py-32 bg-[#0B1220] relative border-t border-[#1F2937] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
            className="text-[#22D3EE] font-semibold tracking-wider uppercase text-sm mb-3"
          >
            The Challenge
          </motion.h2>
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Why Investigations Fail
          </motion.h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {problems.map((prob, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: idx * 0.2 }}
              className="group p-[1px] rounded-2xl transition-all duration-500"
              style={{
                background: 'linear-gradient(to bottom, #1F2937, #0B1220)',
              }}
            >
              <div className="h-full bg-[#111827]/90 backdrop-blur-xl p-8 rounded-2xl border border-[#1F2937] group-hover:border-[#3B82F6]/30 transition-all duration-300">
                <div className="mb-6 p-4 rounded-xl bg-[#0B1220] border border-[#1F2937] inline-block">
                  {prob.icon}
                </div>
                <h4
                  className="text-xl font-bold text-[#E5E7EB] mb-4"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  {prob.title}
                </h4>
                <p className="text-[#9CA3AF] leading-relaxed">{prob.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
