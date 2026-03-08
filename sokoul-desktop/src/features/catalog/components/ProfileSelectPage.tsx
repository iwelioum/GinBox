// ProfileSelectPage.tsx — Role: Profile selection or creation
// RULES: With creation form

import React, { useState }                   from 'react'
import { useTranslation }                    from 'react-i18next'
import { useNavigate }                       from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence }           from 'framer-motion'
import { endpoints }                         from '@/shared/api/client'
import { useProfileStore }                   from '@/stores/profileStore'
import { TitleBar }                          from '../../../shared/components/layout/TitleBar'
import { Skeleton }                          from '@/shared/components/ui'
import type { Profile }                      from '../../../shared/types/index'

export default function ProfileSelectPage() {
  const { t } = useTranslation()
  const navigate         = useNavigate()
  const qc               = useQueryClient()
  const setActiveProfile = useProfileStore((s) => s.setActiveProfile)

  const [showForm,   setShowForm]   = useState(false)
  const [name,       setName]       = useState('')
  const [kids,       setKids]       = useState(false)
  const [formError,  setFormError]  = useState<string | null>(null)

  const { data: profiles = [], isLoading } = useQuery<Profile[]>({
    queryKey: ['profiles'],
    queryFn:  () => endpoints.profiles.list().then((r) => r.data),
  })

  const createProfile = useMutation({
    mutationFn: (newProfileData: { name: string; is_kids: boolean }) => endpoints.profiles.create(newProfileData),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['profiles'] })
      setShowForm(false)
      setName('')
      setKids(false)
      setFormError(null)
    },
    onError: () => setFormError(t('profile.errorCreating')),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setFormError(t('profile.nameRequired')); return }
    if (name.trim().length > 32) { setFormError(t('profile.nameTooLong')); return }
    createProfile.mutate({ name: name.trim(), is_kids: kids })
  }

  const handleSelectProfile = (profile: Profile) => {
    setActiveProfile(profile)
    navigate('/')
  }

  return (
    <>
      {/* Electron window controls — no Navbar on this page */}
      <TitleBar />

      <div className="min-h-screen bg-[var(--color-bg-primary)] flex flex-col items-center justify-center font-sans">
        {/* Title */}
        <h1 className="text-dp-text text-[clamp(1.5rem,4vw,2.5rem)] font-bold mb-10 tracking-tight">
          {t('profile.whosWatching')}
        </h1>

        {/* Profile grid + create button */}
        <div className="flex flex-wrap gap-6 justify-center max-w-[700px]">
          {isLoading && (
            <div className="flex gap-6 justify-center">
              <Skeleton variant="circle" />
              <Skeleton variant="circle" />
              <Skeleton variant="circle" />
            </div>
          )}

          {/* Existing profile cards */}
          {profiles.map((profile) => (
            <motion.button
              key={profile.id}
              onClick={() => handleSelectProfile(profile)}
              whileHover={{ scale: 1.06, y: -4 }}
              whileTap={{ scale: 0.97 }}
              className="bg-[var(--color-bg-glass)] border border-white/[0.08] rounded-[var(--radius-card)] px-8 py-6 cursor-pointer flex flex-col items-center gap-3 min-w-[130px] backdrop-blur-[20px] text-dp-text"
            >
              {/* Initial avatar */}
              <div className="w-16 h-16 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-[1.75rem] font-bold">
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-[0.95rem] font-medium">
                {profile.name}
              </span>
              {profile.isKids && (
                <span className="text-[0.7rem] bg-[rgba(10,132,255,0.2)] text-[var(--color-accent)] rounded-full px-2 py-0.5">
                  {t('profile.kids')}
                </span>
              )}
            </motion.button>
          ))}

          {/* Create a profile button */}
          <motion.button
            onClick={() => setShowForm(true)}
            whileHover={{ scale: 1.06, y: -4 }}
            whileTap={{ scale: 0.97 }}
            className="bg-[rgba(28,28,30,0.4)] border-2 border-dashed border-white/20 rounded-[var(--radius-card)] px-8 py-6 cursor-pointer flex flex-col items-center gap-3 min-w-[130px] text-[var(--color-text-muted)]"
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center text-[2rem]">
              +
            </div>
            <span className="text-[0.95rem]">{t('profile.createProfile')}</span>
          </motion.button>
        </div>

        {/* Creation form modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              className="fixed inset-0 bg-[var(--color-bg-overlay)] backdrop-blur-[8px] flex items-center justify-center z-[200]"
            >
              <motion.form
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1,    opacity: 1 }}
                exit={{ scale: 0.92,    opacity: 0 }}
                transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                onSubmit={handleSubmit}
                className="bg-[var(--color-bg-glass)] border border-white/10 rounded-[var(--radius-modal)] p-10 w-full max-w-[400px] flex flex-col gap-5"
              >
                <h2 className="text-dp-text text-[1.3rem] font-bold m-0">
                  {t('profile.newProfile')}
                </h2>

                {/* Name field */}
                <div className="flex flex-col gap-2">
                  <label className="text-[var(--color-text-secondary)] text-[0.85rem]">
                    {t('profile.profileName')}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('profile.placeholder')}
                    autoFocus
                    maxLength={32}
                    className="bg-[var(--color-bg-card)] border border-white/[0.12] rounded-[var(--radius-button)] py-3 px-4 text-dp-text text-base outline-none"
                  />
                </div>

                {/* Kids mode toggle */}
                <label className="flex items-center gap-3 cursor-pointer text-[var(--color-text-secondary)] text-[0.9rem]">
                  <div
                    onClick={() => setKids(!kids)}
                    className="relative shrink-0 cursor-pointer transition-colors duration-200"
                    style={{
                      width:        '44px',
                      height:       '26px',
                      borderRadius: 'var(--radius-pill)',
                      background:   kids ? 'var(--color-accent)' : 'rgba(255,255,255,0.15)',
                    }}
                  >
                    <div
                      className="absolute top-[3px] w-5 h-5 rounded-full bg-dp-text"
                      style={{
                        left:       kids ? '21px' : '3px',
                        transition: 'left 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                      }}
                    />
                  </div>
                  {t('profile.kidsMode')}
                </label>

                {/* Error */}
                {formError && (
                  <p className="text-[#ff453a] text-[0.85rem] m-0">
                    {formError}
                  </p>
                )}

                {/* Buttons */}
                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setFormError(null) }}
                    className="flex-1 py-3 rounded-full bg-white/[0.08] border-none text-dp-text cursor-pointer text-[0.95rem]"
                  >
                    {t('profile.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={createProfile.isPending}
                    className="flex-1 py-3 rounded-full border-none text-dp-text text-[0.95rem] font-semibold"
                    style={{
                      background: createProfile.isPending ? 'rgba(10,132,255,0.4)' : 'var(--color-accent)',
                      cursor:     createProfile.isPending ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {createProfile.isPending ? t('profile.creating') : t('profile.create')}
                  </button>
                </div>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  )
}
