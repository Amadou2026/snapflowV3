import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import AjouterMailModal from './modals/AjouterMailModal';
import ModifierMailModal from './modals/ModifierMailModal';
import ViewMailModal from './modals/ViewMailModal';
import FiltreMail from './FiltreMail';
import HeaderAdmin from '../admin/HeaderAdmin';
import SidebarAdmin from '../admin/SidebarAdmin';
import MobileSidebarOverlay from '../admin/MobileSidebarOverlay';
import FooterAdmin from '../admin/FooterAdmin';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const GestionMail = ({ user, logout }) => {
    const [emails, setEmails] = useState([]);
    const [filteredEmails, setFilteredEmails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    
    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(7);

    useEffect(() => {
        fetchEmails();
    }, []);

    useEffect(() => {
        // Réinitialiser à la première page quand les données filtrées changent
        setCurrentPage(1);
    }, [filteredEmails]);

    const fetchEmails = async () => {
        try {
            const response = await api.get('email-notifications/');
            setEmails(response.data);
            setFilteredEmails(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des emails:', error);
            showErrorAlert('Erreur lors du chargement des emails');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (filteredData) => {
        setFilteredEmails(filteredData);
    };

    // Calcul de la pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentEmails = filteredEmails.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredEmails.length / itemsPerPage);

    // Changer de page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // Aller à la page précédente
    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    // Aller à la page suivante
    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handleDeleteEmail = async (emailId) => {
        const email = emails.find(e => e.id === emailId);
        
        const result = await MySwal.fire({
            title: 'Êtes-vous sûr ?',
            html: `Vous êtes sur le point de supprimer l'email <strong>"${email?.email}"</strong>. Cette action est irréversible !`,
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
                await api.delete(`email-notifications/${emailId}/`);
                
                const updatedEmails = emails.filter(email => email.id !== emailId);
                setEmails(updatedEmails);
                setFilteredEmails(updatedEmails);
                
                await MySwal.fire({
                    title: 'Supprimé !',
                    text: 'L\'email a été supprimé avec succès.',
                    icon: 'success',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'OK'
                });
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                showErrorAlert('Erreur lors de la suppression de l\'email');
            }
        }
    };

    const handleToggleStatus = async (emailId) => {
        const email = emails.find(e => e.id === emailId);
        const newStatus = !email.est_actif;
        
        try {
            const response = await api.patch(`email-notifications/${emailId}/`, {
                est_actif: newStatus
            });
            
            const updatedEmails = emails.map(e =>
                e.id === emailId ? response.data : e
            );
            setEmails(updatedEmails);
            setFilteredEmails(updatedEmails);
            
            await MySwal.fire({
                title: 'Succès !',
                text: `L'email a été ${newStatus ? 'activé' : 'désactivé'} avec succès.`,
                icon: 'success',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'OK'
            });
        } catch (error) {
            console.error('Erreur lors du changement de statut:', error);
            showErrorAlert('Erreur lors du changement de statut');
        }
    };

    const handleEditEmail = (email) => {
        setSelectedEmail(email);
        setShowEditModal(true);
    };

    const handleViewEmail = (email) => {
        setSelectedEmail(email);
        setShowViewModal(true);
    };

    const handleEmailAdded = (newEmail) => {
        const updatedEmails = [...emails, newEmail];
        setEmails(updatedEmails);
        setFilteredEmails(updatedEmails);
        setShowAddModal(false);
        
        MySwal.fire({
            title: 'Succès !',
            text: 'L\'email a été créé avec succès.',
            icon: 'success',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK'
        });
    };

    const handleEmailUpdated = (updatedEmail) => {
        const updatedEmails = emails.map(email =>
            email.id === updatedEmail.id ? updatedEmail : email
        );
        setEmails(updatedEmails);
        setFilteredEmails(updatedEmails);
        setShowEditModal(false);
        setSelectedEmail(null);
        
        MySwal.fire({
            title: 'Succès !',
            text: 'L\'email a été modifié avec succès.',
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

    if (loading) {
        return (
            <div className="dashboard-wrapper">
                <HeaderAdmin user={user} logout={logout} />
                <div className="main-container">
                    <SidebarAdmin />
                    <MobileSidebarOverlay />
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
                                                    Gestion des emails
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="page-header-title">
                                                <h2 className="mb-0">Gestion des emails de notification</h2>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* End Breadcrumb */}

                            {/* Filtres */}
                            <FiltreMail 
                                emails={emails} 
                                onFilterChange={handleFilterChange}
                                user={user}
                            />

                            {/* Main Content */}
                            <div className="row">
                                <div className="col-sm-12">
                                    <div className="card table-card">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-center p-4 pb-0">
                                                <div>
                                                    <h5 className="card-title mb-0">
                                                        Liste des emails ({filteredEmails.length})
                                                    </h5>
                                                </div>
                                                <div>
                                                    <button
                                                        className="btn btn-primary d-inline-flex align-items-center"
                                                        onClick={() => setShowAddModal(true)}
                                                    >
                                                        <i className="ti ti-plus f-18"></i> Ajouter un email
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Email</th>
                                                            <th>Société</th>
                                                            <th>Statut</th>
                                                            <th>Date de création</th>
                                                            <th className="text-center">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {currentEmails.map((email, index) => (
                                                            <tr key={email.id}>
                                                                <td>{indexOfFirstItem + index + 1}</td>
                                                                <td>
                                                                    <div className="row align-items-center">
                                                                        <div className="col-auto pe-0">
                                                                            <div className="wid-40 hei-40 rounded-circle bg-primary d-flex align-items-center justify-content-center">
                                                                                <i className="ti ti-mail text-white"></i>
                                                                            </div>
                                                                        </div>
                                                                        <div className="col">
                                                                            <h6 className="mb-0">{email.email}</h6>
                                                                            <small className="text-muted">
                                                                                Créé par: {email.created_by_name || 'Utilisateur'}
                                                                            </small>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <span className="badge bg-light-secondary">
                                                                        {email.societe_nom || 'Aucune société'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span className={`badge ${email.est_actif ? 'bg-light-success' : 'bg-light-danger'}`}>
                                                                        {email.est_actif ? (
                                                                            <>
                                                                                <i className="ti ti-circle-check me-1"></i>
                                                                                Actif
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <i className="ti ti-circle-x me-1"></i>
                                                                                Inactif
                                                                            </>
                                                                        )}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    {new Date(email.date_creation).toLocaleDateString('fr-FR', {
                                                                        year: 'numeric',
                                                                        month: 'short',
                                                                        day: 'numeric',
                                                                        hour: '2-digit',
                                                                        minute: '2-digit'
                                                                    })}
                                                                </td>
                                                                <td className="text-center">
                                                                    <div className="d-flex justify-content-center gap-2">
                                                                        <button
                                                                            className="btn btn-link-secondary btn-sm p-1"
                                                                            onClick={() => handleViewEmail(email)}
                                                                            title="Voir"
                                                                        >
                                                                            <i className="ti ti-eye f-18"></i>
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-link-primary btn-sm p-1"
                                                                            onClick={() => handleEditEmail(email)}
                                                                            title="Modifier"
                                                                        >
                                                                            <i className="ti ti-edit-circle f-18"></i>
                                                                        </button>
                                                                        <button
                                                                            className={`btn btn-sm p-1 ${email.est_actif ? 'btn-link-warning' : 'btn-link-success'}`}
                                                                            onClick={() => handleToggleStatus(email.id)}
                                                                            title={email.est_actif ? 'Désactiver' : 'Activer'}
                                                                        >
                                                                            <i className={`ti ti-${email.est_actif ? 'toggle-left' : 'toggle-right'} f-18`}></i>
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-link-danger btn-sm p-1"
                                                                            onClick={() => handleDeleteEmail(email.id)}
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

                                                {filteredEmails.length === 0 && (
                                                    <div className="text-center p-4">
                                                        <div className="mb-3">
                                                            <i className="ti ti-mail f-40 text-muted"></i>
                                                        </div>
                                                        <p className="text-muted">
                                                            Aucun email de notification trouvé.
                                                        </p>
                                                        <button
                                                            className="btn btn-primary btn-sm mt-2"
                                                            onClick={() => setShowAddModal(true)}
                                                        >
                                                            <i className="ti ti-plus me-1"></i>
                                                            Ajouter le premier email
                                                        </button>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Pagination */}
                                            {filteredEmails.length > 0 && (
                                                <div className="d-flex justify-content-between align-items-center mt-3 p-3 border-top">
                                                    <div>
                                                        <small className="text-muted">
                                                            Affichage de {indexOfFirstItem + 1} à {Math.min(indexOfLastItem, filteredEmails.length)} sur {filteredEmails.length} email(s)
                                                        </small>
                                                    </div>
                                                    <nav>
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
                                                            
                                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                                <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                                                    <button 
                                                                        className="page-link" 
                                                                        onClick={() => paginate(page)}
                                                                    >
                                                                        {page}
                                                                    </button>
                                                                </li>
                                                            ))}
                                                            
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
                            {/* End Main Content */}
                        </div>

                        {/* Modals */}
                        <AjouterMailModal
                            show={showAddModal}
                            onClose={() => setShowAddModal(false)}
                            onEmailAdded={handleEmailAdded}
                        />

                        <ModifierMailModal
                            show={showEditModal}
                            onClose={() => {
                                setShowEditModal(false);
                                setSelectedEmail(null);
                            }}
                            onEmailUpdated={handleEmailUpdated}
                            email={selectedEmail}
                        />

                        <ViewMailModal
                            show={showViewModal}
                            onClose={() => {
                                setShowViewModal(false);
                                setSelectedEmail(null);
                            }}
                            email={selectedEmail}
                        />
                    </div>
                </div>
            </div>

            <FooterAdmin />
        </div>
    );
};

export default GestionMail;