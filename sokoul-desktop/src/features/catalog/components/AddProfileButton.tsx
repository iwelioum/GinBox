import React from 'react'
import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface AddProfileButtonProps {
  onClick: () => void
}

export function AddProfileButton({ onClick }: AddProfileButtonProps) {
  const { t } = useTranslation()

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={`
        w-24 h-24 md:w-28 md:h-28 rounded-2xl
        bg-[var(--color-bg-elevated)] 
        border-2 border-dashed border-[var(--color-border)]
        flex flex-col items-center justify-center gap-1
        text-[var(--color-text-muted)]
        transition-all duration-[var(--transition-base)]
        hover:border-[var(--color-accent)] hover:bg-[var(--color-bg-overlay)]
        hover:text-[var(--color-text-secondary)]
        group cursor-pointer
      `}
    >
      {/* Plus Icon */}
      <Plus className="w-8 h-8 md:w-10 md:h-10 stroke-2" />
      
      {/* Label */}
      <span className="text-xs text-center font-medium mt-1 leading-tight">
        {t('profile.createProfile')}
      </span>
    </motion.button>
  )
}