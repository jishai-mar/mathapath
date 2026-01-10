import { motion } from 'framer-motion';

interface PerspectiveArgumentsProps {
  className?: string;
}

export function PerspectiveArguments({ className = '' }: PerspectiveArgumentsProps) {
  const currentSituationArguments = [
    "Security concerns based on historical conflicts and ongoing tensions",
    "Questions about governance viability and institutional readiness",
    "Existing population distributions and settlement considerations",
    "Complexity of implementing international agreements in practice",
  ];

  const twoStateArguments = [
    "Supports internationally recognized self-determination principles",
    "Provides a framework for resolving territorial disputes through negotiation",
    "Addresses demographic considerations for both populations",
    "Aligned with multiple international diplomatic precedents and UN resolutions",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`}
    >
      {/* Current Situation Arguments */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-400" />
          Common arguments for the current situation
        </h4>
        <ul className="space-y-2">
          {currentSituationArguments.map((arg, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + index * 0.05 }}
              className="text-sm text-foreground/80 pl-4 border-l-2 border-slate-500/30 py-1"
            >
              {arg}
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Two-State Solution Arguments */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-teal-400" />
          Common arguments for a two-state solution
        </h4>
        <ul className="space-y-2">
          {twoStateArguments.map((arg, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + index * 0.05 }}
              className="text-sm text-foreground/80 pl-4 border-l-2 border-teal-500/30 py-1"
            >
              {arg}
            </motion.li>
          ))}
        </ul>
      </div>
    </motion.div>
  );
}
