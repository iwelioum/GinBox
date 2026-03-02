// NOM — ResumeModal.tsx — Rôle: Modal pour reprendre la lecture
// RÈGLES : Doit être contrôlé de l'extérieur.

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/shared/components/ui/Button';

// Helper to format seconds into MM:SS
const formatTime = (totalSeconds: number) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

interface ResumeModalProps {
  isOpen: boolean;
  resumeTime: number; // in seconds
  onClose: () => void;
  onResume: () => void;
  onRestart: () => void;
}

const ResumeModal: React.FC<ResumeModalProps> = ({
  isOpen,
  resumeTime,
  onClose,
  onResume,
  onRestart,
}) => {
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
          className="fixed inset-0 bg-bg-overlay z-50 flex items-center justify-center"
        >
          <motion.div
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()}
            className="bg-bg-card rounded-modal w-full max-w-md p-6 shadow-lg text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-2">Resume Playback?</h2>
            <p className="text-text-secondary text-lg mb-6">
              Do you want to resume from <span className="font-bold text-white">{formatTime(resumeTime)}</span>?
            </p>
            
            <div className="flex justify-center space-x-3">
              <Button variant="secondary" onClick={onRestart}>
                Start Over
              </Button>
              <Button variant="primary" onClick={onResume}>
                Resume
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { ResumeModal };
