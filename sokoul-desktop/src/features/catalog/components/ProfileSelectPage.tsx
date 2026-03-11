// ProfileSelectPage.tsx — Role: Profile selection with premium design
// RULES: Netflix 2025 × Infuse × Apple TV aesthetic

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { endpoints } from '@/shared/api/client'
import { useProfileStore } from '@/stores/profileStore'
import { useToast } from '@/shared/hooks/useToast'
import { TitleBar } from '@/shared/components/layout/TitleBar'
import { Skeleton, QueryErrorState } from '@/shared/components/ui'
import { ProfileCard } from './ProfileCard'
import { AddProfileButton } from './AddProfileButton'
import { ProfileForm } from './ProfileForm'
import type { Profile } from '@/shared/types/index'

export default function ProfileSelectPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { toast } = useToast()
  const activeProfile    = useProfileStore((s) => s.activeProfile)
  const setActiveProfile = useProfileStore((s) => s.setActiveProfile)

  const [showForm, setShowForm] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)

  const { data: profiles = [], isLoading, isError, error, refetch } = useQuery<Profile[]>({
    queryKey: ['profiles'],
    queryFn: () => endpoints.profiles.list().then((r) => r.data),
  })

  const handleSelectProfile = (profile: Profile) => {
    if (isEditMode) return
    setActiveProfile(profile)
    navigate('/')
  }

  const handleCreateProfile = () => {
    setEditingProfile(null)
    setShowForm(true)
  }

  const handleEditProfile = (profile: Profile) => {
    setEditingProfile(profile)
    setShowForm(true)
  }

  const handleDeleteProfile = async (profile: Profile) => {
    try {
      await endpoints.profiles.delete(profile.id)
      // Clear active profile if we just deleted it
      if (activeProfile?.id === profile.id) {
        setActiveProfile(null)
      }
      qc.invalidateQueries({ queryKey: ['profiles'] })
    } catch (err) {
      toast(t('profile.errorDeleting', { defaultValue: 'Failed to delete profile' }), 'error')
    }
  }

  return (
    <>
      {/* Electron window controls — no Navbar on this page */}
      <TitleBar />

      <div className="min-h-screen bg-[var(--color-bg-base)] flex flex-col items-center justify-center p-6">
        {/* Title */}
        <h1 className="text-[var(--color-text-primary)] text-[clamp(1.5rem,4vw,2.5rem)] font-bold tracking-[-0.02em] mb-4">
          {t('profile.whosWatching')}
        </h1>

        {/* Subtitle for edit mode */}
        {isEditMode && (
          <p className="text-[var(--color-text-secondary)] text-base mb-8">
            {t('profile.manageProfiles')}
          </p>
        )}

        {/* Error state */}
        {isError && !isLoading && (
          <QueryErrorState error={error} refetch={refetch} className="mb-8" />
        )}

        {/* Profile grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-3xl mx-auto mb-8">
          {/* Loading skeletons */}
          {isLoading && (
            <>
              <div className="flex flex-col items-center gap-2">
                <Skeleton variant="circle" className="w-24 h-24 md:w-28 md:h-28" />
                <Skeleton variant="text" className="w-16 h-4" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <Skeleton variant="circle" className="w-24 h-24 md:w-28 md:h-28" />
                <Skeleton variant="text" className="w-20 h-4" />
              </div>
              <div className="flex flex-col items-center gap-2">
                <Skeleton variant="circle" className="w-24 h-24 md:w-28 md:h-28" />
                <Skeleton variant="text" className="w-14 h-4" />
              </div>
            </>
          )}

          {/* Profile cards */}
          {profiles.map((profile) => (
            <div key={profile.id} className="flex flex-col items-center">
              <ProfileCard
                profile={profile}
                onSelect={handleSelectProfile}
                isEditMode={isEditMode}
                onEdit={handleEditProfile}
                onDelete={handleDeleteProfile}
              />
            </div>
          ))}

          {/* Add profile button */}
          {!isEditMode && (
            <div className="flex flex-col items-center">
              <AddProfileButton onClick={handleCreateProfile} />
            </div>
          )}
        </div>

        {/* Manage profiles toggle */}
        <button
          onClick={() => setIsEditMode(!isEditMode)}
          className={`
            px-6 py-3 rounded-lg text-sm font-medium
            transition-all duration-[var(--transition-base)]
            ${isEditMode 
              ? 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]'
              : 'bg-[var(--color-bg-elevated)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }
          `}
        >
          {isEditMode ? t('profile.done') : t('profile.manageProfiles')}
        </button>

        {/* Profile creation / edit form */}
        <ProfileForm
          isOpen={showForm}
          onClose={() => {
            setShowForm(false)
            setEditingProfile(null)
          }}
          profileToEdit={editingProfile ?? undefined}
        />
      </div>
    </>
  )
}
