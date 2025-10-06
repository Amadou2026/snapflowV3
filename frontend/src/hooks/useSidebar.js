// hooks/useSidebar.js
import { useState, useEffect } from 'react';

export const useSidebar = () => {
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [isMobileSidebarActive, setIsMobileSidebarActive] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarHidden(!isSidebarHidden);
    // Fermer la sidebar mobile quand on toggle la desktop
    if (isMobileSidebarActive) {
      setIsMobileSidebarActive(false);
    }
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarActive(!isMobileSidebarActive);
    // Ouvrir la sidebar desktop quand on ferme la mobile
    if (isSidebarHidden && isMobileSidebarActive) {
      setIsSidebarHidden(false);
    }
  };

  // Gérer le redimensionnement de la fenêtre
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsMobileSidebarActive(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isSidebarHidden,
    isMobileSidebarActive,
    toggleSidebar,
    toggleMobileSidebar,
    setIsSidebarHidden,
    setIsMobileSidebarActive
  };
};