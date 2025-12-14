import React from 'react';

interface HexagramVisualProps {
  code: string; // 6-character binary string, e.g., "101010". Index 0 is bottom line.
  name: string;
  className?: string;
}

const HexagramVisual: React.FC<HexagramVisualProps> = ({ code, name, className = "" }) => {
  // Ensure we have exactly 6 characters, padding with '1' if necessary (fail-safe)
  const safeCode = code.padEnd(6, '1').substring(0, 6);
  
  // Traditional order: Line 1 is at the bottom, Line 6 is at the top.
  // We receive string index 0 as bottom. 
  // But when rendering a stack of divs, the first div in HTML is the "top" visually unless flex-direction is reverse.
  // Let's use flex-col-reverse so index 0 (bottom line) is at the bottom.
  const lines = safeCode.split('');

  return (
    <div className={`flex flex-col items-center justify-center p-4 rounded-lg bg-slate-800/50 border border-amber-500/30 ${className}`}>
      <div className="flex flex-col-reverse gap-2 mb-4 w-32">
        {lines.map((val, index) => (
          <div key={index} className="w-full h-4 flex justify-between relative">
            {val === '1' ? (
              // Yang Line (Solid)
              <div className="w-full h-full bg-amber-400 rounded-sm shadow-[0_0_10px_rgba(251,191,36,0.4)]"></div>
            ) : (
              // Yin Line (Broken)
              <>
                <div className="w-[42%] h-full bg-amber-400/80 rounded-sm"></div>
                <div className="w-[42%] h-full bg-amber-400/80 rounded-sm"></div>
              </>
            )}
            {/* Tooltip or Label for line number could go here */}
          </div>
        ))}
      </div>
      <h3 className="text-xl font-bold text-amber-300 font-serif tracking-wide text-center uppercase">{name}</h3>
    </div>
  );
};

export default HexagramVisual;
