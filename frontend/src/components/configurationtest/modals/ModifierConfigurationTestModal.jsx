import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const ModifierConfigurationTestModal = ({ show, onClose, onConfigurationUpdated, configuration, user }) => {
    const [formData, setFormData] = useState({
        nom: '',
        societe: '',
        projet: '',
        periodicite: '',
        is_active: true,
        scripts: [], // Array d'IDs de scripts
        emails_notification: [] // Array d'IDs d'emails - CORRECTION: emails_notification au lieu de emails
    });

    const [societes, setSocietes] = useState([]);
    const [projets, setProjets] = useState([]);
    const [scripts, setScripts] = useState([]);
    const [emails, setEmails] = useState([]); // Liste des objets EmailNotification
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [loadingReferences, setLoadingReferences] = useState(false);

    // États pour les scripts (séparés)
    const [scriptsDisponibles, setScriptsDisponibles] = useState([]);
    const [scriptsActuels, setScriptsActuels] = useState([]);

    // États pour les emails (séparés) - CORRECTION: maintenant ce sont des IDs d'EmailNotification
    const [emailsDisponibles, setEmailsDisponibles] = useState([]);
    const [emailsActuels, setEmailsActuels] = useState([]);
    const [nouvelEmail, setNouvelEmail] = useState('');

    // Charger les données de référence
    useEffect(() => {
        if (show) {
            loadReferenceData();
        }
    }, [show]);

    // Mettre à jour le formulaire quand les données de référence sont chargées
    useEffect(() => {
        if (configuration && societes.length > 0 && projets.length > 0 && scripts.length > 0 && emails.length > 0) {
            initializeFormData();
        }
    }, [configuration, societes, projets, scripts, emails]);

    const initializeFormData = async () => {
        try {
            // Récupérer les détails complets de la configuration
            const response = await api.get(`configuration-tests/${configuration.id}/`);
            const configDetails = response.data;

            console.log('📋 Détails configuration:', configDetails);
            console.log('📧 Emails notification details:', configDetails.emails_notification_details);
            console.log('🏢 Projet:', configDetails.projet);

            // Préparer les IDs des scripts
            const scriptsIds = configDetails.scripts_details
                ? configDetails.scripts_details.map(script => script.id)
                : [];

            // CORRECTION: Préparer les IDs des emails_notification
            const emailsIds = configDetails.emails_notification_details
                ? configDetails.emails_notification_details.map(email => email.id)
                : [];

            setFormData({
                nom: configDetails.nom || '',
                societe: configDetails.societe?.id || '',
                projet: configDetails.projet?.id || '', // CORRECTION: projet ID
                periodicite: configDetails.periodicite || '',
                is_active: configDetails.is_active || true,
                scripts: scriptsIds,
                emails_notification: emailsIds // CORRECTION: emails_notification
            });

            // Mettre à jour les listes de scripts et emails
            updateScriptsLists(scriptsIds);
            updateEmailsLists(emailsIds);

        } catch (error) {
            console.error('Erreur lors du chargement des détails de la configuration:', error);
            toast.error('Erreur lors du chargement des données de la configuration');

            // Fallback avec les données de base
            setFormData({
                nom: configuration.nom || '',
                societe: configuration.societe?.id || '',
                projet: configuration.projet?.id || '', // CORRECTION: projet ID
                periodicite: configuration.periodicite || '',
                is_active: configuration.is_active || true,
                scripts: [],
                emails_notification: []
            });

            updateScriptsLists([]);
            updateEmailsLists([]);
        }
    };

    const loadReferenceData = async () => {
        setLoadingReferences(true);
        try {
            const [societesResponse, projetsResponse, scriptsResponse, emailsResponse] = await Promise.all([
                api.get('societe/'),
                api.get('projets/'),
                api.get('scripts/'),
                api.get('email-notifications/') // CORRECTION: Charger les emails notification
            ]);

            setSocietes(societesResponse.data);
            setProjets(projetsResponse.data);
            setScripts(scriptsResponse.data);
            setEmails(emailsResponse.data); // CORRECTION: Stocker les emails

        } catch (error) {
            console.error('Erreur lors du chargement des données de référence:', error);
            toast.error('Erreur lors du chargement des données de référence');
        } finally {
            setLoadingReferences(false);
        }
    };

    const updateScriptsLists = (scriptsIds) => {
        const scriptsActuelsList = scripts.filter(script =>
            scriptsIds.includes(script.id)
        );
        const scriptsDisponiblesList = scripts.filter(script =>
            !scriptsIds.includes(script.id)
        );

        setScriptsActuels(scriptsActuelsList);
        setScriptsDisponibles(scriptsDisponiblesList);
    };

    const updateEmailsLists = (emailsIds) => {
        const emailsActuelsList = emails.filter(email =>
            emailsIds.includes(email.id)
        );
        const emailsDisponiblesList = emails.filter(email =>
            !emailsIds.includes(email.id)
        );

        setEmailsActuels(emailsActuelsList);
        setEmailsDisponibles(emailsDisponiblesList);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Gestion des scripts
    const ajouterScript = (scriptId) => {
        const scriptIdInt = parseInt(scriptId);
        if (!formData.scripts.includes(scriptIdInt)) {
            const nouveauxScripts = [...formData.scripts, scriptIdInt];
            setFormData(prev => ({
                ...prev,
                scripts: nouveauxScripts
            }));
            updateScriptsLists(nouveauxScripts);
        }
    };

    const retirerScript = (scriptId) => {
        const scriptIdInt = parseInt(scriptId);
        const nouveauxScripts = formData.scripts.filter(id => id !== scriptIdInt);
        setFormData(prev => ({
            ...prev,
            scripts: nouveauxScripts
        }));
        updateScriptsLists(nouveauxScripts);
    };

    const ajouterTousScripts = () => {
        const tousScriptsIds = scriptsDisponibles.map(script => script.id);
        const nouveauxScripts = [...formData.scripts, ...tousScriptsIds];
        setFormData(prev => ({
            ...prev,
            scripts: nouveauxScripts
        }));
        updateScriptsLists(nouveauxScripts);
    };

    const retirerTousScripts = () => {
        setFormData(prev => ({
            ...prev,
            scripts: []
        }));
        updateScriptsLists([]);
    };

    // CORRECTION: Gestion des emails_notification (IDs d'EmailNotification)
    const ajouterEmail = (emailId) => {
        const emailIdInt = parseInt(emailId);
        if (!formData.emails_notification.includes(emailIdInt)) {
            const nouveauxEmails = [...formData.emails_notification, emailIdInt];
            setFormData(prev => ({
                ...prev,
                emails_notification: nouveauxEmails
            }));
            updateEmailsLists(nouveauxEmails);
        }
    };

    const retirerEmail = (emailId) => {
        const emailIdInt = parseInt(emailId);
        const nouveauxEmails = formData.emails_notification.filter(id => id !== emailIdInt);
        setFormData(prev => ({
            ...prev,
            emails_notification: nouveauxEmails
        }));
        updateEmailsLists(nouveauxEmails);
    };

    const ajouterTousEmails = () => {
        const tousEmailsIds = emailsDisponibles.map(email => email.id);
        const nouveauxEmails = [...formData.emails_notification, ...tousEmailsIds];
        setFormData(prev => ({
            ...prev,
            emails_notification: nouveauxEmails
        }));
        updateEmailsLists(nouveauxEmails);
    };

    const retirerTousEmails = () => {
        setFormData(prev => ({
            ...prev,
            emails_notification: []
        }));
        updateEmailsLists([]);
    };

    // CORRECTION: Fonction pour créer un nouvel email
    const creerEtAjouterEmail = async () => {
        if (!nouvelEmail || !isValidEmail(nouvelEmail)) {
            toast.error('Veuillez entrer un email valide');
            return;
        }

        try {
            // Créer un nouvel EmailNotification
            const response = await api.post('email-notifications/', {
                email: nouvelEmail,
                est_actif: true
            });

            const nouvelEmailObj = response.data;

            // Ajouter le nouvel email à la configuration
            const nouveauxEmails = [...formData.emails_notification, nouvelEmailObj.id];
            setFormData(prev => ({
                ...prev,
                emails_notification: nouveauxEmails
            }));

            // Mettre à jour la liste des emails disponibles
            setEmails(prev => [...prev, nouvelEmailObj]);
            updateEmailsLists(nouveauxEmails);

            setNouvelEmail('');
            toast.success('Email ajouté avec succès');

        } catch (error) {
            console.error('Erreur lors de la création de l\'email:', error);
            toast.error('Erreur lors de l\'ajout de l\'email');
        }
    };

    const handleNouvelEmailChange = (e) => {
        setNouvelEmail(e.target.value);
    };

    const handleNouvelEmailKeyPress = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            creerEtAjouterEmail();
        }
    };

    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.nom.trim()) {
            newErrors.nom = 'Le nom de la configuration est requis';
        }

        if (!formData.societe) {
            newErrors.societe = 'La société est requise';
        }

        if (!formData.projet) {
            newErrors.projet = 'Le projet est requis';
        }

        if (!formData.periodicite) {
            newErrors.periodicite = 'La périodicité est requise';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            // Préparer les données pour l'API
            const dataToSend = {
                nom: formData.nom.trim(),
                societe_id: parseInt(formData.societe),
                projet_id: parseInt(formData.projet),
                periodicite: formData.periodicite,
                is_active: formData.is_active,
                scripts: formData.scripts,
                emails_notification: formData.emails_notification
            };

            console.log('📤 Données envoyées pour modification:', dataToSend);

            const response = await api.put(`configuration-tests/${configuration.id}/`, dataToSend);

            toast.success('Configuration modifiée avec succès');
            onConfigurationUpdated(response.data);
            handleClose();
        } catch (error) {
            console.error('❌ Erreur complète:', error);
            console.error('📋 Réponse erreur:', error.response);

            if (error.response?.data) {
                const backendErrors = error.response.data;
                console.error('🔍 Détails erreurs backend:', backendErrors);

                // Afficher les erreurs spécifiques
                if (typeof backendErrors === 'object') {
                    setErrors(backendErrors);

                    // Afficher le premier message d'erreur
                    const firstError = Object.values(backendErrors)[0];
                    if (Array.isArray(firstError)) {
                        toast.error(firstError[0]);
                    } else if (typeof firstError === 'string') {
                        toast.error(firstError);
                    } else {
                        toast.error('Erreur lors de la modification');
                    }
                } else {
                    toast.error(backendErrors.toString());
                }
            } else {
                toast.error('Erreur de connexion au serveur');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            nom: '',
            societe: '',
            projet: '',
            periodicite: '',
            is_active: true,
            scripts: [],
            emails_notification: [] // CORRECTION: emails_notification
        });
        setErrors({});
        setScriptsActuels([]);
        setScriptsDisponibles([]);
        setEmailsActuels([]);
        setEmailsDisponibles([]);
        setNouvelEmail('');
        onClose();
    };

    // Filtrer les projets par société sélectionnée
    const projetsFiltres = formData.societe
        ? projets.filter(projet => {
            // CORRECTION: Vérifier si le projet a la société (relation ManyToMany)
            return projet.societes && projet.societes.some(s => s.id === parseInt(formData.societe));
        })
        : projets;

    if (!show || !configuration) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="ti ti-edit me-2"></i>
                            Modifier la configuration - {configuration.nom}
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={handleClose}
                            disabled={loading}
                        ></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            {loadingReferences ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Chargement...</span>
                                    </div>
                                    <p className="mt-2">Chargement des données...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="nom" className="form-label">
                                                    Nom de la configuration *
                                                </label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
                                                    id="nom"
                                                    name="nom"
                                                    value={formData.nom}
                                                    onChange={handleInputChange}
                                                    placeholder="Ex: Tests quotidiens production"
                                                    disabled={loading}
                                                />
                                                {errors.nom && (
                                                    <div className="invalid-feedback">
                                                        {errors.nom}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="periodicite" className="form-label">
                                                    Périodicité *
                                                </label>
                                                <select
                                                    className={`form-select ${errors.periodicite ? 'is-invalid' : ''}`}
                                                    id="periodicite"
                                                    name="periodicite"
                                                    value={formData.periodicite}
                                                    onChange={handleInputChange}
                                                    disabled={loading}
                                                >
                                                    <option value="">Sélectionnez une périodicité</option>
                                                    <option value="2min">2 minutes</option>
                                                    <option value="2h">2 heures</option>
                                                    <option value="6h">6 heures</option>
                                                    <option value="1j">1 jour</option>
                                                    <option value="1s">1 semaine</option>
                                                    <option value="1m">1 mois</option>
                                                </select>
                                                {errors.periodicite && (
                                                    <div className="invalid-feedback">
                                                        {errors.periodicite}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="societe" className="form-label">
                                                    Société *
                                                </label>
                                                <select
                                                    className={`form-select ${errors.societe ? 'is-invalid' : ''}`}
                                                    id="societe"
                                                    name="societe"
                                                    value={formData.societe}
                                                    onChange={handleInputChange}
                                                    disabled={loading || loadingReferences}
                                                >
                                                    <option value="">Sélectionnez une société</option>
                                                    {societes.map((societe) => (
                                                        <option key={societe.id} value={societe.id}>
                                                            {societe.nom}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.societe && (
                                                    <div className="invalid-feedback">
                                                        {errors.societe}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="projet" className="form-label">
                                                    Projet *
                                                </label>
                                                <select
                                                    className={`form-select ${errors.projet ? 'is-invalid' : ''}`}
                                                    id="projet"
                                                    name="projet"
                                                    value={formData.projet}
                                                    onChange={handleInputChange}
                                                    disabled={loading || loadingReferences || !formData.societe}
                                                >
                                                    <option value="">Sélectionnez un projet</option>
                                                    {projetsFiltres.map((projet) => (
                                                        <option key={projet.id} value={projet.id}>
                                                            {projet.nom}
                                                        </option>
                                                    ))}
                                                </select>
                                                {projetsFiltres.length === 0 && formData.societe && (
                                                    <div className="form-text text-warning">
                                                        Aucun projet disponible pour cette société
                                                    </div>
                                                )}
                                                {errors.projet && (
                                                    <div className="invalid-feedback">
                                                        {errors.projet}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Statut Actif/Inactif */}
                                    <div className="row">
                                        <div className="col-md-12">
                                            <div className="mb-3">
                                                <div className="form-check form-switch">
                                                    <input
                                                        className="form-check-input"
                                                        type="checkbox"
                                                        id="is_active"
                                                        name="is_active"
                                                        checked={formData.is_active}
                                                        onChange={handleInputChange}
                                                        disabled={loading}
                                                    />
                                                    <label className="form-check-label" htmlFor="is_active">
                                                        Configuration active
                                                    </label>
                                                </div>
                                                <small className="form-text text-muted">
                                                    Une configuration active sera exécutée automatiquement selon sa périodicité
                                                </small>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section Scripts (ManyToMany) */}
                                    <div className="row">
                                        <div className="col-12">
                                            <div className="mb-3">
                                                <label className="form-label">
                                                    Scripts Associés
                                                </label>

                                                <div className="row">
                                                    {/* Scripts disponibles */}
                                                    <div className="col-md-5">
                                                        <div className="card">
                                                            <div className="card-header d-flex justify-content-between align-items-center">
                                                                <span>Scripts disponibles ({scriptsDisponibles.length})</span>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-primary"
                                                                    onClick={ajouterTousScripts}
                                                                    disabled={scriptsDisponibles.length === 0 || loading}
                                                                >
                                                                    Tout ajouter →
                                                                </button>
                                                            </div>
                                                            <div className="card-body p-0">
                                                                <div
                                                                    className="list-group list-group-flush"
                                                                    style={{ maxHeight: '200px', overflowY: 'auto' }}
                                                                >
                                                                    {scriptsDisponibles.map(script => (
                                                                        <div
                                                                            key={script.id}
                                                                            className="list-group-item d-flex justify-content-between align-items-center"
                                                                        >
                                                                            <div>
                                                                                <strong>{script.nom}</strong>
                                                                                <br />
                                                                                <small className="text-muted">
                                                                                    {script.description && (
                                                                                        <>{script.description.substring(0, 50)}...</>
                                                                                    )}
                                                                                </small>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-sm btn-success"
                                                                                onClick={() => ajouterScript(script.id)}
                                                                                disabled={loading}
                                                                            >
                                                                                <i className="ti ti-plus"></i>
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                    {scriptsDisponibles.length === 0 && (
                                                                        <div className="list-group-item text-center text-muted">
                                                                            Aucun script disponible
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Boutons de transfert */}
                                                    <div className="col-md-2 d-flex align-items-center justify-content-center">
                                                        <div className="text-center">
                                                            <i className="ti ti-arrow-right" style={{ fontSize: '1.5rem' }}></i>
                                                        </div>
                                                    </div>

                                                    {/* Scripts actuels */}
                                                    <div className="col-md-5">
                                                        <div className="card">
                                                            <div className="card-header d-flex justify-content-between align-items-center">
                                                                <span>Scripts de la configuration ({scriptsActuels.length})</span>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={retirerTousScripts}
                                                                    disabled={scriptsActuels.length === 0 || loading}
                                                                >
                                                                    ← Tout retirer
                                                                </button>
                                                            </div>
                                                            <div className="card-body p-0">
                                                                <div
                                                                    className="list-group list-group-flush"
                                                                    style={{ maxHeight: '200px', overflowY: 'auto' }}
                                                                >
                                                                    {scriptsActuels.map(script => (
                                                                        <div
                                                                            key={script.id}
                                                                            className="list-group-item d-flex justify-content-between align-items-center"
                                                                        >
                                                                            <div>
                                                                                <strong>{script.nom}</strong>
                                                                                <br />
                                                                                <small className="text-muted">
                                                                                    {script.description && (
                                                                                        <>{script.description.substring(0, 50)}...</>
                                                                                    )}
                                                                                </small>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-sm btn-danger"
                                                                                onClick={() => retirerScript(script.id)}
                                                                                disabled={loading}
                                                                            >
                                                                                <i className="ti ti-minus"></i>
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                    {scriptsActuels.length === 0 && (
                                                                        <div className="list-group-item text-center text-muted">
                                                                            Aucun script assigné
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <small className="form-text text-muted">
                                                    {scriptsActuels.length} script(s) assigné(s) à cette configuration
                                                </small>
                                                {errors.scripts && (
                                                    <div className="invalid-feedback d-block">
                                                        {errors.scripts}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* CORRECTION: Section Emails Notification (ManyToMany avec EmailNotification) */}
                                    <div className="row">
                                        <div className="col-12">
                                            <div className="mb-3">
                                                <label className="form-label">
                                                    Emails de notification
                                                </label>

                                                {/* Ajout d'un nouvel email */}
                                                <div className="row mb-3">
                                                    <div className="col-md-8">
                                                        <input
                                                            type="email"
                                                            className="form-control"
                                                            placeholder="Ajouter un nouvel email de notification"
                                                            value={nouvelEmail}
                                                            onChange={handleNouvelEmailChange}
                                                            onKeyPress={handleNouvelEmailKeyPress}
                                                            disabled={loading}
                                                        />
                                                    </div>
                                                    <div className="col-md-4">
                                                        <button
                                                            type="button"
                                                            className="btn btn-primary w-100"
                                                            onClick={creerEtAjouterEmail}
                                                            disabled={loading || !nouvelEmail || !isValidEmail(nouvelEmail)}
                                                        >
                                                            <i className="ti ti-plus me-1"></i>
                                                            Créer et ajouter
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Système de transfert à deux colonnes pour les emails existants */}
                                                <div className="row">
                                                    {/* Emails disponibles */}
                                                    <div className="col-md-5">
                                                        <div className="card">
                                                            <div className="card-header d-flex justify-content-between align-items-center">
                                                                <span>Emails disponibles ({emailsDisponibles.length})</span>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-primary"
                                                                    onClick={ajouterTousEmails}
                                                                    disabled={emailsDisponibles.length === 0 || loading}
                                                                >
                                                                    Tout ajouter →
                                                                </button>
                                                            </div>
                                                            <div className="card-body p-0">
                                                                <div
                                                                    className="list-group list-group-flush"
                                                                    style={{ maxHeight: '200px', overflowY: 'auto' }}
                                                                >
                                                                    {emailsDisponibles.map(email => (
                                                                        <div
                                                                            key={email.id}
                                                                            className="list-group-item d-flex justify-content-between align-items-center"
                                                                        >
                                                                            <div>
                                                                                <strong>{email.email}</strong>
                                                                                <br />
                                                                                <small className={`badge bg-${email.est_actif ? 'success' : 'danger'}`}>
                                                                                    {email.est_actif ? 'Actif' : 'Inactif'}
                                                                                </small>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-sm btn-success"
                                                                                onClick={() => ajouterEmail(email.id)}
                                                                                disabled={loading || !email.est_actif}
                                                                            >
                                                                                <i className="ti ti-plus"></i>
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                    {emailsDisponibles.length === 0 && (
                                                                        <div className="list-group-item text-center text-muted">
                                                                            Aucun email disponible
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Boutons de transfert */}
                                                    <div className="col-md-2 d-flex align-items-center justify-content-center">
                                                        <div className="text-center">
                                                            <i className="ti ti-arrow-right" style={{ fontSize: '1.5rem' }}></i>
                                                        </div>
                                                    </div>

                                                    {/* Emails actuels */}
                                                    <div className="col-md-5">
                                                        <div className="card">
                                                            <div className="card-header d-flex justify-content-between align-items-center">
                                                                <span>Emails de la configuration ({emailsActuels.length})</span>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={retirerTousEmails}
                                                                    disabled={emailsActuels.length === 0 || loading}
                                                                >
                                                                    ← Tout retirer
                                                                </button>
                                                            </div>
                                                            <div className="card-body p-0">
                                                                <div
                                                                    className="list-group list-group-flush"
                                                                    style={{ maxHeight: '200px', overflowY: 'auto' }}
                                                                >
                                                                    {emailsActuels.map(email => (
                                                                        <div
                                                                            key={email.id}
                                                                            className="list-group-item d-flex justify-content-between align-items-center"
                                                                        >
                                                                            <div>
                                                                                <i className="ti ti-mail me-2 text-muted"></i>
                                                                                {email.email}
                                                                                <br />
                                                                                <small className={`badge bg-${email.est_actif ? 'success' : 'danger'}`}>
                                                                                    {email.est_actif ? 'Actif' : 'Inactif'}
                                                                                </small>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-sm btn-danger"
                                                                                onClick={() => retirerEmail(email.id)}
                                                                                disabled={loading}
                                                                            >
                                                                                <i className="ti ti-minus"></i>
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                    {emailsActuels.length === 0 && (
                                                                        <div className="list-group-item text-center text-muted">
                                                                            Aucun email assigné
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <small className="form-text text-muted">
                                                    Ces emails recevront les notifications d'exécution de la configuration
                                                </small>
                                                {errors.emails_notification && (
                                                    <div className="invalid-feedback d-block">
                                                        {errors.emails_notification}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={handleClose}
                                disabled={loading}
                            >
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={loading || loadingReferences}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Modification...
                                    </>
                                ) : (
                                    <>
                                        <i className="ti ti-check me-1"></i>
                                        Modifier la configuration
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ModifierConfigurationTestModal;