// NAME — TitleBar.tsx — Role: Custom title bar (window controls)
// RULES: The bar must be draggable, the buttons must not be.

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Square, Copy, X } from 'lucide-react';

const TitleBar: React.FC = () => {
  const { t } = useTranslation();
  const [isMaximized, setIsMaximized] = React.useState(false);

  React.useEffect(() => {
    const checkMaximized = async () => {
      const maximized = await window.electronAPI?.isMaximized();
      setIsMaximized(maximized ?? false);
    };
    checkMaximized();
    
    // Note: To make this more robust, we would need to listen to
    // an event from the main process when the window is resized.
    // For now, we only update the state on button click.
  }, []);

  const handleMinimize = () => window.electronAPI?.minimizeWindow();
  const handleMaximize = async () => {
    await window.electronAPI?.maximizeWindow();
    const maximized = await window.electronAPI?.isMaximized();
    setIsMaximized(maximized ?? false);
  };
  const handleClose = () => window.electronAPI?.closeWindow();

  return (
    <div
      style={{ WebkitAppRegion: 'drag' }}
      className="fixed top-0 left-0 right-0 h-8 bg-transparent z-50 flex justify-end items-center"
    >
      <div style={{ WebkitAppRegion: 'no-drag' }} className="flex items-center h-full">
        <TitleBarButton onClick={handleMinimize} aria-label={t('window.minimize')}>
          <Minus size={16} />
        </TitleBarButton>
        <TitleBarButton onClick={handleMaximize} aria-label={isMaximized ? t('window.restore') : t('window.maximize')}>
          {isMaximized ? <Copy size={14} /> : <Square size={14} />}
        </TitleBarButton>
        <TitleBarButton onClick={handleClose} aria-label={t('window.close')} className="hover:bg-red-500">
          <X size={16} />
        </TitleBarButton>
      </div>
    </div>
  );
};

// Small helper for the buttons
const TitleBarButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className, ...props }) => {
  const baseClasses = 'h-full w-12 flex items-center justify-center text-white/80 hover:bg-white/20 transition-colors duration-150';
  return (
    <button className={`${baseClasses} ${className || ''}`} {...props}>
      {children}
    </button>
  );
};

export { TitleBar };
