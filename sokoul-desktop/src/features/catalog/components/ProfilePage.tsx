// ProfilePage.tsx — Active profile detail page
// Shows avatar, name, kids badge, creation date and navigation shortcuts

import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useProfileStore } from '@/stores/profileStore'

export default function ProfilePage() {
  const { t }         = useTranslation()
  const navigate      = useNavigate()
  const activeProfile = useProfileStore((s) => s.activeProfile)

  // Redirect to profile select if there is no active profile
  useEffect(() => {
    if (activeProfile === null || activeProfile === undefined) {
      navigate('/profile-select', { replace: true })
    }
  }, [activeProfile, navigate])

  if (!activeProfile) return null

  // Format the createdAt UNIX timestamp (seconds) into a readable locale date
  const createdAtDate = new Date(activeProfile.createdAt * 1000)
  const formattedDate = createdAtDate.toLocaleDateString(undefined, {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  })

  // Avatar: use avatarUrl if provided, otherwise render first letter of name
  const avatarLetter = activeProfile.name.trim().charAt(0).toUpperCase()

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ background: 'var(--color-bg-base)' }}
    >
      <div
        className="w-full max-w-sm flex flex-col items-center gap-6"
      >
        {/* --- Avatar --- */}
        {activeProfile.avatarUrl ? (
          <img
            src={activeProfile.avatarUrl}
            alt={activeProfile.name}
            className="rounded-full object-cover"
            style={{ width: 120, height: 120, border: '3px solid rgba(249,249,249,0.2)' }}
          />
        ) : (
          <div
            className="rounded-full flex items-center justify-center select-none"
            style={{
              width:           120,
              height:          120,
              background:      'var(--color-accent)',
              border:          '3px solid rgba(249,249,249,0.15)',
              fontSize:        48,
              fontWeight:      700,
              color:           '#fff',
              letterSpacing:   0,
            }}
          >
            {avatarLetter}
          </div>
        )}

        {/* --- Name + Kids badge --- */}
        <div className="flex flex-col items-center gap-2">
          <h1
            className="font-bold tracking-tight"
            style={{
              color:      'var(--color-text-primary)',
              fontSize:   28,
              lineHeight: 1.1,
            }}
          >
            {activeProfile.name}
          </h1>

          {activeProfile.isKids && (
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-widest"
              style={{
                background: 'var(--color-accent)',
                color:      '#fff',
                letterSpacing: '0.1em',
              }}
            >
              {t('profile.kids')}
            </span>
          )}
        </div>

        {/* --- Member since --- */}
        <p
          className="text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {t('profile.memberSince', { date: formattedDate })}
        </p>

        {/* --- Info card --- */}
        <div
          className="w-full rounded-xl p-5 flex flex-col gap-3"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border:     '1px solid rgba(255,255,255,0.10)',
          }}
        >
          <div className="flex items-center justify-between">
            <span style={{ color: 'var(--color-text-secondary)', fontSize: 13 }}>
              {t('profile.kidsMode')}
            </span>
            <span
              className="font-medium"
              style={{
                color:    activeProfile.isKids ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                fontSize: 13,
              }}
            >
              {activeProfile.isKids ? t('common.ready') : '—'}
            </span>
          </div>
        </div>

        {/* --- Action buttons --- */}
        <div className="w-full flex flex-col gap-3 mt-2">
          <button
            onClick={() => navigate('/profile-select')}
            className="w-full rounded-lg py-3 px-6 font-medium text-sm transition-colors duration-150"
            style={{
              background: 'rgba(255,255,255,0.10)',
              border:     '1px solid rgba(255,255,255,0.10)',
              color:      'var(--color-text-primary)',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.15)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.10)'
            }}
          >
            {t('navbar.switchProfile')}
          </button>

          <button
            onClick={() => navigate('/settings')}
            className="w-full rounded-lg py-3 px-6 font-medium text-sm transition-colors duration-150"
            style={{
              background: 'var(--color-accent)',
              color:      '#fff',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent-hover)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-accent)'
            }}
          >
            {t('common.settings')}
          </button>
        </div>
      </div>
    </div>
  )
}
