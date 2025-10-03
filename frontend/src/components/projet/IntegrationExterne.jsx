// src/components/projets/IntegrationExterne.jsx
import React, { useState } from 'react';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';
import api from '../../services/api';

const MySwal = withReactContent(Swal);

const IntegrationExterne = ({ user, onProjetImported }) => {
    const [showImportModal, setShowImportModal] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState('');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        redmine_url: '',
        redmine_api_key: '',
        jira_url: '',
        jira_email: '',
        jira_api_token: '',
        azure_organization: '',
        azure_personal_token: '',
        trello_api_key: '',
        trello_token: ''
    });

    const isSuperAdmin = user?.is_superuser;

    if (!isSuperAdmin) {
        return null; // Seul le super-admin peut voir ce composant
    }

    const platforms = [
        {
            id: 'redmine',
            name: 'Redmine',
            icon: 'ti ti-brand-redmine',
            color: 'danger',
            description: 'Importer les projets depuis Redmine'
        },
        {
            id: 'jira',
            name: 'Jira',
            icon: 'ti ti-brand-jira',
            color: 'info',
            description: 'Importer les projets depuis Jira Cloud/Server'
        },
        {
            id: 'azure',
            name: 'Azure DevOps',
            icon: 'ti ti-brand-azure',
            color: 'primary',
            description: 'Importer les projets depuis Azure DevOps/Planner'
        },
        {
            id: 'trello',
            name: 'Trello',
            icon: 'ti ti-brand-trello',
            color: 'success',
            description: 'Importer les tableaux depuis Trello'
        }
    ];

    const handlePlatformSelect = (platformId) => {
        setSelectedPlatform(platformId);
        setShowImportModal(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImport = async () => {
        if (!selectedPlatform) return;

        setLoading(true);
        try {
            let response;
            const config = {};

            // Préparer les données selon la plateforme
            switch (selectedPlatform) {
                case 'redmine':
                    config.redmine_url = formData.redmine_url;
                    config.redmine_api_key = formData.redmine_api_key;
                    response = await api.post('import/redmine/projects/', config);
                    break;
                
                case 'jira':
                    config.jira_url = formData.jira_url;
                    config.jira_email = formData.jira_email;
                    config.jira_api_token = formData.jira_api_token;
                    response = await api.post('import/jira/projects/', config);
                    break;
                
                case 'azure':
                    config.azure_organization = formData.azure_organization;
                    config.azure_personal_token = formData.azure_personal_token;
                    response = await api.post('import/azure/projects/', config);
                    break;
                
                case 'trello':
                    config.trello_api_key = formData.trello_api_key;
                    config.trello_token = formData.trello_token;
                    response = await api.post('import/trello/boards/', config);
                    break;
                
                default:
                    throw new Error('Plateforme non supportée');
            }

            // Afficher le résultat
            await MySwal.fire({
                title: 'Import réussi !',
                html: `
                    <div class="text-start">
                        <p><strong>${response.data.imported || 0} projet(s) importé(s)</strong></p>
                        <p>${response.data.updated || 0} projet(s) mis à jour</p>
                        <p>${response.data.skipped || 0} projet(s) ignoré(s)</p>
                        ${response.data.errors && response.data.errors.length > 0 ? `
                            <div class="alert alert-warning mt-2">
                                <strong>Erreurs :</strong>
                                <ul class="mb-0">
                                    ${response.data.errors.map(error => `<li>${error}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                `,
                icon: 'success',
                confirmButtonText: 'OK',
                customClass: {
                    confirmButton: 'btn btn-success'
                }
            });

            // Notifier le parent
            if (onProjetImported) {
                onProjetImported();
            }

            setShowImportModal(false);
            setSelectedPlatform('');
            setFormData({
                redmine_url: '',
                redmine_api_key: '',
                jira_url: '',
                jira_email: '',
                jira_api_token: '',
                azure_organization: '',
                azure_personal_token: '',
                trello_api_key: '',
                trello_token: ''
            });

        } catch (error) {
            console.error('Erreur lors de l\'import:', error);
            await MySwal.fire({
                title: 'Erreur d\'import',
                text: error.response?.data?.detail || 'Une erreur est survenue lors de l\'import',
                icon: 'error',
                confirmButtonText: 'OK',
                customClass: {
                    confirmButton: 'btn btn-danger'
                }
            });
        } finally {
            setLoading(false);
        }
    };

    const renderPlatformForm = () => {
        switch (selectedPlatform) {
            case 'redmine':
                return (
                    <div className="row">
                        <div className="col-md-6">
                            <div className="mb-3">
                                <label className="form-label">URL Redmine *</label>
                                <input
                                    type="url"
                                    className="form-control"
                                    name="redmine_url"
                                    value={formData.redmine_url}
                                    onChange={handleInputChange}
                                    placeholder="https://votre-redmine.com"
                                    required
                                />
                                <small className="form-text text-muted">
                                    URL de base de votre instance Redmine
                                </small>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="mb-3">
                                <label className="form-label">Clé API Redmine *</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    name="redmine_api_key"
                                    value={formData.redmine_api_key}
                                    onChange={handleInputChange}
                                    placeholder="Votre clé API Redmine"
                                    required
                                />
                                <small className="form-text text-muted">
                                    Trouvable dans Mon compte → API access key
                                </small>
                            </div>
                        </div>
                    </div>
                );

            case 'jira':
                return (
                    <div className="row">
                        <div className="col-md-4">
                            <div className="mb-3">
                                <label className="form-label">URL Jira *</label>
                                <input
                                    type="url"
                                    className="form-control"
                                    name="jira_url"
                                    value={formData.jira_url}
                                    onChange={handleInputChange}
                                    placeholder="https://votre-domaine.atlassian.net"
                                    required
                                />
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="mb-3">
                                <label className="form-label">Email *</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    name="jira_email"
                                    value={formData.jira_email}
                                    onChange={handleInputChange}
                                    placeholder="votre@email.com"
                                    required
                                />
                            </div>
                        </div>
                        <div className="col-md-4">
                            <div className="mb-3">
                                <label className="form-label">Token API *</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    name="jira_api_token"
                                    value={formData.jira_api_token}
                                    onChange={handleInputChange}
                                    placeholder="Votre token API Jira"
                                    required
                                />
                                <small className="form-text text-muted">
                                    Créer un token dans Account Settings → Security → API token
                                </small>
                            </div>
                        </div>
                    </div>
                );

            case 'azure':
                return (
                    <div className="row">
                        <div className="col-md-6">
                            <div className="mb-3">
                                <label className="form-label">Organisation *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="azure_organization"
                                    value={formData.azure_organization}
                                    onChange={handleInputChange}
                                    placeholder="nom-organisation"
                                    required
                                />
                                <small className="form-text text-muted">
                                    Le nom de votre organisation Azure DevOps
                                </small>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="mb-3">
                                <label className="form-label">Token d'accès personnel *</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    name="azure_personal_token"
                                    value={formData.azure_personal_token}
                                    onChange={handleInputChange}
                                    placeholder="Votre token personnel Azure"
                                    required
                                />
                                <small className="form-text text-muted">
                                    Créer dans User Settings → Personal Access Tokens
                                </small>
                            </div>
                        </div>
                    </div>
                );

            case 'trello':
                return (
                    <div className="row">
                        <div className="col-md-6">
                            <div className="mb-3">
                                <label className="form-label">Clé API *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="trello_api_key"
                                    value={formData.trello_api_key}
                                    onChange={handleInputChange}
                                    placeholder="Votre clé API Trello"
                                    required
                                />
                                <small className="form-text text-muted">
                                    Obtenue depuis https://trello.com/app-key
                                </small>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="mb-3">
                                <label className="form-label">Token *</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    name="trello_token"
                                    value={formData.trello_token}
                                    onChange={handleInputChange}
                                    placeholder="Votre token Trello"
                                    required
                                />
                                <small className="form-text text-muted">
                                    Généré avec votre clé API sur le même site
                                </small>
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <>
            <div className="row mb-4">
                <div className="col-sm-12">
                    <div className="card">
                        <div className="card-header bg-transparent">
                            <h5 className="mb-0">
                                <i className="ti ti-cloud-download me-2"></i>
                                Intégration avec les outils externes
                            </h5>
                            <small className="text-muted">
                                Cette interface permet de gérer les projets, de leur création à l'attribution des accès, 
                                y compris l'intégration avec des outils externes (Redmine, Jira, Azure DevOps/Planner, Trello).
                            </small>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                {platforms.map((platform) => (
                                    <div key={platform.id} className="col-xl-3 col-lg-6 col-md-6">
                                        <div 
                                            className={`card platform-card hover-card border-${platform.color}`}
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => handlePlatformSelect(platform.id)}
                                        >
                                            <div className="card-body text-center">
                                                <div className={`avatar avatar-60 bg-light-${platform.color} rounded`}>
                                                    <i className={`${platform.icon} f-24 text-${platform.color}`}></i>
                                                </div>
                                                <h6 className="mt-3 mb-1">{platform.name}</h6>
                                                <p className="text-muted mb-0">{platform.description}</p>
                                                <div className="mt-3">
                                                    <span className={`badge bg-${platform.color}`}>
                                                        <i className="ti ti-download me-1"></i>
                                                        Importer
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal d'import */}
            {showImportModal && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog modal-lg">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    <i className={`ti ti-cloud-download me-2 text-${platforms.find(p => p.id === selectedPlatform)?.color}`}></i>
                                    Importer depuis {platforms.find(p => p.id === selectedPlatform)?.name}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => {
                                        setShowImportModal(false);
                                        setSelectedPlatform('');
                                    }}
                                    disabled={loading}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="alert alert-info">
                                    <i className="ti ti-info-circle me-2"></i>
                                    Les projets importés seront créés dans SnapFlow avec leurs métadonnées de base.
                                    Vous pourrez ensuite les modifier et leur attribuer des sociétés.
                                </div>

                                {renderPlatformForm()}

                                <div className="alert alert-warning mt-3">
                                    <i className="ti ti-alert-triangle me-2"></i>
                                    <strong>Note :</strong> Vos identifiants sont utilisés uniquement pour l'import 
                                    et ne sont pas stockés dans notre base de données.
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
                                    onClick={() => {
                                        setShowImportModal(false);
                                        setSelectedPlatform('');
                                    }}
                                    disabled={loading}
                                >
                                    Annuler
                                </button>
                                <button
                                    type="button"
                                    className={`btn btn-${platforms.find(p => p.id === selectedPlatform)?.color}`}
                                    onClick={handleImport}
                                    disabled={loading || !formData[`${selectedPlatform}_url`] && !formData[`${selectedPlatform}_api_key`]}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            Import en cours...
                                        </>
                                    ) : (
                                        <>
                                            <i className="ti ti-download me-1"></i>
                                            Importer les projets
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default IntegrationExterne;