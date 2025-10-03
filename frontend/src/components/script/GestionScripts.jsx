import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AjouterScriptModal from './modals/AjouterScriptModal';
import ModifierScriptModal from './modals/ModifierScriptModal';
import ViewScriptModal from './modals/ViewScriptModal';
import HeaderAdmin from '../admin/HeaderAdmin';
import SidebarAdmin from '../admin/SidebarAdmin';
import FooterAdmin from '../admin/FooterAdmin';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const GestionScripts = ({ user, logout }) => {
    const [scripts, setScripts] = useState([]);
    const [filteredScripts, setFilteredScripts] = useState([]);
    const [projets, setProjets] = useState([]); // Projets affectés à l'utilisateur
    const [axes, setAxes] = useState([]);
    const [sousAxes, setSousAxes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedScript, setSelectedScript] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedProjet, setSelectedProjet] = useState('all'); // Projet sélectionné dans le filtre

    // Options de priorité
    const priorityOptions = {
        1: { label: 'Basse', class: 'bg-light-secondary' },
        2: { label: 'Normale', class: 'bg-light-info' },
        3: { label: 'Haute', class: 'bg-light-warning' },
        4: { label: 'Urgente', class: 'bg-light-danger' },
        5: { label: 'Immédiate', class: 'bg-danger' }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const fetchData = async () => {
        try {
            // Charger toutes les données de base
            const [scriptsResponse, projetsResponse, axesResponse, sousAxesResponse] = await Promise.all([
                api.get('scripts/'),
                api.get('projets/'), // Cette API renvoie déjà les projets de l'utilisateur
                api.get('axes/'),
                api.get('sous-axes/')
            ]);

            setScripts(scriptsResponse.data);
            setProjets(projetsResponse.data); // Projets affectés à l'utilisateur
            setAxes(axesResponse.data);
            setSousAxes(sousAxesResponse.data);

            console.log('📊 Données chargées:', {
                scripts: scriptsResponse.data.length,
                projets: projetsResponse.data,
                user: user
            });

        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            showErrorAlert('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    // Filtrer les scripts quand la sélection de projet change
    useEffect(() => {
        if (selectedProjet === 'all') {
            // Afficher tous les scripts des projets de l'utilisateur
            const filtered = scripts.filter(script => {
                const scriptProjetId = getProjetId(script.projet);
                return projets.some(projet => projet.id === scriptProjetId);
            });
            setFilteredScripts(filtered);
        } else {
            // Filtrer par projet spécifique
            const projetId = parseInt(selectedProjet);
            const filtered = scripts.filter(script => {
                const scriptProjetId = getProjetId(script.projet);
                return scriptProjetId === projetId;
            });
            setFilteredScripts(filtered);
        }
    }, [scripts, selectedProjet, projets]);

    // Gestion du changement de filtre
    const handleProjetFilterChange = (projetId) => {
        setSelectedProjet(projetId);
    };

    const handleDeleteScript = async (scriptId) => {
        const script = scripts.find(s => s.id === scriptId);
        
        const result = await MySwal.fire({
            title: 'Êtes-vous sûr ?',
            html: `Vous êtes sur le point de supprimer le script <strong>"${script?.nom}"</strong>. Cette action est irréversible !`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Oui, supprimer !',
            cancelButtonText: 'Annuler',
            reverseButtons: true,
            customClass: {
                confirmButton: 'btn btn-danger',
                cancelButton: 'btn btn-secondary'
            }
        });

        if (result.isConfirmed) {
            try {
                await api.delete(`scripts/${scriptId}/`);
                
                const updatedScripts = scripts.filter(script => script.id !== scriptId);
                setScripts(updatedScripts);
                
                await MySwal.fire({
                    title: 'Supprimé !',
                    text: 'Le script a été supprimé avec succès.',
                    icon: 'success',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'OK'
                });
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                showErrorAlert('Erreur lors de la suppression du script');
            }
        }
    };

    const handleEditScript = (script) => {
        // Vérifier les permissions pour l'édition
        const scriptProjetId = getProjetId(script.projet);
        const canModify = user.is_superuser || projets.some(p => p.id === scriptProjetId);
        
        if (!canModify) {
            showErrorAlert('Vous n\'avez pas la permission de modifier ce script');
            return;
        }
        setSelectedScript(script);
        setShowEditModal(true);
    };

    const handleViewScript = (script) => {
        // Vérifier les permissions pour la visualisation
        const scriptProjetId = getProjetId(script.projet);
        const canView = user.is_superuser || projets.some(p => p.id === scriptProjetId);
        
        if (!canView) {
            showErrorAlert('Vous n\'avez pas la permission de voir ce script');
            return;
        }
        setSelectedScript(script);
        setShowViewModal(true);
    };

    const handleScriptAdded = (newScript) => {
        const updatedScripts = [...scripts, newScript];
        setScripts(updatedScripts);
        setShowAddModal(false);
        
        MySwal.fire({
            title: 'Succès !',
            text: 'Le script a été créé avec succès.',
            icon: 'success',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK'
        });
    };

    const handleScriptUpdated = (updatedScript) => {
        const updatedScripts = scripts.map(script =>
            script.id === updatedScript.id ? updatedScript : script
        );
        setScripts(updatedScripts);
        setShowEditModal(false);
        setSelectedScript(null);
        
        MySwal.fire({
            title: 'Succès !',
            text: 'Le script a été modifié avec succès.',
            icon: 'success',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK'
        });
    };

    const showErrorAlert = (message) => {
        MySwal.fire({
            title: 'Erreur !',
            text: message,
            icon: 'error',
            confirmButtonColor: '#d33',
            confirmButtonText: 'OK'
        });
    };

    const showInfoAlert = (message) => {
        MySwal.fire({
            title: 'Information',
            text: message,
            icon: 'info',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK'
        });
    };

    // Fonctions pour récupérer les IDs des relations
    const getProjetId = (projet) => {
        if (!projet) return null;
        
        // Si projet est un objet, utiliser son ID
        if (typeof projet === 'object') {
            return projet.id;
        }
        
        // Si projet est déjà un ID, le retourner
        return projet;
    };

    const getProjetName = (projet) => {
        if (!projet) return 'Projet inconnu';
        
        // Si projet est un objet, utiliser son nom
        if (typeof projet === 'object') {
            return projet.nom || 'Projet inconnu';
        }
        
        // Si projet est un ID, chercher dans la liste
        const projetObj = projets.find(p => p.id === projet);
        return projetObj ? projetObj.nom : 'Projet inconnu';
    };

    const getAxeName = (axe) => {
        if (!axe) return 'Axe inconnu';
        
        if (typeof axe === 'object') {
            return axe.nom || 'Axe inconnu';
        }
        
        const axeObj = axes.find(a => a.id === axe);
        return axeObj ? axeObj.nom : 'Axe inconnu';
    };

    const getSousAxeName = (sousAxe) => {
        if (!sousAxe) return 'Sous-axe inconnu';
        
        if (typeof sousAxe === 'object') {
            return sousAxe.nom || 'Sous-axe inconnu';
        }
        
        const sousAxeObj = sousAxes.find(sa => sa.id === sousAxe);
        return sousAxeObj ? sousAxeObj.nom : 'Sous-axe inconnu';
    };

    // Fonction pour télécharger le fichier
    const handleDownload = (script) => {
        if (script.fichier) {
            window.open(script.fichier, '_blank');
        }
    };

    // Vérifier si l'utilisateur peut ajouter des scripts
    const canAddScript = user.is_superuser || projets.length > 0;

    if (loading) {
        return (
            <div className="dashboard-wrapper">
                <HeaderAdmin user={user} logout={logout} />
                <div className="main-container">
                    <SidebarAdmin />
                    <div className="page-wrapper">
                        <div className="pc-content">
                            <div className="text-center p-5">
                                <div className="spinner-border" role="status">
                                    <span className="visually-hidden">Chargement...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <FooterAdmin />
            </div>
        );
    }

    return (
        <div className="dashboard-wrapper">
            <HeaderAdmin user={user} logout={logout} />

            <div className="main-container">
                <SidebarAdmin />

                <div className="page-wrapper">
                    <div className="pc-container">
                        <div className="pc-content">
                            {/* Breadcrumb */}
                            <div className="page-header">
                                <div className="page-block">
                                    <div className="row align-items-center">
                                        <div className="col-md-12">
                                            <ul className="breadcrumb">
                                                <li className="breadcrumb-item">
                                                    <Link to="/dashboard">Accueil</Link>
                                                </li>
                                                <li className="breadcrumb-item">
                                                    <Link to="/dashboard">Dashboard</Link>
                                                </li>
                                                <li className="breadcrumb-item" aria-current="page">
                                                    Gestion des scripts
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="page-header-title">
                                                <h2 className="mb-0">Gestion des scripts</h2>
                                                {projets.length > 0 && (
                                                    <p className="text-muted mb-0">
                                                        {user.is_superuser 
                                                            ? 'Super Admin - Tous les projets accessibles' 
                                                            : `Vos projets: ${projets.map(p => p.nom).join(', ')}`
                                                        }
                                                    </p>
                                                )}
                                                {user.is_superuser && (
                                                    <p className="text-success mb-0">
                                                        <i className="ti ti-shield-check me-1"></i>
                                                        Mode Super Admin - Tous les scripts visibles
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* End Breadcrumb */}

                            {/* Filtre par projet */}
                            <div className="row mb-4">
                                <div className="col-sm-12">
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="row align-items-center">
                                                <div className="col-md-6">
                                                    <h6 className="mb-0">
                                                        <i className="ti ti-filter me-2"></i>
                                                        Filtre par projet
                                                    </h6>
                                                </div>
                                                <div className="col-md-6">
                                                    <select 
                                                        className="form-select"
                                                        value={selectedProjet}
                                                        onChange={(e) => handleProjetFilterChange(e.target.value)}
                                                    >
                                                        <option value="all">
                                                            {user.is_superuser ? 'Tous les projets' : 'Tous mes projets'}
                                                        </option>
                                                        {projets.map(projet => (
                                                            <option key={projet.id} value={projet.id}>
                                                                {projet.nom}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="row">
                                <div className="col-sm-12">
                                    <div className="card table-card">
                                        <div className="card-body">
                                            <div className="text-end p-4 pb-0">
                                                {canAddScript ? (
                                                    <button
                                                        className="btn btn-primary d-inline-flex align-items-center"
                                                        onClick={() => setShowAddModal(true)}
                                                    >
                                                        <i className="ti ti-plus f-18"></i> Ajouter un Script
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn btn-secondary d-inline-flex align-items-center"
                                                        disabled
                                                        title="Vous devez être associé à un projet pour ajouter des scripts"
                                                    >
                                                        <i className="ti ti-plus f-18"></i> Ajouter un Script
                                                    </button>
                                                )}
                                            </div>

                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Nom</th>
                                                            <th>Projet</th>
                                                            <th>Axe / Sous-axe</th>
                                                            <th>Fichier</th>
                                                            <th>Priorité</th>
                                                            <th className="text-center">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filteredScripts.map((script, index) => {
                                                            const scriptProjetId = getProjetId(script.projet);
                                                            const canModify = user.is_superuser || projets.some(p => p.id === scriptProjetId);
                                                            
                                                            return (
                                                                <tr key={script.id}>
                                                                    <td>{index + 1}</td>
                                                                    <td>
                                                                        <div className="row align-items-center">
                                                                            <div className="col-auto pe-0">
                                                                                <div className="wid-40 hei-40 rounded-circle bg-success d-flex align-items-center justify-content-center">
                                                                                    <i className="ti ti-file-code text-white"></i>
                                                                                </div>
                                                                            </div>
                                                                            <div className="col">
                                                                                <h6 className="mb-0">{script.nom}</h6>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        <span className="badge bg-primary">
                                                                            {getProjetName(script.projet)}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <div>
                                                                            <small className="text-muted d-block">
                                                                                Axe: {getAxeName(script.axe)}
                                                                            </small>
                                                                            <small className="text-muted">
                                                                                Sous-axe: {getSousAxeName(script.sous_axe)}
                                                                            </small>
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        {script.fichier ? (
                                                                            <button
                                                                                className="btn btn-link-primary btn-sm p-1"
                                                                                onClick={() => handleDownload(script)}
                                                                                title="Télécharger"
                                                                            >
                                                                                <i className="ti ti-download f-18"></i>
                                                                            </button>
                                                                        ) : (
                                                                            <span className="text-muted">Aucun fichier</span>
                                                                        )}
                                                                    </td>
                                                                    <td>
                                                                        <span className={`badge ${priorityOptions[script.priorite]?.class || 'bg-light-secondary'}`}>
                                                                            {priorityOptions[script.priorite]?.label || 'Inconnue'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="text-center">
                                                                        <div className="d-flex justify-content-center gap-2">
                                                                            <button
                                                                                className="btn btn-link-secondary btn-sm p-1"
                                                                                onClick={() => handleViewScript(script)}
                                                                                title="Voir"
                                                                            >
                                                                                <i className="ti ti-eye f-18"></i>
                                                                            </button>
                                                                            {canModify && (
                                                                                <>
                                                                                    <button
                                                                                        className="btn btn-link-primary btn-sm p-1"
                                                                                        onClick={() => handleEditScript(script)}
                                                                                        title="Modifier"
                                                                                    >
                                                                                        <i className="ti ti-edit-circle f-18"></i>
                                                                                    </button>
                                                                                    <button
                                                                                        className="btn btn-link-danger btn-sm p-1"
                                                                                        onClick={() => handleDeleteScript(script.id)}
                                                                                        title="Supprimer"
                                                                                    >
                                                                                        <i className="ti ti-trash f-18"></i>
                                                                                    </button>
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>

                                                {filteredScripts.length === 0 && (
                                                    <div className="text-center p-4">
                                                        <div className="mb-3">
                                                            <i className="ti ti-file-code f-40 text-muted"></i>
                                                        </div>
                                                        <p className="text-muted">
                                                            {scripts.length === 0 
                                                                ? 'Aucun script trouvé dans le système.'
                                                                : selectedProjet === 'all'
                                                                    ? 'Aucun script trouvé dans vos projets.'
                                                                    : `Aucun script trouvé pour le projet "${getProjetName(selectedProjet)}".`
                                                            }
                                                        </p>
                                                        {canAddScript && scripts.length === 0 && (
                                                            <button
                                                                className="btn btn-primary btn-sm mt-2"
                                                                onClick={() => setShowAddModal(true)}
                                                            >
                                                                <i className="ti ti-plus me-1"></i>
                                                                Ajouter le premier script
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* End Main Content */}
                        </div>

                        {/* Modals */}
                        {canAddScript && (
                            <AjouterScriptModal
                                show={showAddModal}
                                onClose={() => setShowAddModal(false)}
                                onScriptAdded={handleScriptAdded}
                                projets={projets} // Utilise directement les projets de l'utilisateur
                                axes={axes}
                                sousAxes={sousAxes}
                                priorityOptions={priorityOptions}
                                isSuperAdmin={user.is_superuser}
                            />
                        )}

                        <ModifierScriptModal
                            show={showEditModal}
                            onClose={() => {
                                setShowEditModal(false);
                                setSelectedScript(null);
                            }}
                            onScriptUpdated={handleScriptUpdated}
                            script={selectedScript}
                            projets={projets}
                            axes={axes}
                            sousAxes={sousAxes}
                            priorityOptions={priorityOptions}
                            userProjets={projets}
                            isSuperAdmin={user.is_superuser}
                        />

                        <ViewScriptModal
                            show={showViewModal}
                            onClose={() => {
                                setShowViewModal(false);
                                setSelectedScript(null);
                            }}
                            script={selectedScript}
                            projets={projets}
                            axes={axes}
                            sousAxes={sousAxes}
                            priorityOptions={priorityOptions}
                        />
                    </div>
                </div>
            </div>

            <FooterAdmin />
        </div>
    );
};

export default GestionScripts;