// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate, Link } from 'react-router-dom';
// import { toast } from 'react-toastify';
// import api from '../../services/api';
// import HeaderAdmin from '../admin/HeaderAdmin';
// import SidebarAdmin from '../admin/Societe/SidebarAdmin';
// import FooterAdmin from '../admin/FooterAdmin';
// import { AuthContext } from '../../context/AuthContext';

// const TemplateSociete = ({ user, logout }) => {
//     const { isAuthenticated } = useContext(AuthContext);
//     const { societeId, projetId } = useParams();
//     const navigate = useNavigate();

//     const [societe, setSociete] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const [activeTab, setActiveTab] = useState('overview');

//     useEffect(() => {
//         if (isAuthenticated && (societeId || projetId)) {
//             fetchSocieteDetails();
//         }
//     }, [isAuthenticated, societeId, projetId]);

//     const fetchSocieteDetails = async () => {
//         try {
//             setLoading(true);
//             setError(null);

//             let url;
//             if (societeId) {
//                 url = `/societe/${societeId}/`;
//             } else if (projetId) {
//                 // Si nous avons un projetId, nous devons d'abord trouver la société associée
//                 try {
//                     // D'abord, essayer de trouver le projet
//                     const projetResponse = await api.get(`/projets/${projetId}/`);
//                     const projet = projetResponse.data;

//                     // Si le projet a des sociétés, utiliser la première
//                     if (projet.societes && projet.societes.length > 0) {
//                         url = `/societe/${projet.societes[0].id}/`;
//                     } else {
//                         throw new Error('Aucune société associée à ce projet');
//                     }
//                 } catch (err) {
//                     console.error('Erreur lors de la recherche de la société pour le projet:', err);
//                     throw err;
//                 }
//             }

//             const response = await api.get(url);
//             setSociete(response.data);

//             console.log('Détails société:', response.data);
//         } catch (err) {
//             console.error('Erreur lors du chargement des détails de la société:', err);
//             setError('Erreur lors du chargement des détails de la société');

//             if (err.response?.status === 3) {
//                 toast.error("Vous n'avez pas les permissions pour voir cette société");
//             } else if (err.response?.status === 4) {
//                 toast.error("Société non trouvée");
//             }
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleDeleteSociete = async () => {
//         if (!societe) return;

//         const result = window.confirm(
//             `Êtes-vous sûr de vouloir supprimer la société "${societe.nom}" ? Cette action est irréversible !`
//         );

//         if (result) {
//             try {
//                 await api.delete(`/societe/${societe.id}/`);
//                 toast.success('Societe supprimée avec succès');
//                 navigate('/admin/core/societe/');
//             } catch (error) {
//                 console.error('Erreur lors de la suppression:', error);
//                 toast.error('Erreur lors de la suppression de la société');
//             }
//         };

//         const formatDate = (dateString) => {
//             if (!dateString) return 'div className="text-muted">Non spécifiée</div>'
//             const date = new Date(dateString);
//             return date.toLocaleDateString('fr-FR', {
//                 day: '2-digit',
//                 month: '2-digit',
//                 year: 'numeric',
//                 hour: '2-digit',
//                 minute: '2-digit'
//             });
//         };

//         const StatCard = ({ icon, title, value, color = 'primary', iconColor = 'primary' }) => (
//             <div className="col-xl-3 col-md-6 mb-4">
//                 <div className="card stats-card">
//                     <div className="card-body">
//                         <div className="d-flex align-items-center">
//                             <div className="flex-grow-1">
//                                 <h4 className="mb-0">{value}</h4>
//                                 <p className="text-muted mb-0">{title}</p>
//                             </div>
//                             <div className="flex-shrink-0">
//                                 <div className={`avatar-sm rounded-circle bg-${color} bg-opacity-10`}>
//                                     <i className={`ti ti-${icon} text-${iconColor} font-24`}></i>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         );

//         const InfoCard = ({ title, children, icon = 'ti ti-info-circle' }) => (
//             <div className="col-xl-6 col-md-6 mb-4">
//                 <div className="card">
//                     <div className="card-header d-flex justify-content-between">
//                         <h6 className="mb-0">
//                             <i className={`${icon} me-2`}></i>
//                             {title}
//                         </h6>
//                     </div>
//                     <div className="card-body">
//                         {children}
//                     </div>
//                 </div>
//             </div>
//         );

//         const ActionButton = ({
//             icon,
//             label,
//             onClick,
//             color = 'primary',
//             disabled = false,
//             size = 'sm'
//         }) => (
//             <button
//                 className={`btn btn-${color} ${size === 'sm' ? 'btn-sm' : ''}`}
//                 onClick={onClick}
//                 disabled={disabled}
//             >
//                 <i className={`ti ti-${icon} me-1`}></i>
//                 {label}
//             </button>
//         );

//         if (loading) {
//             return (
//                 <>
//                     <div className="dashboard-wrapper">
//                         <HeaderAdmin user={user} logout={logout} />
//                         <div className="main-container">
//                             <SidebarAdmin />
//                             <div className="page-wrapper">
//                                 <div className="pc-content">
//                                     <div className="text-center p-5">
//                                         <div className="spinner-border text-primary" role="status">
//                                             <span className="visually-hidden">Chargement...</span>
//                                         </div>
//                                         <p className="mt-3 text-muted">Chargement des détails de la société...</p>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                     <FooterAdmin />
//                 </>
//             );
//         }

//         if (error) {
//             return (
//                 <div className="dashboard-wrapper">
//                     <HeaderAdmin user={user} logout={logout} />
//                     <div className="main-container">
//                         <SidebarAdmin />
//                         <div className="page-wrapper">
//                             <div className="pc-content">
//                                 <div className="text-center p-5">
//                                     <div className="alert alert-danger" role="alert">
//                                         <h4 className="alert-heading">Erreur</h4>
//                                         <p className="message mb-0">{error}</p>
//                                         <button
//                                             className="btn btn-outline-danger mt-3"
//                                             onClick={() => navigate('/admin/core/societe/')}
//                                         >
//                                             Retour à la liste
//                                         </button>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                     <FooterAdmin />
//                 </div>
//             );
//         }

//         return (<>
//             <div className="dashboard-wrapper">
//                 <HeaderAdmin user={user} logout={logout} />
//                 <div className="main-container">
//                     <SidebarAdmin />
//                     <div className="page-wrapper">
//                         <div className="pc-content">
//                             {/* Breadcrumb */}
//                             <div className="page-header">
//                                 <div className="page-block">
//                                     <div className="row align-items-center">
//                                         <div className="col-md-12">
//                                             <ul className="breadcrumb">
//                                                 <li className="breadcrumb-item">
//                                                     <Link to="/dashboard">Accueil</Link>
//                                                 </li>
//                                                 <li className="breadcrumb-item">
//                                                     <Link to="/dashboard">Dashboard</Link>
//                                                 </li>
//                                                 <li className="breadcrumb-item">
//                                                     <Link to="/admin/core/societe/">Sociétés</Link>
//                                                 </li>
//                                                 <li className="breadcrumb-item" aria-current="page">
//                                                     {societe?.nom || 'Détails société'}
//                                                     {projetId && (
//                                                         <span className="text-muted">
//                                                             (via projet: {societe.projets?.find(p => p.id === parseInt(projetId))?.nom || 'Projet inconnu'})
//                                                         </span>
//                                                     )}
//                                                 </li>
//                                             </ul>
//                                         </div>
//                                         <div className="col-md-12">
//                                             <div className="page-header-title d-flex justify-content-between align-items-center">
//                                                 <div>
//                                                     <h2 className="mb-0">
//                                                         {societe?.nom || 'Détails société'}
//                                                         {projetId && (
//                                                             <span className="badge bg-info ms-2">
//                                                                 Accès via projet
//                                                             </span>
//                                                         )}
//                                                     </h2>
//                                                     <p className="text-muted mb-0">
//                                                         {societe?.secteur_activite || 'Non spécifié'}
//                                                     </p>
//                                                 </div>
//                                                 <div className="d-flex gap-2">
//                                                     <ActionButton
//                                                         icon="edit"
//                                                         label="Modifier"
//                                                         onClick={() => navigate(`/admin/core/societe/${societe.id}/edit/`)}
//                                                     />
//                                                     <ActionButton
//                                                         icon="trash"
//                                                         label="Supprimer"
//                                                         color="danger"
//                                                         onClick={handleDeleteSociete}
//                                                     />
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     </div>
//                                 </div>

//                                 {/* Indicateur d'accès via projet si applicable */}
//                                 {projetId && (
//                                     <div className="alert alert-info alert-dismissible fade show mb-4" role="alert">
//                                         <div className="d-flex align-items-center">
//                                             <i className="ti ti-info-circle me-2"></i>
//                                             <div className="flex-grow-1">
//                                                 <strong>Accès via projet</strong>
//                                                 <p className="mb-0">
//                                                     Vous consultez les détails de la société associée au projet.
//                                                 </p>
//                                             </div>
//                                             <button
//                                                 type="button"
//                                                 className="btn-close"
//                                                 data-bs-dismiss="alert"
//                                                 aria-label="Close"
//                                                 onClick={() => {
//                                                     // Option: naviguer directement vers la société
//                                                     if (societe?.id) {
//                                                         navigate(`/admin/core/societe/${societe.id}`);
//                                                     }
//                                                 }}
//                                             >
//                                                 <span aria-hidden="true">&times;</span>
//                                             </button>
//                                         </div>
//                                     </div>
//                                 )}

//                                 {/* Navigation par onglets */}
//                                 <div className="row mb-4">
//                                     <div className="col-12">
//                                         <ul className="nav nav-tabs nav-tabs">
//                                             <li className="nav-item">
//                                                 <button
//                                                     className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
//                                                     onClick={() => setActiveTab('overview')}
//                                                 >
//                                                     <i className="ti ti-layout-grid me-2"></i>
//                                                     Vue d'ensemble
//                                                 </button>
//                                             </li>
//                                             <li className="nav-item">
//                                                 <button
//                                                     className={`nav-link ${activeTab === 'projets' ? 'active' : ''}`}
//                                                     onClick={() => setActiveTab('projets')}
//                                                 >
//                                                     <i className="ti ti-folder me-2"></i>
//                                                     Projets ({societe?.nombre_projets || 0})
//                                                 </button>
//                                             </li>
//                                             <li className="nav-item">
//                                                 <button
//                                                     className={`nav-link ${activeTab === 'employes' ? 'active' : ''}`}
//                                                     onClick={() => setActiveTab('employes')}
//                                                 >
//                                                     <i className="ti ti-users me-2"></i>
//                                                     Employés ({societe?.nombre_employes || 0})
//                                                 </button>
//                                             </li>
//                                         </ul>
//                                     </div>

//                                     {/* Vue d'ensemble */}
//                                     {activeTab === 'overview' && (
//                                         <>
//                                             {/* Cartes de statistiques */}
//                                             <div className="row mb-4">
//                                                 <StatCard
//                                                     icon="building"
//                                                     title="Projets"
//                                                     value={societe?.nombre_projets || 0}
//                                                     color="primary"
//                                                 />
//                                                 <StatCard
//                                                     icon="users"
//                                                     title="Employés"
//                                                     value={societe?.nombre_employes || 0}
//                                                     color="info"
//                                                 />
//                                             </div>

//                                             {/* Informations générales */}
//                                             <div className="row mb-4">
//                                                 <InfoCard title="Informations générales">
//                                                     <div className="row">
//                                                         <div className="col-md-6">
//                                                             <p className="mb-2">
//                                                                 <strong>Nom:</strong> {societe?.nom || 'N/A'}
//                                                             </p>
//                                                         </div>
//                                                         <div className="col-md-6">
//                                                             <p className="mb-2">
//                                                                 <strong>SIRET:</strong> {societe?.num_siret || 'N/A'}
//                                                             </p>
//                                                         </div>
//                                                     </div>
//                                                     <div className="col-md-6">
//                                                         <p className="mb-2">
//                                                             <strong>Secteur:</strong> {societe?.secteur_activite || 'N/A'}
//                                                         </p>
//                                                     </div>
//                                             </div>
//                                             <div className="col-md-6">
//                                                 <p className="mb-2">
//                                                     <strong>URL:</strong>
//                                                     {societe?.url ? (
//                                                         <a
//                                                             href={societe.url}
//                                                             target="_blank"
//                                                             rel="noopener noreferrer"
//                                                             className="text-primary"
//                                                         >
//                                                             {societe.url}
//                                                         </a>
//                                                     ) : 'N/A'}
//                                                 </p>
//                                             </div>
//                                         </InfoCard>

//                                     {/* Informations de l'administrateur */}
//                                     {societe?.admin && (
//                                         <InfoCard
//                                             title="Administrateur"
//                                             icon="ti ti-user-check"
//                                         >
//                                             <div className="d-flex align-items-center">
//                                                 <div className="flex-shrink-0">
//                                                     <div className="avatar-sm rounded-circle bg-primary bg-opacity-10 me-3">
//                                                         <i className="ti ti-user text-primary"></i>
//                                                     </div>
//                                                 </div>
//                                                 <div className="flex-grow-1 ms-3">
//                                                     <h6 className="mb-0">{societe.admin.full_name}</h6>
//                                                     <p className="text-muted mb-0">{societe.admin.email}</p>
//                                                 </div>
//                                             </div>
//                                         </InfoCard>
//                                     )}

//                                     {/* Dates */}
//                                     <InfoCard title="Dates">
//                                         <div className="row">
//                                             <div className="col-md-6">
//                                                 <p className="mb-2">
//                                                     <strong>Création:</strong>
//                                                 </p>
//                                                 <p className="text-muted">{formatDate(societe?.date_creation)}</p>
//                                             </div>
//                                             <div className="col-md-6">
//                                                 <p className="mb-2">
//                                                     <strong>Dernière modification:</strong>
//                                                 </p>
//                                                 <p className="text-muted">{formatDate(societe?.date_modification)}</p>
//                                             </div>
//                                         </div>
//                                     </InfoCard>
//                                 </div>
//                             </>
//               )}

//                             {/* Onglet Projets */}
//                             {activeTab === 'projets' && (
//                                 <div className="row">
//                                     <div className="col-12">
//                                         <div className="card">
//                                             <div className="card-header">
//                                                 <h5 className="mb-0">
//                                                     <i className="ti ti-folder me-2"></i>
//                                                     Projets de la société
//                                                 </h5>
//                                             </div>
//                                             <div className="card-body">
//                                                 {societe?.projets?.length > 0 ? (
//                                                     <div className="table-responsive">
//                                                         <table className="table table-hover">
//                                                             <thead>
//                                                                 <tr>
//                                                                     <th>Nom</th>
//                                                                     <th>Charge de compte</th>
//                                                                     <th>Sociétés</th>
//                                                                     <th>Actions</th>
//                                                                 </tr>
//                                                             </thead>
//                                                             <tbody>
//                                                                 {societe.projets.map((projet) => (
//                                                                     <tr key={projet.id}>
//                                                                         <td>
//                                                                             <div className="d-flex align-items-center">
//                                                                                 {projet.logo && (
//                                                                                     <img
//                                                                                         src={projet.logo}
//                                                                                         alt={projet.nom}
//                                                                                         className="rounded me-2"
//                                                                                         style={{ width: '30px', height: '30px' }}
//                                                                                     />
//                                                                                 )}
//                                                                                 <strong>{projet.nom}</strong>
//                                                                         </td>
//                                                                         <td>
//                                                                             {projet.charge_de_compte_nom ? (
//                                                                                 <div>
//                                                                                     <strong>{projet.charge_de_compte_nom}</strong>
//                                                                                     <br />
//                                                                                     <small className="text-muted">{projet.charge_de_compte_email}</small>
//                                                                                 </div>
//                                                                             ) : (
//                                                                                 <span className="text-muted">Non assigné</span>
//                                                                             )}
//                                                                         </td>
//                                                                         <td>
//                                                                             <span className="badge bg-light-primary">
//                                                                                 {projet.nombre_societes || 1} société(s)
//                                                                             </span>
//                                                                         </td>
//                                                                         <td>
//                                                                             <div className="btn-group">
//                                                                                 <ActionButton
//                                                                                     icon="eye"
//                                                                                     label="Voir"
//                                                                                     onClick={() => navigate(`/admin/core/projet/${projet.id}/`)}
//                                                                                     size="sm"
//                                                                                 />
//                                                                             </div>
//                                                                         </td>
//                                                                     </tr>
//                                                                 ))}
//                                                             </tbody>
//                                                         </table>
//                                                     </div>
//                                                 ) : (
//                                                     <div className="text-center py-4">
//                                                         <i className="ti ti-folder-off text-muted mb-3" style={{ fontSize: '3rem' }}></i>
//                                                         <p className="text-muted">Aucun projet associé à cette société</p>
//                                                     </div>
//                                                 )}
//                                             </div>
//                                         </div>
//                                     </div>
//               )}

//                                     {/* Onglet Employés */}
//                                     {activeTab === 'employes' && (
//                                         <div className="row">
//                                             <div className="col-12">
//                                                 <div className="card">
//                                                     <div className="card-header">
//                                                         <h5 className="mb-0">
//                                                             <i className="ti ti-users me-2"></i>
//                                                             Employés de la société
//                                                         </h5>
//                                                     </div>
//                                                     <div className="card-body">
//                                                         {societe?.employes?.length > 0 ? (
//                                                             <div className="table-responsive">
//                                                                 <table className="table table-hover">
//                                                                     <thead>
//                                                                         <tr>
//                                                                             <th>Nom</th>
//                                                                             <th>Email</th>
//                                                                             <th>Rôle</th>
//                                                                             <th>Actions</th>
//                                                                         </tr>
//                                                                     </thead>
//                                                                     <tbody>
//                                                                         {societe.employes.map((employe) => (
//                                                                             <tr key={employe.id}>
//                                                                                 <td>
//                                                                                     <div className="d-flex align-items-center">
//                                                                                         <div className="avatar-sm rounded-circle bg-info bg-opacity-10 me-3">
//                                                                                             <i className="ti ti-user text-info"></i>
//                                                                                         </div>
//                                                                                     </div>
//                                                                                     <div>
//                                                                                         <strong>{employe.full_name}</strong>
//                                                                                     </div>
//                                                                                 </td>
//                                                                                 <td>
//                                                                                     <span className="text-muted">{employe.email}</span>
//                                                                                 </td>
//                                                                                 <td>
//                                                                                     <span className="badge bg-light-secondary">
//                                                                                         {employe.groups?.map(g => g.name).join(', ') || 'Aucun rôle'}
//                                                                                     </span>
//                                                                                 </td>
//                                                                                 <td>
//                                                                                     <div className="btn-group">
//                                                                                         <ActionButton
//                                                                                             icon="eye"
//                                                                                             label="Voir"
//                                                                                             onClick={() => navigate(`/admin/core/user/${employe.id}/`)}
//                                                                                             size="sm"
//                                                                                         />
//                                                                                     </div>
//                                                                                 </div>
//                                                                             </td>
//                                           </tr>
//                                 ))}
//                                                                 </tbody>
//                                                             </table>
//                           </div>
//                                                     ) : (
//                                                     <div className="text-center py-4">
//                                                         <i className="ti ti-users text-muted mb-3" style={{ fontSize: '3rem' }}></i>
//                                                         <p className="text-muted">Aucun employé associé à cette société</p>
//                                                     </div>
//                                                 </div>
//                                             </div>
//                                         </div>
//                                     )}
//                                 </div>
//           </div>
//                     </div>
//                     <FooterAdmin />
//                 </div>
//             </>
//             );
            
// };

//             export default TemplateSociete;