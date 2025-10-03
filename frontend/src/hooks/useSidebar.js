// Alternative dans useSidebar.js
export const useSidebar = () => {
  const toggleSidebar = (e) => {
    e?.preventDefault();
    // Déclencher l'événement attendu par pcoded.js
    const event = new Event('pc-sidebar-toggle');
    document.body.dispatchEvent(event);
  };

  const toggleMobileSidebar = (e) => {
    e?.preventDefault();
    // Déclencher l'événement mobile attendu par pcoded.js
    const event = new Event('pc-mobile-sidebar-toggle');
    document.body.dispatchEvent(event);
  };

  return {
    toggleSidebar,
    toggleMobileSidebar
  };
};