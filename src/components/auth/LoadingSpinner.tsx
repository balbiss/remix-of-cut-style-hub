import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  variant?: 'spinner' | 'dots' | 'bars';
}

export function LoadingSpinner({ 
  size = 'sm', 
  text,
  variant = 'dots'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  const barSizes = {
    sm: 'w-0.5 h-3',
    md: 'w-1 h-4',
    lg: 'w-1.5 h-5',
  };

  if (variant === 'spinner') {
    return (
      <div className="flex items-center gap-2">
        <motion.div
          className={`${sizeClasses[size]} rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground`}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
        />
        {text && <span className="text-sm">{text}</span>}
      </div>
    );
  }

  if (variant === 'bars') {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className={`${barSizes[size]} rounded-full bg-primary-foreground`}
              animate={{
                scaleY: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.1,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
        {text && <span className="text-sm">{text}</span>}
      </div>
    );
  }

  // Default: dots
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={`${dotSizes[size]} rounded-full bg-primary-foreground`}
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      {text && <span className="text-sm">{text}</span>}
    </div>
  );
}

export function GoogleLoadingSpinner() {
  const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853'];
  
  return (
    <div className="flex items-center gap-2">
      <div className="relative w-5 h-5">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(${colors[0]} 0deg 90deg, ${colors[1]} 90deg 180deg, ${colors[2]} 180deg 270deg, ${colors[3]} 270deg 360deg)`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <div className="absolute inset-[3px] rounded-full bg-background" />
      </div>
      <span className="text-sm">Conectando...</span>
    </div>
  );
}
