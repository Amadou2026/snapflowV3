import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AjouterUserModal from './modals/AjouterUserModal';
import ModifierUserModal from './modals/ModifierUserModal';
import ViewUserModal from './modals/ViewUserModal';
import HeaderAdmin from '../admin/HeaderAdmin';
import SidebarAdmin from '../admin/SidebarAdmin';
import FooterAdmin from '../admin/FooterAdmin';

const GestionUsers = ({ user, logout }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await api.get('users/');
            setUsers(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des utilisateurs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userId) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
            try {
                await api.delete(`users/${userId}/`);
                setUsers(users.filter(user => user.id !== userId));
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                alert('Erreur lors de la suppression de l\'utilisateur');
            }
        }
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setShowEditModal(true);
    };

    const handleViewUser = (user) => {
        setSelectedUser(user);
        setShowViewModal(true);
    };

    const handleUserAdded = (newUser) => {
        setUsers([...users, newUser]);
        setShowAddModal(false);
    };

    const handleUserUpdated = (updatedUser) => {
        setUsers(users.map(user => user.id === updatedUser.id ? updatedUser : user));
        setShowEditModal(false);
        setSelectedUser(null);
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
                                                    Gestion des utilisateurs
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="page-header-title">
                                                <h2 className="mb-0">Gestion des utilisateurs</h2>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* End Breadcrumb */}

                            {/* Main Content */}
                            <div className="row">
                                <div className="col-sm-12">
                                    <div className="card table-card">
                                        <div className="card-body">
                                            <div className="text-end p-4 pb-0">
                                                <button
                                                    className="btn btn-primary d-inline-flex align-items-center"
                                                    onClick={() => setShowAddModal(true)}
                                                >
                                                    <i className="ti ti-plus f-18"></i> Ajouter un Utilisateur
                                                </button>
                                            </div>

                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Utilisateur</th>
                                                            {/* <th>Email</th> */}
                                                            <th>Société</th>
                                                            <th>Prénom</th>
                                                            <th>Nom</th>
                                                            <th>Statut</th>
                                                            <th className="text-center">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {users.map((user, index) => (
                                                            <tr key={user.id}>
                                                                <td>{index + 1}</td>
                                                                <td>
                                                                    <div className="row align-items-center">
                                                                        <div className="col-auto pe-0">
                                                                            <img
                                                                                src={`/assets/img/user/avatar-${(index % 8) + 1}.jpg`}
                                                                                alt="avatar"
                                                                                className="wid-40 rounded-circle"
                                                                            />
                                                                        </div>
                                                                        <div className="col">
                                                                            <h6 className="mb-0">{user.first_name} {user.last_name}</h6>
                                                                            <p className="text-muted f-12 mb-0">{user.email}</p>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                {/* <td>{user.email}</td> */}
                                                                <td>
                                                                    {user.societes && user.societes.length > 0 ? (
                                                                        user.societes.map((s, idx) => (
                                                                            <span key={s.id}>
                                                                                {s.nom}{idx < user.societes.length - 1 ? ', ' : ''}
                                                                            </span>
                                                                        ))
                                                                    ) : (
                                                                        'Non assigné'
                                                                    )}
                                                                </td>
                                                                <td>{user.first_name}</td>
                                                                <td>{user.last_name}</td>
                                                                <td>
                                                                    <span className={`badge rounded-pill f-12 ${user.is_staff ? 'bg-light-success' : 'bg-light-warning'
                                                                        }`}>
                                                                        {user.is_staff ? 'Actif' : 'Utilisateur'}
                                                                    </span>
                                                                </td>
                                                                <td className="text-center">
                                                                    <div className="d-flex justify-content-center gap-2">
                                                                        <button
                                                                            className="btn btn-link-secondary btn-sm p-1"
                                                                            onClick={() => handleViewUser(user)}
                                                                            title="Voir"
                                                                        >
                                                                            <i className="ti ti-eye f-18"></i>
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-link-primary btn-sm p-1"
                                                                            onClick={() => handleEditUser(user)}
                                                                            title="Modifier"
                                                                        >
                                                                            <i className="ti ti-edit-circle f-18"></i>
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-link-danger btn-sm p-1"
                                                                            onClick={() => handleDeleteUser(user.id)}
                                                                            title="Supprimer"
                                                                        >
                                                                            <i className="ti ti-trash f-18"></i>
                                                                        </button>
                                                                    </div>
                                                                </td>

                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>

                                                {users.length === 0 && (
                                                    <div className="text-center p-4">
                                                        <p className="text-muted">Aucun utilisateur trouvé.</p>
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
                        <AjouterUserModal
                            show={showAddModal}
                            onClose={() => setShowAddModal(false)}
                            onUserAdded={handleUserAdded}
                        />

                        <ModifierUserModal
                            show={showEditModal}
                            onClose={() => {
                                setShowEditModal(false);
                                setSelectedUser(null);
                            }}
                            onUserUpdated={handleUserUpdated}
                            user={selectedUser}
                        />

                        <ViewUserModal
                            show={showViewModal}
                            onClose={() => {
                                setShowViewModal(false);
                                setSelectedUser(null);
                            }}
                            user={selectedUser}
                        />
                    </div>
                </div>
            </div>

            <FooterAdmin />
        </div>
    );
};

export default GestionUsers;