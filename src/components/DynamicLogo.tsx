import { motion } from 'framer-motion';

interface DynamicLogoProps {
  logoUrl: string | null;
  businessName: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showNameWithLogo?: boolean;
}

const sizeClasses = {
  sm: 'h-8',
  md: 'h-12',
  lg: 'h-16',
};

const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
};

export function DynamicLogo({ logoUrl, businessName, size = 'md', className = '', showNameWithLogo = true }: DynamicLogoProps) {
  if (logoUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={`flex items-center gap-3 ${className}`}
      >
        <img
          src={logoUrl}
          alt={businessName}
          className={`${sizeClasses[size]} w-auto object-contain`}
        />
        {showNameWithLogo && (
          <h1 className={`font-display font-bold gold-text ${textSizeClasses[size]}`}>
            {businessName}
          </h1>
        )}
      </motion.div>
    );
  }

  return (
    <motion.h1
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`font-display font-bold gold-text ${textSizeClasses[size]} ${className}`}
    >
      {businessName}
    </motion.h1>
  );
}
