module.exports = {
  appId:       'com.sokoul.desktop',
  productName: 'Sokoul',
  directories: { output: 'dist-electron' },
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    icon:   'public/assets/icon.ico',
  },
  nsis: {
    oneClick:   false,
    allowToChangeInstallationDirectory: true,
    installerLanguages: ['fr_FR'],
  },
  extraResources: [
    // MPV bundlé (obligatoire — pas de PATH système)
    { from: 'mpv/', to: 'mpv/', filter: ['mpv.exe'] },
    // Backend Rust compilé
    { from: '../sokoul-backend/target/release/sokoul-backend.exe',
      to: 'sokoul-backend/sokoul-backend.exe' },
    // Migrations SQL
    { from: '../sokoul-backend/migrations/', to: 'sokoul-backend/migrations/' },
    // .env (l'utilisateur remplit ses clés une seule fois)
    { from: '../sokoul-backend/.env', to: 'sokoul-backend/.env' },
  ],
}