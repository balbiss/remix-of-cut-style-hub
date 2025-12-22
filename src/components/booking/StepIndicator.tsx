import { motion } from 'framer-motion';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

export function StepIndicator({ currentStep, totalSteps, labels }: StepIndicatorProps) {
  return (
    <div className="w-full px-2 py-2">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div key={i} className="flex items-center flex-1">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ 
                scale: i + 1 === currentStep ? 1.1 : 1,
                backgroundColor: i + 1 <= currentStep ? 'hsl(43, 56%, 52%)' : 'hsl(0, 0%, 25%)'
              }}
              transition={{ duration: 0.3 }}
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                i + 1 <= currentStep ? 'text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              {i + 1}
            </motion.div>
            {i < totalSteps - 1 && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ 
                  scaleX: 1,
                  backgroundColor: i + 1 < currentStep ? 'hsl(43, 56%, 52%)' : 'hsl(0, 0%, 25%)'
                }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex-1 h-0.5 mx-1 origin-left"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
