// src/components/admin/GestionAdminSuperadmin.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import HeaderAdmin from '../admin/HeaderAdmin';
import SidebarAdmin from '../admin/SidebarAdmin';
import FooterAdmin from '../admin/FooterAdmin';
import api from '../../services/api';

const GestionAdminSuperadmin = ({ user, logout }) => {
    const [allUsers, setAllUsers] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [societes, setSocietes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedAdmin, setSelectedAdmin] = useState(null);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // On fetch les deux sources de données en parallèle
            const [profileResponse, societesResponse] = await Promise.all([
                api.get('user/profile/'),
                api.get('societe/')
            ]);

            // 1. Extraire et lister tous les utilisateurs
            const usersList = [];
            profileResponse.data.societe.forEach(societe => {
                societe.employes.forEach(employe => {
                    usersList.push(employe);
                });
            });
            setAllUsers(usersList);

            // 2. Filtrer pour ne garder que les admins et super-admins
            const adminsList = usersList.filter(u => u.is_staff || u.is_superuser);
            setAdmins(adminsList);

            // 3. Stocker la liste des sociétés
            setSocietes(societesResponse.data);

        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            toast.error('Erreur lors du chargement des données');
        } finally {
            setLoading(false);
        }
    };

    const handleEditAdmin = (admin) => {
        // Trouver la société assignée à cet admin pour pré-remplir le formulaire
        const assignedSociete = societes.find(s => s.admin?.id === admin.id);
        setSelectedAdmin({
            ...admin,
            societe_id: assignedSociete ? assignedSociete.id : ''
        });
        setShowEditModal(true);
    };

    const handleSaveChanges = async () => {
        if (!selectedAdmin) return;

        setSaving(true);
        try {
            const { id, is_staff, is_superuser, societe_id } = selectedAdmin;

            // 1. Mettre à jour le rôle de l'utilisateur
            await api.patch(`users/${id}/`, {
                is_staff,
                is_superuser
            });

            // 2. Gérer l'assignation à la société
            // D'abord, on trouve l'ancienne société où cet admin était assigné pour la désassigner
            const oldSociete = societes.find(s => s.admin?.id === id);
            if (oldSociete) {
                await api.patch(`societe/${oldSociete.id}/`, { admin: null });
            }

            // Ensuite, on assigne le admin à la nouvelle société si une est sélectionnée
            if (societe_id) {
                await api.patch(`societe/${societe_id}/`, { admin: id });
            }

            toast.success('Administrateur mis à jour avec succès');
            setShowEditModal(false);
            fetchInitialData(); // Recharger les données pour voir les changements

        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
            toast.error('Erreur lors de la mise à jour de l\'administrateur');
        } finally {
            setSaving(false);
        }
    };

    const getAssignedSocieteName = (adminId) => {
        const societe = societes.find(s => s.admin?.id === adminId);
        return societe ? societe.nom : 'Non assignée';
    };

    if (loading) {
        return (
            <div className="dashboard-wrapper">
                <HeaderAdmin user={user} logout={logout} />
                <div className="main-container"><SidebarAdmin />
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
                                                <li className="breadcrumb-item"><Link to="/dashboard">Accueil</Link></li>
                                                <li className="breadcrumb-item"><Link to="/dashboard">Dashboard</Link></li>
                                                <li className="breadcrumb-item" aria-current="page">Gestion des administrateurs</li>
                                            </ul>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="page-header-title">
                                                <h2 className="mb-0">Gestion des administrateurs</h2>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="row">
                                <div className="col-sm-12">
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>Nom</th>
                                                            <th>Email</th>
                                                            <th>Rôle</th>
                                                            <th>Société Assignée</th>
                                                            <th className="text-center">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {admins.map(admin => (
                                                            <tr key={admin.id}>
                                                                <td>{admin.full_name}</td>
                                                                <td>{admin.email}</td>
                                                                <td>
                                                                    {admin.is_superuser ? (
                                                                        <span className="badge bg-danger">Super-Admin</span>
                                                                    ) : (
                                                                        <span className="badge bg-primary">Admin</span>
                                                                    )}
                                                                </td>
                                                                <td>{getAssignedSocieteName(admin.id)}</td>
                                                                <td className="text-center">
                                                                    <button
                                                                        className="btn btn-link-primary btn-sm p-1"
                                                                        onClick={() => handleEditAdmin(admin)}
                                                                        title="Modifier"
                                                                    >
                                                                        <i className="ti ti-edit-circle f-18"></i>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                {admins.length === 0 && (
                                                    <div className="text-center p-4">
                                                        <p className="text-muted">Aucun administrateur trouvé.</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <FooterAdmin />

            {/* Modal d'édition */}
            {showEditModal && selectedAdmin && (
                <div className="modal show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Modifier l'administrateur : {selectedAdmin.full_name}</h5>
                                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Email</label>
                                    <input type="email" className="form-control" value={selectedAdmin.email} disabled />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Rôle</label>
                                    <select
                                        className="form-select"
                                        value={selectedAdmin.is_superuser ? 'superadmin' : 'admin'}
                                        onChange={(e) => setSelectedAdmin({
                                            ...selectedAdmin,
                                            is_superuser: e.target.value === 'superadmin',
                                            is_staff: true // Un admin est toujours staff
                                        })}
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="superadmin">Super-Admin</option>
                                    </select>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Société Assignée</label>
                                    <select
                                        className="form-select"
                                        value={selectedAdmin.societe_id}
                                        onChange={(e) => setSelectedAdmin({ ...selectedAdmin, societe_id: e.target.value })}
                                    >
                                        <option value="">Non assignée</option>
                                        {societes.map(societe => (
                                            <option key={societe.id} value={societe.id}>
                                                {societe.nom}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Annuler</button>
                                <button type="button" className="btn btn-primary" onClick={handleSaveChanges} disabled={saving}>
                                    {saving ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                            Enregistrement...
                                        </>
                                    ) : 'Enregistrer'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GestionAdminSuperadmin;