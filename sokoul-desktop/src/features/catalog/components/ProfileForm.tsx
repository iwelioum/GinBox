import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { endpoints } from '@/shared/api/client'

interface ProfileFormProps {
  isOpen: boolean
  onClose: () => void
  profileToEdit?: any // Profile object when editing
}

export function ProfileForm({ isOpen, onClose, profileToEdit }: ProfileFormProps) {
  const { t } = useTranslation()
  const qc = useQueryClient()
  
  const [name, setName] = useState(profileToEdit?.name || '')
  const [kids, setKids] = useState(profileToEdit?.isKids || false)
  const [formError, setFormError] = useState<string | null>(null)

  const createProfile = useMutation({
    mutationFn: (newProfileData: { name: string; is_kids: boolean }) => 
      endpoints.profiles.create(newProfileData),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profiles'] })
      handleClose()
    },
    onError: () => setFormError(t('profile.errorCreating')),
  })

  const handleClose = () => {
    onClose()
    setName('')
    setKids(false)
    setFormError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { 
      setFormError(t('profile.nameRequired'))
      return 
    }
    if (name.trim().length > 32) { 
      setFormError(t('profile.nameTooLong'))
      return 
    }
    createProfile.mutate({ name: name.trim(), is_kids: kids })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-[var(--color-bg-overlay)] backdrop-blur-xl flex items-center justify-center z-[200]"
        >
          <motion.form
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit}
            className={`
              bg-[var(--color-bg-overlay)] border border-[var(--color-border)]
              rounded-2xl p-8 w-full max-w-md mx-4
              shadow-[var(--shadow-overlay)]
            `}
          >
            <h2 className="text-[var(--color-text-primary)] text-xl font-bold mb-6">
              {profileToEdit ? t('profile.editProfile') : t('profile.newProfile')}
            </h2>

            {/* Name Field */}
            <div className="mb-6">
              <label className="block text-[var(--color-text-secondary)] text-sm mb-2">
                {t('profile.profileName')}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('profile.placeholder')}
                autoFocus
                maxLength={32}
                className={`
                  w-full bg-[var(--color-bg-elevated)] 
                  border border-[var(--color-border)]
                  rounded-lg px-4 py-3
                  text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)]
                  outline-none focus:border-[var(--color-accent)]
                  transition-colors duration-[var(--transition-fast)]
                `}
              />
            </div>

            {/* Kids Mode Toggle */}
            <div className="mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setKids(!kids)}
                  className={`
                    relative w-11 h-6 rounded-[var(--radius-pill)] cursor-pointer
                    transition-colors duration-[var(--transition-base)]
                    ${kids ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'}
                  `}
                >
                  <div
                    className={`
                      absolute top-1 w-4 h-4 rounded-full bg-white
                      transition-transform duration-[var(--transition-base)]
                      ${kids ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </div>
                <span className="text-[var(--color-text-secondary)] text-sm">
                  {t('profile.kidsMode')}
                </span>
              </label>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="mb-4 p-3 rounded-lg bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/20">
                <p className="text-[var(--color-danger)] text-sm">
                  {formError}
                </p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleClose}
                className={`
                  flex-1 py-3 px-6 rounded-lg
                  bg-[var(--color-bg-elevated)] border border-[var(--color-border)]
                  text-[var(--color-text-secondary)]
                  transition-colors duration-[var(--transition-fast)]
                  hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-muted)]
                `}
              >
                {t('profile.cancel')}
              </button>
              <button
                type="submit"
                disabled={createProfile.isPending}
                className={`
                  flex-1 py-3 px-6 rounded-lg font-medium
                  bg-[var(--color-accent)] text-white
                  transition-all duration-[var(--transition-fast)]
                  hover:bg-[var(--color-accent-hover)]
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {createProfile.isPending 
                  ? t('profile.creating') 
                  : profileToEdit 
                    ? t('profile.save')
                    : t('profile.create')
                }
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}