import React from 'react';
import { Link } from 'react-router-dom';

const Sidebar = () => (
  <div style={{ width: '200px', background: '#eee', padding: '20px', minHeight: '100vh' }}>
    <h3>Menu</h3>
    <ul style={{ listStyle: 'none', padding: 0 }}>
      <li><Link to="/dashboard">Accueil</Link></li>
      <li><Link to="/dashboard/societe/create">Créer Société</Link></li>
      {/* Ajouter d'autres liens CRUD */}
    </ul>
  </div>
);

export default Sidebar;
