
import React, { useEffect, useState } from 'react';

interface IntroProps {
  onComplete: () => void;
}

const Intro: React.FC<IntroProps> = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 800); // Wait for fade out animation
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center transition-opacity duration-1000 overflow-hidden ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="intro-container text-center px-6 max-w-4xl mx-auto flex flex-col items-center justify-center">
        <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter blaze-text select-none leading-none">
          TUF-Flash
        </h1>
        <div className="mt-12 flex justify-center items-center gap-6 opacity-60">
          <span className="h-[2px] w-16 bg-gradient-to-r from-transparent via-red-600 to-transparent"></span>
          <p className="text-xs md:text-sm font-black uppercase tracking-[0.6em] text-red-500 whitespace-nowrap">Roadmap to Mastery</p>
          <span className="h-[2px] w-16 bg-gradient-to-r from-transparent via-red-600 to-transparent"></span>
        </div>
      </div>
    </div>
  );
};

export default Intro;
