import React from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { Profile } from '@/shared/types/index'

interface ProfileCardProps {
  profile: Profile
  onSelect: (profile: Profile) => void
  isEditMode?: boolean
  onEdit?: (profile: Profile) => void
  onDelete?: (profile: Profile) => void
}

export function ProfileCard({ 
  profile, 
  onSelect, 
  isEditMode = false, 
  onEdit, 
  onDelete 
}: ProfileCardProps) {
  const { t } = useTranslation()

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative group cursor-pointer"
      onClick={() => !isEditMode && onSelect(profile)}
    >
      {/* Avatar */}
      <div className={`
        w-24 h-24 md:w-28 md:h-28 rounded-2xl overflow-hidden
        border-2 border-transparent
        bg-[var(--color-accent)] flex items-center justify-center
        transition-all duration-[var(--transition-base)]
        hover:border-[var(--color-accent)] hover:scale-105
        group-hover:ring-2 group-hover:ring-[var(--color-accent)] 
        group-hover:ring-offset-2 group-hover:ring-offset-[var(--color-bg-base)]
      `}>
        {/* Avatar Initial */}
        <span className="text-white text-2xl md:text-3xl font-bold">
          {profile.name.charAt(0).toUpperCase()}
        </span>
        
        {/* Kids Badge */}
        {profile.isKids && (
          <div className="absolute -bottom-1 -right-1 bg-[var(--color-accent)] text-white text-[10px] px-2 py-1 rounded-[var(--radius-pill)]">
            {t('profile.kids')}
          </div>
        )}
      </div>

      {/* Name */}
      <p className="text-[var(--color-text-secondary)] text-sm mt-2 text-center font-medium">
        {profile.name}
      </p>

      {/* Edit Mode Overlay */}
      {isEditMode && (
        <div className="absolute inset-0 bg-[var(--color-bg-overlay)] rounded-2xl flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-[var(--transition-fast)]">
          {onEdit && (
            <button
              aria-label={t('profile.edit')}
              onClick={(e) => {
                e.stopPropagation()
                onEdit(profile)
              }}
              className="w-10 h-10 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-[var(--transition-fast)]"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              aria-label={t('profile.delete')}
              onClick={(e) => {
                e.stopPropagation()
                onDelete(profile)
              }}
              className="w-10 h-10 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white transition-all duration-[var(--transition-fast)]"
            >
              🗑️
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}