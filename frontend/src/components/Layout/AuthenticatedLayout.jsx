import React from 'react';
import { Outlet } from 'react-router-dom';
import SidebarAdmin from '../admin/SidebarAdmin'; // Assurez-vous que le chemin est correct
import Header from '../Header'; // Si vous avez un composant Header

const AuthenticatedLayout = () => {
    return (
        <>
    <div className="pc-mob-header pc-header">


    </div>
    <div className="pc-sidebar">
      <SidebarAdmin />
    </div>
    <div className="pc-container">
      <div className="pc-content">
        {/* Outlet est l'endroit où le contenu de la route enfant sera rendu */}
        <Outlet />
      </div>
    </div>
    </>
    );
};

export default AuthenticatedLayout;