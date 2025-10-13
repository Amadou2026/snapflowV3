import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import api from '../../services/api';
import AjouterUserModal from './modals/AjouterUserModal';
import ModifierUserModal from './modals/ModifierUserModal';
import ViewUserModal from './modals/ViewUserModal';
import FiltreGestionUser from './FiltreGestionUser';
import HeaderAdmin from '../admin/HeaderAdmin';
import SidebarAdmin from '../admin/SidebarAdmin';
import FooterAdmin from '../admin/FooterAdmin';

const MySwal = withReactContent(Swal);

const GestionUsers = ({ user, logout }) => {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    
    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(7);

    // Correction: Retirer complètement l'utilisation de AuthContext ici
    // car user est déjà passé en props
    useEffect(() => {
        fetchUsers();
    }, []); // Uniquement au montage initial

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('users/');
            console.log('Données utilisateurs reçues:', response.data);
            setUsers(response.data);
            setFilteredUsers(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des utilisateurs:', error);
        } finally {
            setLoading(false);
        }
    };

    // Fonction pour obtenir le nom de la société
    const getSocieteName = (userItem) => {
        console.log('Utilisateur:', userItem);
        
        if (userItem.societes && typeof userItem.societes === 'object') {
            return userItem.societes.nom || 'Société sans nom';
        }
        else if (userItem.societe && typeof userItem.societe === 'object') {
            return userItem.societe.nom || 'Société sans nom';
        }
        else if (userItem.societe && typeof userItem.societe === 'number') {
            return `Société ID: ${userItem.societe}`;
        }
        return 'Non assigné';
    };

    // Fonction pour déterminer le statut et les classes CSS
    const getUserStatus = (user) => {
        if (!user.is_active) {
            return {
                label: 'Désactivé',
                badgeClass: 'bg-light-danger text-danger',
                icon: 'ti ti-user-off'
            };
        } else if (user.is_staff) {
            return {
                label: 'Actif',
                badgeClass: 'bg-light-success text-success',
                icon: 'ti ti-user-check'
            };
        } else {
            return {
                label: 'Utilisateur',
                badgeClass: 'bg-light-warning text-warning',
                icon: 'ti ti-user'
            };
        }
    };

    // Logique de pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxVisiblePages = 5;
        
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }
        
        return pageNumbers;
    };

    const handleDeleteUser = async (userId) => {
        const userToDelete = users.find(u => u.id === userId);

        const result = await MySwal.fire({
            title: 'Êtes-vous sûr ?',
            html: `
                <div class="text-start">
                    <p>Vous êtes sur le point de supprimer l'utilisateur :</p>
                    <div class="alert alert-warning mt-2">
                        <strong>${userToDelete.first_name} ${userToDelete.last_name}</strong><br/>
                        <small class="text-muted">${userToDelete.email}</small>
                    </div>
                    <p class="text-danger mt-3">
                        <i class="ti ti-alert-triangle me-1"></i>
                        Cette action est irréversible !
                    </p>
                </div>
            `,
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
            },
            buttonsStyling: false,
            showLoaderOnConfirm: true,
            preConfirm: async () => {
                try {
                    await api.delete(`users/${userId}/`);
                    return true;
                } catch (error) {
                    MySwal.showValidationMessage(
                        `Erreur: ${error.response?.data?.detail || 'Erreur de suppression'}`
                    );
                    return false;
                }
            }
        });

        if (result.isConfirmed) {
            const updatedUsers = users.filter(user => user.id !== userId);
            setUsers(updatedUsers);
            setFilteredUsers(updatedUsers);
            
            if (currentUsers.length === 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            }

            MySwal.fire({
                title: 'Supprimé !',
                text: 'L\'utilisateur a été supprimé avec succès.',
                icon: 'success',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'OK',
                customClass: {
                    confirmButton: 'btn btn-success'
                },
                buttonsStyling: false
            });
        }
    };

    const handleToggleUserStatus = async (userId, currentStatus) => {
        const userToUpdate = users.find(u => u.id === userId);
        const newStatus = !currentStatus;
        const action = newStatus ? 'activer' : 'désactiver';

        const result = await MySwal.fire({
            title: `Êtes-vous sûr ?`,
            html: `
                <div class="text-start">
                    <p>Vous êtes sur le point de ${action} l'utilisateur :</p>
                    <div class="alert alert-${newStatus ? 'success' : 'warning'} mt-2">
                        <strong>${userToUpdate.first_name} ${userToUpdate.last_name}</strong><br/>
                        <small class="text-muted">${userToUpdate.email}</small>
                    </div>
                    <p class="text-muted mt-3">
                        <i class="ti ti-info-circle me-1"></i>
                        ${newStatus ?
                    'L\'utilisateur pourra à nouveau se connecter.' :
                    'L\'utilisateur ne pourra plus se connecter.'
                }
                    </p>
                </div>
            `,
            icon: newStatus ? 'success' : 'warning',
            showCancelButton: true,
            confirmButtonColor: newStatus ? '#28a745' : '#ffc107',
            cancelButtonColor: '#6c757d',
            confirmButtonText: `Oui, ${action} !`,
            cancelButtonText: 'Annuler',
            reverseButtons: true,
            customClass: {
                confirmButton: `btn btn-${newStatus ? 'success' : 'warning'}`,
                cancelButton: 'btn btn-secondary'
            },
            buttonsStyling: false,
            showLoaderOnConfirm: true,
            preConfirm: async () => {
                try {
                    const response = await api.patch(`users/${userId}/`, {
                        is_active: newStatus
                    });
                    return response.data;
                } catch (error) {
                    MySwal.showValidationMessage(
                        `Erreur: ${error.response?.data?.detail || 'Erreur de modification'}`
                    );
                    return false;
                }
            }
        });

        if (result.isConfirmed) {
            const updatedUsers = users.map(u =>
                u.id === userId ? { ...u, is_active: newStatus } : u
            );
            setUsers(updatedUsers);
            setFilteredUsers(updatedUsers);

            MySwal.fire({
                title: `${action.charAt(0).toUpperCase() + action.slice(1)} !`,
                text: `L'utilisateur a été ${action} avec succès.`,
                icon: 'success',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'OK',
                customClass: {
                    confirmButton: 'btn btn-success'
                },
                buttonsStyling: false
            });
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
        const updatedUsers = [...users, newUser];
        setUsers(updatedUsers);
        setFilteredUsers(updatedUsers);
        setShowAddModal(false);
        
        const newTotalPages = Math.ceil((filteredUsers.length + 1) / itemsPerPage);
        setCurrentPage(newTotalPages);

        MySwal.fire({
            title: 'Succès !',
            text: 'Utilisateur créé avec succès',
            icon: 'success',
            confirmButtonText: 'OK',
            customClass: {
                confirmButton: 'btn btn-success'
            },
            buttonsStyling: false
        });
    };

    const handleUserUpdated = (updatedUser) => {
        const updatedUsers = users.map(user => user.id === updatedUser.id ? updatedUser : user);
        setUsers(updatedUsers);
        setFilteredUsers(updatedUsers);
        setShowEditModal(false);
        setSelectedUser(null);

        MySwal.fire({
            title: 'Succès !',
            text: 'Utilisateur modifié avec succès',
            icon: 'success',
            confirmButtonText: 'OK',
            customClass: {
                confirmButton: 'btn btn-success'
            },
            buttonsStyling: false
        });
    };

    const handleFilterChange = (filtered) => {
        setFilteredUsers(filtered);
        setCurrentPage(1);
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

                            {/* Filtre */}
                            <FiltreGestionUser
                                users={users}
                                onFilterChange={handleFilterChange}
                            />

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
                                                            <th>Société</th>
                                                            <th>Prénom</th>
                                                            <th>Nom</th>
                                                            <th>Statut</th>
                                                            <th className="text-center">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {currentUsers.map((userItem, index) => {
                                                            const globalIndex = indexOfFirstItem + index;
                                                            const status = getUserStatus(userItem);
                                                            return (
                                                                <tr key={userItem.id}>
                                                                    <td>{globalIndex + 1}</td>
                                                                    <td>
                                                                        <div className="row align-items-center">
                                                                            <div className="col">
                                                                                <h6 className="mb-0">{userItem.first_name} {userItem.last_name}</h6>
                                                                                <p className="text-muted f-12 mb-0">{userItem.email}</p>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td>
                                                                        {getSocieteName(userItem)}
                                                                    </td>
                                                                    <td>{userItem.first_name}</td>
                                                                    <td>{userItem.last_name}</td>
                                                                    <td>
                                                                        <span className={`badge rounded-pill f-12 d-flex align-items-center justify-content-center ${status.badgeClass}`} style={{ width: 'fit-content', minWidth: '100px' }}>
                                                                            <i className={`${status.icon} me-1 f-10`}></i>
                                                                            {status.label}
                                                                        </span>
                                                                    </td>
                                                                    <td className="text-center">
                                                                        <div className="d-flex justify-content-center gap-2">
                                                                            <button
                                                                                className="btn btn-link-secondary btn-sm p-1"
                                                                                onClick={() => handleViewUser(userItem)}
                                                                                title="Voir"
                                                                            >
                                                                                <i className="ti ti-eye f-18"></i>
                                                                            </button>
                                                                            <button
                                                                                className="btn btn-link-primary btn-sm p-1"
                                                                                onClick={() => handleEditUser(userItem)}
                                                                                title="Modifier"
                                                                            >
                                                                                <i className="ti ti-edit-circle f-18"></i>
                                                                            </button>
                                                                            <button
                                                                                className={`btn btn-sm p-1 ${userItem.is_active ? 'btn-link-warning' : 'btn-link-success'}`}
                                                                                onClick={() => handleToggleUserStatus(userItem.id, userItem.is_active)}
                                                                                title={userItem.is_active ? 'Désactiver' : 'Activer'}
                                                                            >
                                                                                <i className={`ti ${userItem.is_active ? 'ti-user-off' : 'ti-user-check'} f-18`}></i>
                                                                            </button>
                                                                            {user.is_superuser && !userItem.is_superuser && (
                                                                                <button
                                                                                    className="btn btn-link-danger btn-sm p-1"
                                                                                    onClick={() => handleDeleteUser(userItem.id)}
                                                                                    title="Supprimer"
                                                                                >
                                                                                    <i className="ti ti-trash f-18"></i>
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>

                                                {filteredUsers.length === 0 && (
                                                    <div className="text-center p-4">
                                                        <p className="text-muted">
                                                            {users.length === 0 ?
                                                                'Aucun utilisateur trouvé.' :
                                                                'Aucun utilisateur ne correspond aux critères de filtrage.'
                                                            }
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Pagination */}
                                            {filteredUsers.length > itemsPerPage && (
                                                <div className="d-flex justify-content-between align-items-center mt-4">
                                                    <div className="text-muted">
                                                        Affichage de {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, filteredUsers.length)} sur {filteredUsers.length} utilisateurs
                                                    </div>
                                                    <nav aria-label="Page navigation">
                                                        <ul className="pagination mb-0">
                                                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                                <button
                                                                    className="page-link"
                                                                    onClick={goToPreviousPage}
                                                                    disabled={currentPage === 1}
                                                                >
                                                                    <i className="ti ti-chevron-left"></i>
                                                                </button>
                                                            </li>

                                                            {currentPage > 3 && (
                                                                <>
                                                                    <li className="page-item">
                                                                        <button
                                                                            className="page-link"
                                                                            onClick={() => paginate(1)}
                                                                        >
                                                                            1
                                                                        </button>
                                                                    </li>
                                                                    {currentPage > 4 && (
                                                                        <li className="page-item disabled">
                                                                            <span className="page-link">...</span>
                                                                        </li>
                                                                    )}
                                                                </>
                                                            )}

                                                            {getPageNumbers().map(number => (
                                                                <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                                                                    <button
                                                                        className="page-link"
                                                                        onClick={() => paginate(number)}
                                                                    >
                                                                        {number}
                                                                    </button>
                                                                </li>
                                                            ))}

                                                            {currentPage < totalPages - 2 && (
                                                                <>
                                                                    {currentPage < totalPages - 3 && (
                                                                        <li className="page-item disabled">
                                                                            <span className="page-link">...</span>
                                                                        </li>
                                                                    )}
                                                                    <li className="page-item">
                                                                        <button
                                                                            className="page-link"
                                                                            onClick={() => paginate(totalPages)}
                                                                        >
                                                                            {totalPages}
                                                                        </button>
                                                                    </li>
                                                                </>
                                                            )}

                                                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                                                <button
                                                                    className="page-link"
                                                                    onClick={goToNextPage}
                                                                    disabled={currentPage === totalPages}
                                                                >
                                                                    <i className="ti ti-chevron-right"></i>
                                                                </button>
                                                            </li>
                                                        </ul>
                                                    </nav>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
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