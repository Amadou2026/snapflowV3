import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const AjouterConfigurationTestModal = ({ show, onClose, onConfigurationAdded, user }) => {
    const [formData, setFormData] = useState({
        nom: '',
        societe: '',
        projet: '',
        periodicite: '2h',
        is_active: true,
        scripts: [],
        emails_notification: []
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // États pour les données de référence
    const [societes, setSocietes] = useState([]);
    const [projets, setProjets] = useState([]);
    const [scripts, setScripts] = useState([]);
    const [emails, setEmails] = useState([]);
    const [loadingReferences, setLoadingReferences] = useState(false);

    // États pour les sélections multiples
    const [scriptsDisponibles, setScriptsDisponibles] = useState([]);
    const [scriptsSelectionnes, setScriptsSelectionnes] = useState([]);
    const [emailsDisponibles, setEmailsDisponibles] = useState([]);
    const [emailsSelectionnes, setEmailsSelectionnes] = useState([]);

    const isSuperAdmin = user?.is_superuser;

    // Charger les données de référence
    useEffect(() => {
        if (show) {
            loadReferenceData();
        }
    }, [show]);

    const loadReferenceData = async () => {
        setLoadingReferences(true);
        try {
            // Charger les sociétés (seulement pour superadmin)
            if (isSuperAdmin) {
                const societesResponse = await api.get('societe/');
                setSocietes(societesResponse.data);
            } else {
                // Pour les utilisateurs normaux, utiliser leur société
                setSocietes([user.societe]);
                setFormData(prev => ({ ...prev, societe: user.societe.id }));
            }

            // Charger les projets selon la société
            await loadProjets();

            // Charger les scripts selon la société
            await loadScripts();

            // Charger les emails de notification actifs
            const emailsResponse = await api.get('emails-notification/?est_actif=true');
            setEmails(emailsResponse.data);
            setEmailsDisponibles(emailsResponse.data);

        } catch (error) {
            console.error('Erreur lors du chargement des données de référence:', error);
            toast.error('Erreur lors du chargement des données de référence');
        } finally {
            setLoadingReferences(false);
        }
    };

    const loadProjets = async () => {
        try {
            let projetsResponse;
            if (isSuperAdmin) {
                projetsResponse = await api.get('projets/');
            } else {
                projetsResponse = await api.get(`projets/?societe=${user.societe.id}`);
            }
            setProjets(projetsResponse.data);
        } catch (error) {
            console.error('Erreur lors du chargement des projets:', error);
        }
    };

    const loadScripts = async () => {
        try {
            let scriptsResponse;
            if (isSuperAdmin) {
                scriptsResponse = await api.get('scripts/');
            } else {
                scriptsResponse = await api.get(`scripts/?societe=${user.societe.id}`);
            }
            setScripts(scriptsResponse.data);
            setScriptsDisponibles(scriptsResponse.data);
        } catch (error) {
            console.error('Erreur lors du chargement des scripts:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Si la société change, recharger les projets et scripts
        if (name === 'societe') {
            setFormData(prev => ({ 
                ...prev, 
                societe: value,
                projet: '' // Réinitialiser le projet sélectionné
            }));
            // Recharger les projets et scripts pour cette société
            setTimeout(() => {
                loadProjets();
                loadScripts();
            }, 100);
        }

        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Gestion des scripts (ManyToMany)
    const ajouterScript = (scriptId) => {
        const scriptIdInt = parseInt(scriptId);
        const script = scripts.find(s => s.id === scriptIdInt);
        
        if (script && !formData.scripts.includes(scriptIdInt)) {
            const nouveauxScripts = [...formData.scripts, scriptIdInt];
            setFormData(prev => ({
                ...prev,
                scripts: nouveauxScripts
            }));
            
            setScriptsSelectionnes(prev => [...prev, script]);
            setScriptsDisponibles(prev => prev.filter(s => s.id !== scriptIdInt));
        }
    };

    const retirerScript = (scriptId) => {
        const scriptIdInt = parseInt(scriptId);
        const script = scripts.find(s => s.id === scriptIdInt);
        
        const nouveauxScripts = formData.scripts.filter(id => id !== scriptIdInt);
        setFormData(prev => ({
            ...prev,
            scripts: nouveauxScripts
        }));
        
        setScriptsSelectionnes(prev => prev.filter(s => s.id !== scriptIdInt));
        if (script) {
            setScriptsDisponibles(prev => [...prev, script]);
        }
    };

    const ajouterTousScripts = () => {
        const tousScriptsIds = scriptsDisponibles.map(script => script.id);
        const nouveauxScripts = [...formData.scripts, ...tousScriptsIds];
        setFormData(prev => ({
            ...prev,
            scripts: nouveauxScripts
        }));
        
        setScriptsSelectionnes(prev => [...prev, ...scriptsDisponibles]);
        setScriptsDisponibles([]);
    };

    const retirerTousScripts = () => {
        setFormData(prev => ({
            ...prev,
            scripts: []
        }));
        
        setScriptsDisponibles(prev => [...prev, ...scriptsSelectionnes]);
        setScriptsSelectionnes([]);
    };

    // Gestion des emails (ManyToMany)
    const ajouterEmail = (emailId) => {
        const emailIdInt = parseInt(emailId);
        const email = emails.find(e => e.id === emailIdInt);
        
        if (email && !formData.emails_notification.includes(emailIdInt)) {
            const nouveauxEmails = [...formData.emails_notification, emailIdInt];
            setFormData(prev => ({
                ...prev,
                emails_notification: nouveauxEmails
            }));
            
            setEmailsSelectionnes(prev => [...prev, email]);
            setEmailsDisponibles(prev => prev.filter(e => e.id !== emailIdInt));
        }
    };

    const retirerEmail = (emailId) => {
        const emailIdInt = parseInt(emailId);
        const email = emails.find(e => e.id === emailIdInt);
        
        const nouveauxEmails = formData.emails_notification.filter(id => id !== emailIdInt);
        setFormData(prev => ({
            ...prev,
            emails_notification: nouveauxEmails
        }));
        
        setEmailsSelectionnes(prev => prev.filter(e => e.id !== emailIdInt));
        if (email) {
            setEmailsDisponibles(prev => [...prev, email]);
        }
    };

    const ajouterTousEmails = () => {
        const tousEmailsIds = emailsDisponibles.map(email => email.id);
        const nouveauxEmails = [...formData.emails_notification, ...tousEmailsIds];
        setFormData(prev => ({
            ...prev,
            emails_notification: nouveauxEmails
        }));
        
        setEmailsSelectionnes(prev => [...prev, ...emailsDisponibles]);
        setEmailsDisponibles([]);
    };

    const retirerTousEmails = () => {
        setFormData(prev => ({
            ...prev,
            emails_notification: []
        }));
        
        setEmailsDisponibles(prev => [...prev, ...emailsSelectionnes]);
        setEmailsSelectionnes([]);
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

        if (formData.scripts.length === 0) {
            newErrors.scripts = 'Au moins un script doit être sélectionné';
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
            const dataToSend = {
                nom: formData.nom,
                societe: parseInt(formData.societe),
                projet: parseInt(formData.projet),
                periodicite: formData.periodicite,
                is_active: formData.is_active,
                scripts: formData.scripts,
                emails_notification: formData.emails_notification
            };

            console.log('📤 Données envoyées:', dataToSend);

            const response = await api.post('configuration-test/create/', dataToSend);
            console.log('✅ Réponse API:', response.data);

            toast.success('Configuration créée avec succès');
            onConfigurationAdded(response.data);
            resetForm();
        } catch (error) {
            console.error('❌ Erreur:', error);
            if (error.response?.data) {
                console.log('📋 Détails erreur:', error.response.data);
                setErrors(error.response.data);
                toast.error('Erreur lors de la création de la configuration');
            }
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            nom: '',
            societe: isSuperAdmin ? '' : user.societe.id,
            projet: '',
            periodicite: '2h',
            is_active: true,
            scripts: [],
            emails_notification: []
        });
        setScriptsDisponibles(scripts);
        setScriptsSelectionnes([]);
        setEmailsDisponibles(emails);
        setEmailsSelectionnes([]);
        setErrors({});
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!show) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="ti ti-settings me-2"></i>
                            Nouvelle Configuration de Test
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={handleClose}
                        ></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
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
                                            placeholder="Ex: Tests quotidiens - Site principal"
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
                                        >
                                            <option value="2min">Toutes les 2 minutes</option>
                                            <option value="2h">Toutes les 2 heures</option>
                                            <option value="6h">Toutes les 6 heures</option>
                                            <option value="1j">Une fois par jour</option>
                                            <option value="1s">Une fois par semaine</option>
                                            <option value="1m">Une fois par mois</option>
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
                                            Société {!isSuperAdmin && '(Votre société)'}
                                        </label>
                                        <select
                                            className={`form-select ${errors.societe ? 'is-invalid' : ''}`}
                                            id="societe"
                                            name="societe"
                                            value={formData.societe}
                                            onChange={handleInputChange}
                                            disabled={!isSuperAdmin}
                                        >
                                            <option value="">Sélectionner une société</option>
                                            {societes.map(societe => (
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
                                        >
                                            <option value="">Sélectionner un projet</option>
                                            {projets.map(projet => (
                                                <option key={projet.id} value={projet.id}>
                                                    {projet.nom}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.projet && (
                                            <div className="invalid-feedback">
                                                {errors.projet}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <div className="form-check form-switch">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="is_active"
                                                name="is_active"
                                                checked={formData.is_active}
                                                onChange={handleInputChange}
                                            />
                                            <label className="form-check-label" htmlFor="is_active">
                                                Configuration active
                                            </label>
                                        </div>
                                        <small className="form-text text-muted">
                                            Une configuration active sera exécutée selon sa périodicité
                                        </small>
                                    </div>
                                </div>
                            </div>

                            {/* Section Scripts (ManyToMany) */}
                            <div className="row">
                                <div className="col-12">
                                    <div className="mb-3">
                                        <label className="form-label">
                                            Scripts à exécuter *
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
                                                            disabled={scriptsDisponibles.length === 0}
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
                                                                            {script.axe?.nom} / {script.sous_axe?.nom}
                                                                        </small>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-success"
                                                                        onClick={() => ajouterScript(script.id)}
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

                                            {/* Scripts sélectionnés */}
                                            <div className="col-md-5">
                                                <div className="card">
                                                    <div className="card-header d-flex justify-content-between align-items-center">
                                                        <span>Scripts sélectionnés ({scriptsSelectionnes.length})</span>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={retirerTousScripts}
                                                            disabled={scriptsSelectionnes.length === 0}
                                                        >
                                                            ← Tout retirer
                                                        </button>
                                                    </div>
                                                    <div className="card-body p-0">
                                                        <div 
                                                            className="list-group list-group-flush"
                                                            style={{ maxHeight: '200px', overflowY: 'auto' }}
                                                        >
                                                            {scriptsSelectionnes.map(script => (
                                                                <div 
                                                                    key={script.id}
                                                                    className="list-group-item d-flex justify-content-between align-items-center"
                                                                >
                                                                    <div>
                                                                        <strong>{script.nom}</strong>
                                                                        <br />
                                                                        <small className="text-muted">
                                                                            {script.axe?.nom} / {script.sous_axe?.nom}
                                                                        </small>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-danger"
                                                                        onClick={() => retirerScript(script.id)}
                                                                    >
                                                                        <i className="ti ti-minus"></i>
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            {scriptsSelectionnes.length === 0 && (
                                                                <div className="list-group-item text-center text-muted">
                                                                    Aucun script sélectionné
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <small className="form-text text-muted">
                                            {scriptsSelectionnes.length} script(s) sélectionné(s) pour cette configuration
                                        </small>
                                        {errors.scripts && (
                                            <div className="invalid-feedback d-block">
                                                {errors.scripts}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Section Emails de notification */}
                            <div className="row">
                                <div className="col-12">
                                    <div className="mb-3">
                                        <label className="form-label">
                                            Emails de notification
                                        </label>
                                        
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
                                                            disabled={emailsDisponibles.length === 0}
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
                                                                        <strong>{email.nom}</strong>
                                                                        <br />
                                                                        <small className="text-muted">{email.email}</small>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-success"
                                                                        onClick={() => ajouterEmail(email.id)}
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

                                            {/* Emails sélectionnés */}
                                            <div className="col-md-5">
                                                <div className="card">
                                                    <div className="card-header d-flex justify-content-between align-items-center">
                                                        <span>Emails sélectionnés ({emailsSelectionnes.length})</span>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={retirerTousEmails}
                                                            disabled={emailsSelectionnes.length === 0}
                                                        >
                                                            ← Tout retirer
                                                        </button>
                                                    </div>
                                                    <div className="card-body p-0">
                                                        <div 
                                                            className="list-group list-group-flush"
                                                            style={{ maxHeight: '200px', overflowY: 'auto' }}
                                                        >
                                                            {emailsSelectionnes.map(email => (
                                                                <div 
                                                                    key={email.id}
                                                                    className="list-group-item d-flex justify-content-between align-items-center"
                                                                >
                                                                    <div>
                                                                        <strong>{email.nom}</strong>
                                                                        <br />
                                                                        <small className="text-muted">{email.email}</small>
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-sm btn-danger"
                                                                        onClick={() => retirerEmail(email.id)}
                                                                    >
                                                                        <i className="ti ti-minus"></i>
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            {emailsSelectionnes.length === 0 && (
                                                                <div className="list-group-item text-center text-muted">
                                                                    Aucun email sélectionné
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <small className="form-text text-muted">
                                            {emailsSelectionnes.length} email(s) sélectionné(s) pour les notifications
                                        </small>
                                        {errors.emails_notification && (
                                            <div className="invalid-feedback d-block">
                                                {errors.emails_notification}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
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
                                        Création...
                                    </>
                                ) : (
                                    <>
                                        <i className="ti ti-plus me-1"></i>
                                        Créer la configuration
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

export default AjouterConfigurationTestModal;