import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import AjouterConfigurationTestModal from './modals/AjouterConfigurationTestModal';
import ModifierConfigurationTestModal from './modals/ModifierConfigurationTestModal';
import ViewConfigurationTestModal from './modals/ViewConfigurationTestModal';
import FiltreGestionConfigurationTest from './FiltreGestionConfigurationTest';
import HeaderAdmin from '../admin/HeaderAdmin';
import SidebarAdmin from '../admin/SidebarAdmin';
import FooterAdmin from '../admin/FooterAdmin';
import { AuthContext } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const GestionConfigurationTest = ({ user, logout }) => {
    const [configurations, setConfigurations] = useState([]);
    const [filteredConfigurations, setFilteredConfigurations] = useState([]);
    const [displayedConfigurations, setDisplayedConfigurations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedConfiguration, setSelectedConfiguration] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);

    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(7);

    // Récupération du contexte d'authentification
    const { selectedProjectId: contextProjectId } = useContext(AuthContext);
    const location = useLocation();

    // Vérifier si l'utilisateur est superadmin
    const isSuperAdmin = user?.is_superuser;

    // Vérifier si l'utilisateur peut modifier une configuration
    const canEditConfiguration = (configuration) => {
        return isSuperAdmin || configuration.societe?.id === user?.societe?.id;
    };

    useEffect(() => {
        // Extraire le projectId de l'URL
        const urlParams = new URLSearchParams(location.search);
        const urlProjectId = urlParams.get('projectId');
        
        // Priorité : URL > Contexte
        const projectId = urlProjectId || contextProjectId;
        
        fetchConfigurations(projectId);
    }, [location.search, contextProjectId]);

    // Fonction pour récupérer toutes les configurations puis filtrer côté client
    const fetchConfigurations = async (projectId = null) => {
        try {
            setLoading(true);
            const response = await api.get('configuration-tests/');
            console.log('📊 DONNÉES CONFIGURATIONS:', response.data);
            
            let configurationsToShow = response.data;
            
            // Filtrer par projet si un projectId est spécifié
            if (projectId) {
                const projectIdNum = parseInt(projectId);
                configurationsToShow = response.data.filter(config => 
                    config.projet?.id === projectIdNum
                );
                console.log(`🔍 Configurations filtrées pour le projet ${projectId}:`, configurationsToShow);
            }
            
            setConfigurations(configurationsToShow);
            setFilteredConfigurations(configurationsToShow);
        } catch (error) {
            console.error('Erreur lors du chargement des configurations:', error);
            showErrorAlert('Erreur lors du chargement des configurations de test');
        } finally {
            setLoading(false);
        }
    };

    // Mettre à jour l'affichage paginé quand les configurations filtrées changent
    useEffect(() => {
        updateDisplayedConfigurations();
    }, [filteredConfigurations, currentPage]);

    const updateDisplayedConfigurations = () => {
        // Calculer les index de début et fin pour la pagination
        const indexOfLastItem = currentPage * itemsPerPage;
        const indexOfFirstItem = indexOfLastItem - itemsPerPage;
        const currentItems = filteredConfigurations.slice(indexOfFirstItem, indexOfLastItem);

        setDisplayedConfigurations(currentItems);
    };

    // Fonction pour activer une configuration
    const handleActivateConfiguration = async (configurationId) => {
        try {
            await api.post(`configuration-tests/${configurationId}/activate/`);

            // Mettre à jour l'état local
            const updatedConfigurations = configurations.map(config =>
                config.id === configurationId
                    ? { ...config, is_active: true, date_activation: new Date().toISOString() }
                    : config
            );

            setConfigurations(updatedConfigurations);
            setFilteredConfigurations(updatedConfigurations);

            MySwal.fire({
                title: 'Activée !',
                text: 'La configuration a été activée avec succès.',
                icon: 'success',
                confirmButtonColor: '#3085d6',
                confirmButtonText: 'OK'
            });
        } catch (error) {
            console.error('Erreur lors de l\'activation:', error);
            showErrorAlert('Erreur lors de l\'activation de la configuration');
        }
    };

    // Fonction pour désactiver une configuration
    const handleDeactivateConfiguration = async (configurationId) => {
        const configuration = configurations.find(c => c.id === configurationId);

        const result = await MySwal.fire({
            title: 'Désactiver la configuration ?',
            html: `Vous êtes sur le point de désactiver la configuration <strong>"${configuration?.nom}"</strong>.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Oui, désactiver',
            cancelButtonText: 'Annuler',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            try {
                await api.post(`configuration-tests/${configurationId}/deactivate/`);

                // Mettre à jour l'état local
                const updatedConfigurations = configurations.map(config =>
                    config.id === configurationId
                        ? { ...config, is_active: false, date_desactivation: new Date().toISOString() }
                        : config
                );

                setConfigurations(updatedConfigurations);
                setFilteredConfigurations(updatedConfigurations);

                MySwal.fire({
                    title: 'Désactivée !',
                    text: 'La configuration a été désactivée avec succès.',
                    icon: 'success',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'OK'
                });
            } catch (error) {
                console.error('Erreur lors de la désactivation:', error);
                showErrorAlert('Erreur lors de la désactivation de la configuration');
            }
        }
    };

    // Fonction pour exécuter immédiatement
    const handleExecuteNow = async (configurationId) => {
        const configuration = configurations.find(c => c.id === configurationId);

        const result = await MySwal.fire({
            title: 'Exécuter maintenant ?',
            html: `Vous êtes sur le point d'exécuter immédiatement la configuration <strong>"${configuration?.nom}"</strong>.`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#0ea5e9',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Oui, exécuter',
            cancelButtonText: 'Annuler',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            try {
                await api.post(`configuration-tests/${configurationId}/execute_now/`);

                // Mettre à jour l'état local avec la nouvelle date d'exécution
                const updatedConfigurations = configurations.map(config =>
                    config.id === configurationId
                        ? { ...config, last_execution: new Date().toISOString() }
                        : config
                );

                setConfigurations(updatedConfigurations);
                setFilteredConfigurations(updatedConfigurations);

                MySwal.fire({
                    title: 'Exécutée !',
                    text: 'La configuration a été exécutée avec succès.',
                    icon: 'success',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'OK'
                });
            } catch (error) {
                console.error('Erreur lors de l\'exécution:', error);
                showErrorAlert('Erreur lors de l\'exécution de la configuration');
            }
        }
    };

    // Calculer le nombre total de pages
    const totalPages = Math.ceil(filteredConfigurations.length / itemsPerPage);

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

    // Générer les numéros de page à afficher
    const getPageNumbers = () => {
        const pageNumbers = [];
        const maxVisiblePages = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        // Ajuster le début si on est près de la fin
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return pageNumbers;
    };

    const handleDeleteConfiguration = async (configurationId) => {
        const configuration = configurations.find(c => c.id === configurationId);

        if (!canEditConfiguration(configuration)) {
            showErrorAlert('Vous n\'avez pas les permissions pour supprimer cette configuration');
            return;
        }

        const result = await MySwal.fire({
            title: 'Êtes-vous sûr ?',
            html: `Vous êtes sur le point de supprimer la configuration <strong>"${configuration?.nom}"</strong>. Cette action est irréversible !`,
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
                await api.delete(`configuration-tests/${configurationId}/`);

                const updatedConfigurations = configurations.filter(config => config.id !== configurationId);
                setConfigurations(updatedConfigurations);
                setFilteredConfigurations(updatedConfigurations);

                // Réinitialiser à la première page si nécessaire
                if (displayedConfigurations.length === 1 && currentPage > 1) {
                    setCurrentPage(currentPage - 1);
                }

                await MySwal.fire({
                    title: 'Supprimé !',
                    text: 'La configuration a été supprimée avec succès.',
                    icon: 'success',
                    confirmButtonColor: '#3085d6',
                    confirmButtonText: 'OK'
                });
            } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                showErrorAlert('Erreur lors de la suppression de la configuration');
            }
        }
    };

    const handleEditConfiguration = (configuration) => {
        if (!canEditConfiguration(configuration)) {
            showErrorAlert('Vous n\'avez pas les permissions pour modifier cette configuration');
            return;
        }
        setSelectedConfiguration(configuration);
        setShowEditModal(true);
    };

    const handleViewConfiguration = (configuration) => {
        setSelectedConfiguration(configuration);
        setShowViewModal(true);
    };

    const handleConfigurationAdded = (newConfiguration) => {
        const updatedConfigurations = [...configurations, newConfiguration];
        setConfigurations(updatedConfigurations);
        setFilteredConfigurations(updatedConfigurations);
        setShowAddModal(false);

        // Aller à la dernière page pour voir la nouvelle configuration
        const newTotalPages = Math.ceil(updatedConfigurations.length / itemsPerPage);
        setCurrentPage(newTotalPages);

        MySwal.fire({
            title: 'Succès !',
            text: 'La configuration a été créée avec succès.',
            icon: 'success',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK'
        });
    };

    const handleConfigurationUpdated = (updatedConfiguration) => {
        const updatedConfigurations = configurations.map(config =>
            config.id === updatedConfiguration.id ? updatedConfiguration : config
        );
        setConfigurations(updatedConfigurations);
        setFilteredConfigurations(updatedConfigurations);
        setShowEditModal(false);
        setSelectedConfiguration(null);

        MySwal.fire({
            title: 'Succès !',
            text: 'La configuration a été modifiée avec succès.',
            icon: 'success',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK'
        });
    };

    const handleFilterChange = (filtered) => {
        setFilteredConfigurations(filtered);
        setCurrentPage(1); // Retourner à la première page après filtrage
    };

    // Fonction utilitaire pour les erreurs
    const showErrorAlert = (message) => {
        MySwal.fire({
            title: 'Erreur !',
            text: message,
            icon: 'error',
            confirmButtonColor: '#d33',
            confirmButtonText: 'OK'
        });
    };

    // Fonction pour afficher le statut
    const displayStatus = (isActive) => {
        return isActive ? (
            <span className="badge bg-light-success">
                <i className="ti ti-circle-check me-1"></i>Active
            </span>
        ) : (
            <span className="badge bg-light-danger">
                <i className="ti ti-circle-x me-1"></i>Inactive
            </span>
        );
    };

    // Fonction pour afficher la périodicité
    const displayPeriodicite = (periodicite) => {
        const periodiciteMap = {
            "2min": "2 minutes",
            "2h": "2 heures",
            "6h": "6 heures",
            "1j": "1 jour",
            "1s": "1 semaine",
            "1m": "1 mois"
        };
        return periodiciteMap[periodicite] || periodicite;
    };

    // Fonction pour afficher les scripts
    const displayScripts = (scripts) => {
        if (!scripts || scripts.length === 0) {
            return <span className="text-muted">Aucun script</span>;
        }

        // Limiter à 2 scripts pour l'affichage dans le tableau
        const scriptsAffiches = scripts.slice(0, 2);
        const autresScripts = scripts.length - 2;

        return (
            <div>
                {scriptsAffiches.map((script, index) => (
                    <span key={script.id} className="badge bg-light-primary me-1 mb-1">
                        {script.nom}
                    </span>
                ))}
                {autresScripts > 0 && (
                    <span className="badge bg-light-secondary">
                        +{autresScripts} autre(s)
                    </span>
                )}
            </div>
        );
    };

    // Fonction pour compter les scripts
    const countScripts = (scripts) => {
        return scripts ? scripts.length : 0;
    };

    // Fonction pour compter les emails
    const countEmails = (emails) => {
        return emails ? emails.length : 0;
    };

    // Fonction pour formater la date
    const formatDate = (dateString) => {
        if (!dateString) return 'Non défini';
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
                                                    Gestion des campagnes de test
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="page-header-title">
                                                <h2 className="mb-0">Gestion des campagnes de test</h2>
                                                {isSuperAdmin && (
                                                    <p className="text-muted mb-0">
                                                        <i className="ti ti-crown me-1 text-warning"></i>
                                                        Mode Super Administrateur
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* End Breadcrumb */}

                            {/* Filtre */}
                            <FiltreGestionConfigurationTest
                                configurations={configurations}
                                onFilterChange={handleFilterChange}
                                user={user}
                            />
                            {/* End Filtre */}

                            {/* Main Content */}
                            <div className="row">
                                <div className="col-sm-12">
                                    <div className="card table-card">
                                        <div className="card-body">
                                            {/* Bouton Ajouter */}
                                            <div className="text-end p-4 pb-0">
                                                <button
                                                    className="btn btn-primary d-inline-flex align-items-center"
                                                    onClick={() => setShowAddModal(true)}
                                                >
                                                    <i className="ti ti-plus f-18"></i> Nouvelle Campagnes
                                                </button>
                                            </div>

                                            <div className="table-responsive">
                                                <table className="table table-hover">
                                                    <thead>
                                                        <tr>
                                                            <th>#</th>
                                                            <th>Nom</th>
                                                            <th>Société</th>
                                                            <th>Projet</th>
                                                            <th>Périodicité</th>
                                                            <th>Statut</th>
                                                            <th>Scripts</th>
                                                            <th>Emails</th>
                                                            <th>Dernière exécution</th>
                                                            <th className="text-center">Actions</th>
                                                        </tr>
                                                    </thead>

                                                    <tbody>
                                                        {displayedConfigurations.map((configuration, index) => (
                                                            <tr key={configuration.id}>
                                                                <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                                                <td>
                                                                    <h6 className="mb-0">{configuration.nom}</h6>
                                                                </td>
                                                                <td>
                                                                    <span className="badge bg-light-info">
                                                                        {configuration.societe?.nom || 'Non spécifiée'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span className="badge bg-light-primary">
                                                                        {configuration.projet?.nom || 'Non spécifié'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    <span className="badge bg-light-secondary">
                                                                        {displayPeriodicite(configuration.periodicite)}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    {displayStatus(configuration.is_active)}
                                                                </td>
                                                                <td>
                                                                    <div className="d-flex align-items-center">
                                                                        <i className="ti ti-script me-1 text-muted"></i>
                                                                        <div>
                                                                            <span className="badge bg-light-warning me-1">
                                                                                {configuration.scripts_count} script(s)
                                                                            </span>
                                                                            {displayScripts(configuration.scripts_details)}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div className="d-flex align-items-center">
                                                                        <i className="ti ti-mail me-1 text-muted"></i>
                                                                        <span className="badge bg-light-success">
                                                                            {configuration.emails_count} email(s)
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <small className="text-muted">
                                                                        {formatDate(configuration.last_execution)}
                                                                    </small>
                                                                </td>
                                                                <td className="text-center">
                                                                    <div className="d-flex justify-content-center gap-2">
                                                                        {/* Bouton Voir - Accessible à tous */}
                                                                        <button
                                                                            className="btn btn-link-secondary btn-sm p-1"
                                                                            onClick={() => handleViewConfiguration(configuration)}
                                                                            title="Voir les détails"
                                                                        >
                                                                            <i className="ti ti-eye f-18"></i>
                                                                        </button>

                                                                        {/* Bouton Modifier - Pour utilisateurs autorisés */}
                                                                        {canEditConfiguration(configuration) && (
                                                                            <button
                                                                                className="btn btn-link-primary btn-sm p-1"
                                                                                onClick={() => handleEditConfiguration(configuration)}
                                                                                title="Modifier la configuration"
                                                                            >
                                                                                <i className="ti ti-edit-circle f-18"></i>
                                                                            </button>
                                                                        )}

                                                                        {/* Bouton Activer/Désactiver - Pour utilisateurs autorisés */}
                                                                        {canEditConfiguration(configuration) && (
                                                                            configuration.is_active ? (
                                                                                <button
                                                                                    className="btn btn-link-warning btn-sm p-1"
                                                                                    onClick={() => handleDeactivateConfiguration(configuration.id)}
                                                                                    title="Désactiver la configuration"
                                                                                >
                                                                                    <i className="ti ti-toggle-left f-18"></i>
                                                                                </button>
                                                                            ) : (
                                                                                <button
                                                                                    className="btn btn-link-success btn-sm p-1"
                                                                                    onClick={() => handleActivateConfiguration(configuration.id)}
                                                                                    title="Activer la configuration"
                                                                                >
                                                                                    <i className="ti ti-toggle-right f-18"></i>
                                                                                </button>
                                                                            )
                                                                        )}

                                                                        {/* Bouton Supprimer - Pour utilisateurs autorisés */}
                                                                        {canEditConfiguration(configuration) && (
                                                                            <button
                                                                                className="btn btn-link-danger btn-sm p-1"
                                                                                onClick={() => handleDeleteConfiguration(configuration.id)}
                                                                                title="Supprimer la configuration"
                                                                            >
                                                                                <i className="ti ti-trash f-18"></i>
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>

                                                {filteredConfigurations.length === 0 && (
                                                    <div className="text-center p-4">
                                                        <div className="mb-3">
                                                            <i className="ti ti-settings f-40 text-muted"></i>
                                                        </div>
                                                        <p className="text-muted">
                                                            {configurations.length === 0 ?
                                                                'Aucune configuration de test trouvée.' :
                                                                'Aucune configuration ne correspond aux critères de filtrage.'
                                                            }
                                                        </p>
                                                        {/* Bouton Ajouter */}
                                                        {configurations.length === 0 && (
                                                            <button
                                                                className="btn btn-primary btn-sm mt-2"
                                                                onClick={() => setShowAddModal(true)}
                                                            >
                                                                <i className="ti ti-plus me-1"></i>
                                                                Créer la première configuration
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Pagination - Affichée seulement s'il y a plus de 7 configurations */}
                                            {filteredConfigurations.length > itemsPerPage && (
                                                <div className="d-flex justify-content-between align-items-center mt-4 p-3 border-top">
                                                    <div className="text-muted">
                                                        <small>
                                                            Affichage de {Math.min((currentPage - 1) * itemsPerPage + 1, filteredConfigurations.length)}
                                                            à {Math.min(currentPage * itemsPerPage, filteredConfigurations.length)}
                                                            sur {filteredConfigurations.length} campagne(s)
                                                        </small>
                                                    </div>

                                                    <nav aria-label="Pagination">
                                                        <ul className="pagination pagination-sm mb-0">
                                                            {/* Bouton Précédent */}
                                                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                                                <button
                                                                    className="page-link"
                                                                    onClick={goToPreviousPage}
                                                                    disabled={currentPage === 1}
                                                                >
                                                                    <i className="ti ti-chevron-left"></i>
                                                                </button>
                                                            </li>

                                                            {/* Première page */}
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

                                                            {/* Pages numérotées */}
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

                                                            {/* Dernière page */}
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

                                                            {/* Bouton Suivant */}
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
                        {/* Modal Ajouter */}
                        <AjouterConfigurationTestModal
                            show={showAddModal}
                            onClose={() => setShowAddModal(false)}
                            onConfigurationAdded={handleConfigurationAdded}
                            user={user}
                        />

                        {/* Modal Modifier */}
                        <ModifierConfigurationTestModal
                            show={showEditModal}
                            onClose={() => {
                                setShowEditModal(false);
                                setSelectedConfiguration(null);
                            }}
                            onConfigurationUpdated={handleConfigurationUpdated}
                            configuration={selectedConfiguration}
                            user={user}
                        />

                        {/* Modal View */}
                        <ViewConfigurationTestModal
                            show={showViewModal}
                            onClose={() => {
                                setShowViewModal(false);
                                setSelectedConfiguration(null);
                            }}
                            configuration={selectedConfiguration}
                        />
                    </div>
                </div>
            </div>

            <FooterAdmin />
        </div>
    );
};

export default GestionConfigurationTest;