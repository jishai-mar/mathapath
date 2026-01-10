import { motion } from 'framer-motion';

interface PerspectiveMapsProps {
  className?: string;
}

export function PerspectiveMaps({ className = '' }: PerspectiveMapsProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
      {/* Left Map - Current Situation */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground text-center font-medium">Current Situation</p>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative aspect-[4/3] rounded-lg overflow-hidden border border-border/50 bg-muted/30"
        >
          {/* Simplified map representation */}
          <svg viewBox="0 0 200 150" className="w-full h-full">
            {/* Mediterranean Sea */}
            <rect x="0" y="0" width="40" height="150" fill="hsl(210, 30%, 25%)" />
            <text x="20" y="75" fill="hsl(210, 20%, 50%)" fontSize="6" textAnchor="middle" className="font-sans">
              Med.
            </text>
            
            {/* Main land area - mixed control representation */}
            <rect x="40" y="0" width="160" height="150" fill="hsl(220, 15%, 20%)" />
            
            {/* Gaza Strip */}
            <rect x="40" y="100" width="15" height="30" fill="hsl(160, 30%, 35%)" />
            <text x="47" y="118" fill="hsl(160, 20%, 70%)" fontSize="5" textAnchor="middle">Gaza</text>
            
            {/* West Bank - fragmented areas */}
            <path 
              d="M 100 20 L 130 20 L 135 50 L 140 80 L 130 110 L 100 100 L 95 60 Z" 
              fill="hsl(160, 30%, 35%)" 
              opacity="0.7"
            />
            <text x="115" y="65" fill="hsl(160, 20%, 70%)" fontSize="5" textAnchor="middle">West</text>
            <text x="115" y="72" fill="hsl(160, 20%, 70%)" fontSize="5" textAnchor="middle">Bank</text>
            
            {/* Dotted pattern for mixed zones */}
            <pattern id="dots" x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
              <circle cx="4" cy="4" r="1" fill="hsl(45, 30%, 40%)" opacity="0.4" />
            </pattern>
            <rect x="80" y="30" width="60" height="60" fill="url(#dots)" />
            
            {/* Jerusalem marker */}
            <circle cx="110" cy="85" r="4" fill="hsl(45, 40%, 50%)" />
            <text x="110" y="96" fill="hsl(45, 30%, 60%)" fontSize="5" textAnchor="middle">Jerusalem</text>
            
            {/* Legend */}
            <rect x="150" y="120" width="8" height="6" fill="hsl(160, 30%, 35%)" />
            <text x="162" y="125" fill="hsl(0, 0%, 60%)" fontSize="4">Palestinian areas</text>
            <rect x="150" y="130" width="8" height="6" fill="hsl(220, 15%, 20%)" />
            <text x="162" y="135" fill="hsl(0, 0%, 60%)" fontSize="4">Israeli control</text>
            <rect x="150" y="140" width="8" height="6" fill="hsl(45, 40%, 50%)" />
            <text x="162" y="145" fill="hsl(0, 0%, 60%)" fontSize="4">Disputed</text>
          </svg>
        </motion.div>
      </div>

      {/* Right Map - Two-State Solution */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground text-center font-medium">Two-State Proposal</p>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="relative aspect-[4/3] rounded-lg overflow-hidden border border-border/50 bg-muted/30"
        >
          {/* Simplified map representation */}
          <svg viewBox="0 0 200 150" className="w-full h-full">
            {/* Mediterranean Sea */}
            <rect x="0" y="0" width="40" height="150" fill="hsl(210, 30%, 25%)" />
            <text x="20" y="75" fill="hsl(210, 20%, 50%)" fontSize="6" textAnchor="middle" className="font-sans">
              Med.
            </text>
            
            {/* Israel - clearly defined */}
            <path 
              d="M 40 0 L 95 0 L 95 100 L 55 130 L 40 150 L 40 0" 
              fill="hsl(220, 25%, 30%)" 
            />
            <text x="65" y="60" fill="hsl(220, 20%, 70%)" fontSize="7" textAnchor="middle">Israel</text>
            
            {/* Gaza - Palestinian state */}
            <rect x="40" y="100" width="15" height="30" fill="hsl(160, 35%, 40%)" />
            
            {/* West Bank - Palestinian state (contiguous) */}
            <path 
              d="M 95 0 L 200 0 L 200 150 L 55 130 L 95 100 Z" 
              fill="hsl(160, 35%, 40%)" 
            />
            <text x="140" y="65" fill="hsl(160, 20%, 80%)" fontSize="7" textAnchor="middle">Palestine</text>
            
            {/* Border line */}
            <path 
              d="M 95 0 L 95 100 L 55 130" 
              stroke="hsl(45, 50%, 50%)" 
              strokeWidth="2" 
              strokeDasharray="4,2"
              fill="none"
            />
            
            {/* Jerusalem - shared/international */}
            <circle cx="95" cy="85" r="6" fill="hsl(45, 50%, 50%)" stroke="hsl(45, 60%, 60%)" strokeWidth="1" />
            <text x="95" y="100" fill="hsl(45, 40%, 60%)" fontSize="5" textAnchor="middle">Jerusalem</text>
            <text x="95" y="106" fill="hsl(45, 40%, 50%)" fontSize="4" textAnchor="middle">(shared)</text>
            
            {/* Legend */}
            <rect x="150" y="120" width="8" height="6" fill="hsl(160, 35%, 40%)" />
            <text x="162" y="125" fill="hsl(0, 0%, 60%)" fontSize="4">Palestine</text>
            <rect x="150" y="130" width="8" height="6" fill="hsl(220, 25%, 30%)" />
            <text x="162" y="135" fill="hsl(0, 0%, 60%)" fontSize="4">Israel</text>
            <line x1="150" y1="143" x2="158" y2="143" stroke="hsl(45, 50%, 50%)" strokeWidth="2" strokeDasharray="4,2" />
            <text x="162" y="145" fill="hsl(0, 0%, 60%)" fontSize="4">Border</text>
          </svg>
        </motion.div>
      </div>
    </div>
  );
}
