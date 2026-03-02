// DebridModal.tsx — Rôle: Modal de lecture via lien
// RÈGLES : Contrôlé de l'extérieur (isOpen, onClose, onPlay).
//          Accepte : liens Real-Debrid, magnets, URLs directes.

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/shared/components/ui/Button';
import { Link2, Play } from 'lucide-react';

interface DebridModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlay: (link: string) => void;
}

const DebridModal: React.FC<DebridModalProps> = ({ isOpen, onClose, onPlay }) => {
  const [link, setLink] = React.useState('');

  const handlePlay = () => {
    if (link.trim()) {
      onPlay(link.trim());
      setLink('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handlePlay();
    if (e.key === 'Escape') onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-bg-overlay z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-bg-card rounded-modal w-full max-w-lg p-6 shadow-card-hover"
          >
            {/* En-tête */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                <Link2 size={20} className="text-accent" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Lire depuis un lien</h2>
                <p className="text-text-secondary text-sm">
                  Collez un lien Real-Debrid, un magnet ou une URL directe
                </p>
              </div>
            </div>

            {/* Champ de saisie */}
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://real-debrid.com/d/... ou magnet:?xt=urn:btih:..."
              autoFocus
              className="w-full bg-bg-secondary text-white border border-white/20 rounded-card px-4 py-3 mb-6 focus:outline-none focus:ring-2 focus:ring-accent text-sm"
            />

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={onClose}>
                Annuler
              </Button>
              <Button
                variant="primary"
                leftIcon={<Play size={16} className="mr-1 fill-current" />}
                onClick={handlePlay}
                disabled={!link.trim()}
              >
                Lire
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { DebridModal };
