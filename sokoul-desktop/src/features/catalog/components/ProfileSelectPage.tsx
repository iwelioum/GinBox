// ProfileSelectPage.tsx — Rôle: Sélection ou création de profil
// RÈGLES : Avec formulaire création

import React, { useState }                   from 'react'
import { useNavigate }                       from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence }           from 'framer-motion'
import { endpoints }                         from '../../../api/client'
import { useProfileStore }                   from '../../../shared/stores/profileStore'
import { TitleBar }                          from '../../../shared/components/layout/TitleBar'
import type { Profile }                      from '../../../shared/types/index'

export default function ProfileSelectPage() {
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
    onError: () => setFormError('Erreur lors de la création du profil.'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setFormError('Le nom est obligatoire.'); return }
    if (name.trim().length > 32) { setFormError('Nom trop long (max 32 caractères).'); return }
    createProfile.mutate({ name: name.trim(), is_kids: kids })
  }

  const handleSelectProfile = (profile: Profile) => {
    setActiveProfile(profile)
    navigate('/')
  }

  return (
    <>
      {/* Contrôles fenêtre Electron — pas de Navbar sur cette page */}
      <TitleBar />

      <div style={{
        minHeight:      '100vh',
        background:     'var(--color-bg-primary)',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        fontFamily:     'var(--font-main)',
      }}>
        {/* Titre */}
        <h1 style={{
          color:        'var(--color-text-primary)',
          fontSize:     'clamp(1.5rem, 4vw, 2.5rem)',
          fontWeight:   700,
          marginBottom: '2.5rem',
          letterSpacing: '-0.02em',
        }}>
          Qui regarde ?
        </h1>

        {/* Grille profils + bouton créer */}
        <div style={{
          display:   'flex',
          flexWrap:  'wrap',
          gap:       '1.5rem',
          justifyContent: 'center',
          maxWidth:  '700px',
        }}>
          {isLoading && (
            <p style={{ color: 'var(--color-text-secondary)' }}>Chargement...</p>
          )}

          {/* Cartes profils existants */}
          {profiles.map((profile) => (
            <motion.button
              key={profile.id}
              onClick={() => handleSelectProfile(profile)}
              whileHover={{ scale: 1.06, y: -4 }}
              whileTap={{ scale: 0.97 }}
              style={{
                background:   'var(--color-bg-glass)',
                border:       '1px solid rgba(255,255,255,0.08)',
                borderRadius: 'var(--radius-card)',
                padding:      '1.5rem 2rem',
                cursor:       'pointer',
                display:      'flex',
                flexDirection:'column',
                alignItems:   'center',
                gap:          '0.75rem',
                minWidth:     '130px',
                backdropFilter: 'blur(20px)',
                color:        'var(--color-text-primary)',
              }}
            >
              {/* Avatar initiale */}
              <div style={{
                width:        64,
                height:       64,
                borderRadius: '50%',
                background:   'var(--color-accent)',
                display:      'flex',
                alignItems:   'center',
                justifyContent: 'center',
                fontSize:     '1.75rem',
                fontWeight:   700,
              }}>
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>
                {profile.name}
              </span>
              {profile.isKids && (
                <span style={{
                  fontSize:     '0.7rem',
                  background:   'rgba(10,132,255,0.2)',
                  color:        'var(--color-accent)',
                  borderRadius: 'var(--radius-pill)',
                  padding:      '2px 8px',
                }}>
                  Enfants
                </span>
              )}
            </motion.button>
          ))}

          {/* Bouton Créer un profil */}
          <motion.button
            onClick={() => setShowForm(true)}
            whileHover={{ scale: 1.06, y: -4 }}
            whileTap={{ scale: 0.97 }}
            style={{
              background:   'rgba(28,28,30,0.4)',
              border:       '2px dashed rgba(255,255,255,0.2)',
              borderRadius: 'var(--radius-card)',
              padding:      '1.5rem 2rem',
              cursor:       'pointer',
              display:      'flex',
              flexDirection:'column',
              alignItems:   'center',
              gap:          '0.75rem',
              minWidth:     '130px',
              color:        'var(--color-text-muted)',
            }}
          >
            <div style={{
              width:        64,
              height:       64,
              borderRadius: '50%',
              border:       '2px dashed rgba(255,255,255,0.2)',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              fontSize:     '2rem',
            }}>
              +
            </div>
            <span style={{ fontSize: '0.95rem' }}>Créer un profil</span>
          </motion.button>
        </div>

        {/* Modal formulaire création */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
              style={{
                position:        'fixed',
                inset:           0,
                background:      'var(--color-bg-overlay)',
                backdropFilter:  'blur(8px)',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                zIndex:          200,
              }}
            >
              <motion.form
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1,    opacity: 1 }}
                exit={{ scale: 0.92,    opacity: 0 }}
                transition={{ type: 'spring', damping: 22, stiffness: 300 }}
                onClick={(e) => e.stopPropagation()}
                onSubmit={handleSubmit}
                style={{
                  background:    'var(--color-bg-glass)',
                  border:        '1px solid rgba(255,255,255,0.1)',
                  borderRadius:  'var(--radius-modal)',
                  padding:       '2.5rem',
                  width:         '100%',
                  maxWidth:      '400px',
                  display:       'flex',
                  flexDirection: 'column',
                  gap:           '1.25rem',
                }}
              >
                <h2 style={{ color: 'var(--color-text-primary)', fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>
                  Nouveau profil
                </h2>

                {/* Champ nom */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                    Nom du profil
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex : Iliesse"
                    autoFocus
                    maxLength={32}
                    style={{
                      background:   'var(--color-bg-card)',
                      border:       '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 'var(--radius-button)',
                      padding:      '0.75rem 1rem',
                      color:        'var(--color-text-primary)',
                      fontSize:     '1rem',
                      outline:      'none',
                    }}
                  />
                </div>

                {/* Toggle mode enfants */}
                <label style={{
                  display:     'flex',
                  alignItems:  'center',
                  gap:         '0.75rem',
                  cursor:      'pointer',
                  color:       'var(--color-text-secondary)',
                  fontSize:    '0.9rem',
                }}>
                  <div
                    onClick={() => setKids(!kids)}
                    style={{
                      width:        '44px',
                      height:       '26px',
                      borderRadius: 'var(--radius-pill)',
                      background:   kids ? 'var(--color-accent)' : 'rgba(255,255,255,0.15)',
                      position:     'relative',
                      transition:   'background 200ms',
                      flexShrink:   0,
                      cursor:       'pointer',
                    }}
                  >
                    <div style={{
                      position:   'absolute',
                      top:        '3px',
                      left:       kids ? '21px' : '3px',
                      width:      '20px',
                      height:     '20px',
                      borderRadius: '50%',
                      background: 'var(--color-text-primary)',
                      transition: 'left 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }} />
                  </div>
                  Mode enfants
                </label>

                {/* Erreur */}
                {formError && (
                  <p style={{ color: '#ff453a', fontSize: '0.85rem', margin: 0 }}>
                    {formError}
                  </p>
                )}

                {/* Boutons */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setFormError(null) }}
                    style={{
                      flex:         1,
                      padding:      '0.75rem',
                      borderRadius: 'var(--radius-pill)',
                      background:   'rgba(255,255,255,0.08)',
                      border:       'none',
                      color:        'var(--color-text-primary)',
                      cursor:       'pointer',
                      fontSize:     '0.95rem',
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={createProfile.isPending}
                    style={{
                      flex:         1,
                      padding:      '0.75rem',
                      borderRadius: 'var(--radius-pill)',
                      background:   createProfile.isPending ? 'rgba(10,132,255,0.4)' : 'var(--color-accent)',
                      border:       'none',
                      color:        'var(--color-text-primary)',
                      cursor:       createProfile.isPending ? 'not-allowed' : 'pointer',
                      fontSize:     '0.95rem',
                      fontWeight:   600,
                    }}
                  >
                    {createProfile.isPending ? 'Création...' : 'Créer'}
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
