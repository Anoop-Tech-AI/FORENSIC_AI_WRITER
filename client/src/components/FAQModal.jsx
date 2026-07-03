import React, { useState, useEffect } from 'react';
import { X, Search, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQModal = ({ isOpen, onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedIndex, setExpandedIndex] = useState(null);

    // Close on ESC key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
            return () => window.removeEventListener('keydown', handleEsc);
        }
    }, [isOpen, onClose]);

    const faqData = [
        {
            question: 'How to create a case?',
            answer: 'Go to Dashboard → Click "Create Case" → Fill required details → Submit.'
        },
        {
            question: 'How to upload evidence?',
            answer: 'Open a case → Click "Upload Evidence" → Select file → Upload.'
        },
        {
            question: 'How to view reports?',
            answer: 'Navigate to Reports section → Select case → View report.'
        },
        {
            question: 'How to contact admin?',
            answer: 'Use the support/contact section in the app.'
        },
        {
            question: 'How to run AI analysis?',
            answer: 'Select a case → Choose evidence files → Click "Initiate Analysis" in AI Investigation page.'
        },
        {
            question: 'How to download reports?',
            answer: 'Go to Reports page → Click download button on the desired report.'
        },
        {
            question: 'How to delete a case?',
            answer: 'Open the case → Click delete button (admin only).'
        },
        {
            question: 'How to change password?',
            answer: 'Go to Profile → Update password section.'
        }
    ];

    const filteredFAQs = faqData.filter(faq => 
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleAccordion = (index) => {
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-blue-600/10 to-indigo-600/10">
                    <div className="flex items-center gap-3">
                        <HelpCircle size={24} className="text-blue-400" />
                        <h2 className="text-xl font-bold text-black dark:text-white">Help & FAQs</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 dark:text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search questions..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-lg text-black dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>
                </div>

                {/* FAQ Content */}
                <div className="p-6 overflow-y-auto max-h-[50vh] custom-scrollbar">
                    {filteredFAQs.length === 0 ? (
                        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                            No FAQs found matching your search.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredFAQs.map((faq, index) => (
                                <div
                                    key={index}
                                    className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden"
                                >
                                    <button
                                        onClick={() => toggleAccordion(index)}
                                        className="w-full px-4 py-3 flex items-center justify-between text-left bg-gray-100 dark:bg-gray-900/30 hover:bg-gray-200 dark:hover:bg-gray-800/50 transition-colors"
                                    >
                                        <span className="text-sm font-medium text-black dark:text-white">{faq.question}</span>
                                        <motion.div
                                            animate={{ rotate: expandedIndex === index ? 180 : 0 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <X size={16} className="text-gray-600 dark:text-gray-400" />
                                        </motion.div>
                                    </button>
                                    <AnimatePresence>
                                        {expandedIndex === index && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="px-4 py-3 bg-gray-100 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-800">
                                                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{faq.answer}</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 text-center">
                    <p className="text-xs text-gray-600 dark:text-gray-500">
                        Press ESC to close
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default FAQModal;
