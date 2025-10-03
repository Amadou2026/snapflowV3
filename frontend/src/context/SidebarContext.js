// context/SidebarContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const SidebarContext = createContext();

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
  const [isMobileSidebarActive, setIsMobileSidebarActive] = useState(false);

  // Initialiser depuis le localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-hidden');
    if (savedState === 'true') {
      setIsSidebarHidden(true);
    }
  }, []);

  // Gérer les classes CSS sur le body
  useEffect(() => {
    const body = document.body;
    
    if (isSidebarHidden) {
      body.classList.add('pc-sidebar-hide');
      body.classList.remove('pc-sidebar-mobile-active');
    } else {
      body.classList.remove('pc-sidebar-hide');
    }
    
    localStorage.setItem('sidebar-hidden', isSidebarHidden);
  }, [isSidebarHidden]);

  useEffect(() => {
    const body = document.body;
    
    if (isMobileSidebarActive) {
      body.classList.add('pc-sidebar-mobile-active');
    } else {
      body.classList.remove('pc-sidebar-mobile-active');
    }
  }, [isMobileSidebarActive]);

  const toggleSidebar = () => {
    setIsSidebarHidden(prev => !prev);
    setIsMobileSidebarActive(false);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarActive(prev => !prev);
    if (!isMobileSidebarActive) {
      setIsSidebarHidden(false);
    }
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarActive(false);
  };

  const value = {
    isSidebarHidden,
    isMobileSidebarActive,
    toggleSidebar,
    toggleMobileSidebar,
    closeMobileSidebar
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};