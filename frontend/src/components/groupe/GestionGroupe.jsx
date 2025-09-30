import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AjouterGroupeModal from './modals/AjouterGroupeModal';
import ModifierGroupeModal from './modals/ModifierGroupeModal';
import HeaderAdmin from '../admin/HeaderAdmin';
import SidebarAdmin from '../admin/SidebarAdmin';
import FooterAdmin from '../admin/FooterAdmin';

const GestionGroupe = ({ user, logout }) => {
    const [groupes, setGroupes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [showAjouterModal, setShowAjouterModal] = useState(false);
    const [showModifierModal, setShowModifierModal] = useState(false);
    const [groupeAModifier, setGroupeAModifier] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [groupeASupprimer, setGroupeASupprimer] = useState(null);

    useEffect(() => {
        loadGroupes();
    }, []);

    const loadGroupes = async () => {
        try {
            setLoading(true);
            const response = await api.get('groupes/');
            setGroupes(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des groupes:', error);
            setError('Erreur lors du chargement des groupes');
        } finally {
            setLoading(false);
        }
    };

    const handleGroupeAdded = (newGroupe) => {
        setGroupes(prev => [...prev, newGroupe]);
    };

    const handleGroupeUpdated = (updatedGroupe) => {
        setGroupes(prev => prev.map(groupe =>
            groupe.groupe_perso_id === updatedGroupe.groupe_perso_id ? updatedGroupe : groupe
        ));
    };

    const handleEdit = (groupe) => {
        setGroupeAModifier(groupe);
        setShowModifierModal(true);
    };

    const handleDelete = (groupe) => {
        if (groupe.est_protege) {
            alert('Ce groupe est protégé et ne peut pas être supprimé.');
            return;
        }
        setGroupeASupprimer(groupe);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`groupes/${groupeASupprimer.groupe_perso_id}/`);
            setGroupes(prev => prev.filter(groupe =>
                groupe.groupe_perso_id !== groupeASupprimer.groupe_perso_id
            ));
            setShowDeleteModal(false);
            setGroupeASupprimer(null);
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            alert('Erreur lors de la suppression du groupe');
        }
    };

    const filteredGroupes = groupes.filter(groupe =>
        groupe.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        groupe.role_predefini?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        groupe.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getTypeGroupeBadge = (typeGroupe) => {
        return typeGroupe === 'predéfini'
            ? <span className="badge bg-primary">Prédéfini</span>
            : <span className="badge bg-secondary">Personnalisé</span>;
    };

    const getRolePredefiniLabel = (rolePredefini) => {
        const roles = {
            'administrateur': 'Administrateur',
            'qa': 'Quality Assurance',
            'developpeur': 'Développeur',
            'manager': 'Manager',
            'chef_projet': 'Chef de Projet'
        };
        return roles[rolePredefini] || rolePredefini;
    };

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
                                                    Gestion des groupes
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="page-header-title">
                                                <h2 className="mb-0">Gestion des groupes</h2>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* End Breadcrumb */}

                            <div className="container-fluid">
                                <div className="row">
                                    <div className="col-12">
                                        <div className="card">
                                            {/* En-tête de carte avec bouton Ajouter */}
                                            <div className="card-header d-flex justify-content-between align-items-center">
                                                <h5 className="card-title mb-0">Gestion des Groupes</h5>
                                                <button
                                                    type="button"
                                                    className="btn btn-primary"
                                                    onClick={() => setShowAjouterModal(true)}
                                                >
                                                    <i className="fas fa-plus me-2"></i>
                                                    Ajouter un Groupe
                                                </button>
                                            </div>

                                            <div className="card-body">
                                                {error && (
                                                    <div className="alert alert-danger" role="alert">
                                                        {error}
                                                    </div>
                                                )}

                                                {/* Barre de recherche */}
                                                <div className="row mb-3">
                                                    <div className="col-md-6">
                                                        <div className="input-group">
                                                            <span className="input-group-text">
                                                                <i className="fas fa-search"></i>
                                                            </span>
                                                            <input
                                                                type="text"
                                                                className="form-control"
                                                                placeholder="Rechercher un groupe..."
                                                                value={searchTerm}
                                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6 text-end">
                                                        <small className="text-muted">
                                                            {filteredGroupes.length} groupe(s) trouvé(s)
                                                        </small>
                                                    </div>
                                                </div>

                                                {/* Tableau des groupes */}
                                                <div className="table-responsive">
                                                    <table className="table table-striped table-hover">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th>Nom</th>
                                                                <th>Type</th>
                                                                <th>Rôle prédéfini</th>
                                                                <th>Description</th>
                                                                <th>Permissions</th>
                                                                <th>Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {filteredGroupes.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan="6" className="text-center py-4">
                                                                        <i className="fas fa-users fa-3x text-muted mb-3"></i>
                                                                        <p className="text-muted">Aucun groupe trouvé</p>
                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                filteredGroupes.map((groupe) => (
                                                                    <tr key={groupe.groupe_perso_id}>
                                                                        <td>
                                                                            <strong>{groupe.nom}</strong>
                                                                            {groupe.est_protege && (
                                                                                <i className="fas fa-shield-alt text-warning ms-2"
                                                                                    title="Groupe protégé"></i>
                                                                            )}
                                                                        </td>
                                                                        <td>{getTypeGroupeBadge(groupe.type_groupe)}</td>
                                                                        <td>
                                                                            {groupe.role_predefini ? (
                                                                                <span className="badge bg-info">
                                                                                    {getRolePredefiniLabel(groupe.role_predefini)}
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-muted">-</span>
                                                                            )}
                                                                        </td>
                                                                        <td>
                                                                            {groupe.description ? (
                                                                                <span title={groupe.description}>
                                                                                    {groupe.description.length > 50
                                                                                        ? groupe.description.substring(0, 50) + '...'
                                                                                        : groupe.description
                                                                                    }
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-muted">-</span>
                                                                            )}
                                                                        </td>
                                                                        <td>
                                                                            <span className="badge bg-light text-dark">
                                                                                {groupe.permissions.length} permission(s)
                                                                            </span>
                                                                        </td>
                                                                        <td>
                                                                            <div className="btn-group" role="group">
                                                                                <button
                                                                                    type="button"
                                                                                    className="btn btn-sm btn-outline-primary"
                                                                                    onClick={() => handleEdit(groupe)}
                                                                                    title="Modifier"
                                                                                >
                                                                                    <i className="fas fa-edit"></i>
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    className={`btn btn-sm ${groupe.est_protege ? 'btn-outline-secondary' : 'btn-outline-danger'}`}
                                                                                    onClick={() => handleDelete(groupe)}
                                                                                    disabled={groupe.est_protege}
                                                                                    title={groupe.est_protege ? "Groupe protégé" : "Supprimer"}
                                                                                >
                                                                                    <i className="fas fa-trash"></i>
                                                                                </button>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Modals */}
                                <AjouterGroupeModal
                                    show={showAjouterModal}
                                    onClose={() => setShowAjouterModal(false)}
                                    onGroupeAdded={handleGroupeAdded}
                                />

                                <ModifierGroupeModal
                                    show={showModifierModal}
                                    onClose={() => {
                                        setShowModifierModal(false);
                                        setGroupeAModifier(null);
                                    }}
                                    onGroupeUpdated={handleGroupeUpdated}
                                    groupe={groupeAModifier}
                                />

                                {/* Modal de confirmation de suppression */}
                                {showDeleteModal && (
                                    <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
                                        <div className="modal-dialog">
                                            <div className="modal-content">
                                                <div className="modal-header">
                                                    <h5 className="modal-title">Confirmer la suppression</h5>
                                                    <button
                                                        type="button"
                                                        className="btn-close"
                                                        onClick={() => {
                                                            setShowDeleteModal(false);
                                                            setGroupeASupprimer(null);
                                                        }}
                                                    ></button>
                                                </div>
                                                <div className="modal-body">
                                                    <p>Êtes-vous sûr de vouloir supprimer le groupe <strong>{groupeASupprimer?.nom}</strong> ?</p>
                                                    <p className="text-muted small">Cette action est irréversible.</p>
                                                </div>
                                                <div className="modal-footer">
                                                    <button
                                                        type="button"
                                                        className="btn btn-secondary"
                                                        onClick={() => {
                                                            setShowDeleteModal(false);
                                                            setGroupeASupprimer(null);
                                                        }}
                                                    >
                                                        Annuler
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="btn btn-danger"
                                                        onClick={confirmDelete}
                                                    >
                                                        Supprimer
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <FooterAdmin />
        </div>
    );
};

export default GestionGroupe;