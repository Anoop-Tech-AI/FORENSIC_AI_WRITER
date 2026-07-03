import React from 'react';
import { motion } from 'motion/react';
import { FileText, Database, ShieldCheck, Download, MoreHorizontal, FileImage, Cpu } from 'lucide-react';

export function DashboardMockup() {
  return (
    <section className="py-32 bg-[#0B1220] relative border-t border-[#1F2937] overflow-hidden">
      {/* Background glow lines */}
      <div className="absolute top-0 left-0 w-full h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(34,211,238,0.5), transparent)' }} />
      <div className="absolute top-20 right-0 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: 'rgba(34,211,238,0.05)', filter: 'blur(150px)' }} />

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-24">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
            className="text-[#22D3EE] font-semibold tracking-wider uppercase text-sm mb-3"
          >
            Interface
          </motion.h2>
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold text-white"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Forensic Dashboard Preview
          </motion.h3>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.4 }}
          className="rounded-2xl overflow-hidden border border-[#1F2937] bg-[#111827] max-w-6xl mx-auto flex flex-col"
          style={{ boxShadow: '0 0 50px rgba(34,211,238,0.1)' }}
        >
          {/* Top Bar */}
          <div className="h-16 bg-[#0B1220] border-b border-[#1F2937] flex items-center justify-between px-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-[#22D3EE]" size={24} />
              <span className="font-bold text-[#E5E7EB] text-lg" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Case ID: <span className="text-[#3B82F6]">#FX-2026-89</span>
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full bg-[#22D3EE]/10 text-[#22D3EE] border border-[#22D3EE]/20">
                <span className="w-2 h-2 rounded-full bg-[#22D3EE] animate-pulse" style={{ boxShadow: '0 0 8px #22D3EE' }} /> Live Sync
              </span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row flex-1 divide-y lg:divide-y-0 lg:divide-x divide-[#1F2937]" style={{ minHeight: '600px' }}>

            {/* Sidebar Stats */}
            <div className="w-full lg:w-80 bg-[#0B1220]/50 p-6 flex flex-col gap-6">
              <div>
                <h4 className="text-xs text-[#9CA3AF] uppercase tracking-wider font-semibold mb-4">Investigation Summary</h4>
                <div className="space-y-3">
                  {[
                    { icon: <FileImage size={18} className="text-[#3B82F6]" />, label: 'Evidence Files', value: '24' },
                    { icon: <Database size={18} className="text-[#22D3EE]" />, label: 'Metadata Extracted', value: '4.2k' },
                    { icon: <Cpu size={18} className="text-purple-400" />, label: 'Generated Reports', value: '2' },
                  ].map((item, i) => (
                    <div key={i} className="bg-[#111827] border border-[#1F2937] p-4 rounded-xl flex justify-between items-center hover:border-[#22D3EE]/30 transition-colors">
                      <div className="flex items-center gap-3 text-[#9CA3AF]">
                        {item.icon} <span className="text-sm">{item.label}</span>
                      </div>
                      <span className="font-mono text-white font-semibold">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto">
                <button className="w-full py-3 bg-[#22D3EE]/10 hover:bg-[#22D3EE]/20 border border-[#22D3EE]/30 text-[#22D3EE] rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors" style={{ boxShadow: '0 0 15px rgba(34,211,238,0.1)' }}>
                  <Download size={18} /> Export Full Report
                </button>
              </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 p-6 bg-[#111827]">
              <div className="flex justify-between items-center mb-6">
                <h4 className="text-lg font-bold text-[#E5E7EB]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Processed Evidence</h4>
                <button className="p-2 hover:bg-[#1F2937] rounded-lg text-[#9CA3AF] transition-colors"><MoreHorizontal size={20} /></button>
              </div>

              {/* Table */}
              <div className="rounded-xl border border-[#1F2937] overflow-hidden bg-[#0B1220]">
                <table className="w-full text-left">
                  <thead className="border-b border-[#1F2937] text-xs uppercase text-[#9CA3AF] font-semibold tracking-wider" style={{ background: 'rgba(31,41,55,0.5)' }}>
                    <tr>
                      <th className="py-4 px-6">Filename</th>
                      <th className="py-4 px-6">SHA-256 Signature</th>
                      <th className="py-4 px-6">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1F2937] text-sm text-[#E5E7EB]">
                    {[
                      { name: 'disk_image_vol1.dd', hash: 'e3b0c44298fc1c149afbf4c8996fb92427...', status: 'Verified', statusClass: 'text-[#22D3EE] bg-[#22D3EE]/10 border-[#22D3EE]/20' },
                      { name: 'network_packet_log.pcap', hash: '8d969eef6ecad3c29a3a629280e686cf0c...', status: 'Verified', statusClass: 'text-[#22D3EE] bg-[#22D3EE]/10 border-[#22D3EE]/20' },
                      { name: 'user_registry_hive.dat', hash: 'a1d0c6e83f027327d8461063f4ac58a6b4...', status: 'Analyzing', statusClass: 'text-purple-400 bg-purple-400/10 border-purple-400/20' },
                      { name: 'memory_dump.raw', hash: 'pending calculation...', status: 'Queued', statusClass: 'text-[#9CA3AF] bg-[#1F2937] border-[#374151]' },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-[#1F2937]/20 transition-colors">
                        <td className="py-4 px-6 font-medium">
                          <div className="flex items-center gap-3">
                            <FileText size={16} className="text-[#6B7280]" /> {row.name}
                          </div>
                        </td>
                        <td className="py-4 px-6 font-mono text-xs text-[#9CA3AF]">{row.hash}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-block px-3 py-1 rounded-full text-xs border ${row.statusClass}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Progress UI */}
              <div className="mt-8 p-6 rounded-xl border border-[#1F2937] bg-[#0B1220] relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Database size={100} />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-end mb-3">
                    <div>
                      <h5 className="text-[#E5E7EB] font-bold mb-1">AI Report Generation</h5>
                      <p className="text-xs text-[#9CA3AF]">Synthesizing findings via LLaMA2 model</p>
                    </div>
                    <span className="text-xl font-mono font-bold text-[#22D3EE]">78%</span>
                  </div>
                  <div className="h-3 bg-[#1F2937] rounded-full overflow-hidden border border-[#374151]">
                    <div
                      className="h-full w-[78%] relative"
                      style={{ background: 'linear-gradient(to right, #3B82F6, #22D3EE)' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
