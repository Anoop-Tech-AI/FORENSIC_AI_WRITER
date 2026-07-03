import React from 'react';
import { Navbar } from '../components/landing/Navbar';
import { Hero } from '../components/landing/Hero';
import { ProblemSection } from '../components/landing/ProblemSection';
import { SolutionSection } from '../components/landing/SolutionSection';
import { RolesHorizontalScroll } from '../components/landing/RolesHorizontalScroll';
import { WorkflowTimeline } from '../components/landing/WorkflowTimeline';
import { ChainOfCustody } from '../components/landing/ChainOfCustody';
import { Footer } from '../components/landing/CTA';

const LandingPage = () => {
  return (
    <div
      className="min-h-screen bg-[#0B1220] text-[#E5E7EB]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <Navbar />

      <main>
        <Hero />
        <ProblemSection />
        <SolutionSection />
        <RolesHorizontalScroll />
        <WorkflowTimeline />
        <ChainOfCustody />
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
