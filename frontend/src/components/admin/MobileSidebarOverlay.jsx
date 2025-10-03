import React, { useEffect } from 'react';

/**
 * Composant overlay pour fermer la sidebar mobile
 * Quand on clique sur l'overlay (zone sombre), la sidebar se ferme
 */
const MobileSidebarOverlay = () => {
  useEffect(() => {
    // Fonction pour fermer la sidebar quand on clique sur l'overlay
    const handleOverlayClick = (e) => {
      if (e.target.classList.contains('pc-sidebar-overlay')) {
        const sidebar = document.querySelector('.pc-sidebar');
        if (sidebar) {
          sidebar.classList.remove('mob-sidebar-active');
        }
      }
    };

    // Écouter les clics sur le document
    document.addEventListener('click', handleOverlayClick);

    // Nettoyer l'écouteur quand le composant est démonté
    return () => {
      document.removeEventListener('click', handleOverlayClick);
    };
  }, []);

  return <div className="pc-sidebar-overlay"></div>;
};

export default MobileSidebarOverlay;