import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../../services/api';

const AjouterProjetModal = ({ show, onClose, onProjetAdded }) => {
    // État pour suivre le mode de création sélectionné
    const [creationMode, setCreationMode] = useState('manuel');
    
    // État pour le formulaire manuel
    const [formData, setFormData] = useState({
        nom: '',
        id_redmine: '',
        url: '',
        charge_de_compte: '',
        contrat: '',
        logo: null
    });
    
    // État pour le formulaire Redmine
    const [redmineData, setRedmineData] = useState({
        id_redmine: '',
        nom: '',
        url: '',
        charge_de_compte: '',
        contrat: '',
        logo: null
    });
    
    const [logoPreview, setLogoPreview] = useState(null);
    const [chargesCompte, setChargesCompte] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [loadingRedmine, setLoadingRedmine] = useState(false);
    const [errorRedmine, setErrorRedmine] = useState('');

    useEffect(() => {
        if (show) {
            fetchChargesCompte();
        }
    }, [show]);

    const fetchChargesCompte = async () => {
        try {
            const response = await api.get('users/');
            // Filtrer les utilisateurs qui peuvent être chargés de compte
            const charges = response.data.filter(user => 
                user.is_active && (user.is_staff || user.groups?.some(group => 
                    group.nom === 'Chargé de compte' || group.role_predefini === 'CHARGE_COMPTE'
                ))
            );
            setChargesCompte(charges);
        } catch (error) {
            console.error('Erreur lors du chargement des chargés de compte:', error);
        }
    };

    // Fonction pour récupérer les données depuis Redmine
    const fetchRedmineProject = async (projectId) => {
        if (!projectId) {
            setErrorRedmine('');
            return;
        }

        setLoadingRedmine(true);
        setErrorRedmine('');
        
        try {
            // On appelle l'API qui fait un appel direct à Redmine
            const response = await api.get(`/redmine/fetch-project/${projectId}/`);
            const projectData = response.data;

            // On met à jour le formulaire avec les données fraîches de Redmine
            setRedmineData(prev => ({
                ...prev,
                nom: projectData.nom || prev.nom,
                url: projectData.url || prev.url,
            }));

        } catch (err) {
            console.error("Erreur lors de la récupération du projet Redmine:", err);
            if (err.response?.status === 404) {
                setErrorRedmine("Projet non trouvé sur Redmine. Vérifiez l'ID.");
            } else if (err.response?.data?.error) {
                // Affiche le message d'erreur précis envoyé par Django
                setErrorRedmine(err.response.data.error);
            } else {
                setErrorRedmine("Impossible de récupérer les données du projet.");
            }
        } finally {
            setLoadingRedmine(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Mettre à jour le bon état selon le mode de création
        if (creationMode === 'manuel') {
            setFormData(prevState => ({
                ...prevState,
                [name]: value
            }));
        } else if (creationMode === 'redmine') {
            setRedmineData(prevState => ({
                ...prevState,
                [name]: value
            }));
            
            // Si c'est le champ ID Redmine, on récupère les données du projet
            if (name === 'id_redmine') {
                fetchRedmineProject(value);
            }
        }
        
        // Effacer l'erreur du champ quand l'utilisateur tape
        if (errors[name]) {
            setErrors(prevState => ({
                ...prevState,
                [name]: ''
            }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        
        if (file) {
            // Validation du type de fichier
            const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                setErrors(prev => ({
                    ...prev,
                    logo: 'Format de fichier non supporté. Utilisez JPG, PNG, GIF ou WebP.'
                }));
                return;
            }

            // Validation de la taille (max 5MB)
            const maxSize = 5 * 1024 * 1024; // 5MB
            if (file.size > maxSize) {
                setErrors(prev => ({
                    ...prev,
                    logo: 'Le fichier est trop volumineux. Taille maximale: 5MB.'
                }));
                return;
            }

            // Mettre à jour le bon état selon le mode de création
            if (creationMode === 'manuel') {
                setFormData(prevState => ({
                    ...prevState,
                    logo: file
                }));
            } else if (creationMode === 'redmine') {
                setRedmineData(prevState => ({
                    ...prevState,
                    logo: file
                }));
            }

            // Créer une preview du logo
            const reader = new FileReader();
            reader.onload = (e) => {
                setLogoPreview(e.target.result);
            };
            reader.readAsDataURL(file);

            // Effacer l'erreur si tout est valide
            if (errors.logo) {
                setErrors(prevState => ({
                    ...prevState,
                    logo: ''
                }));
            }
        }
    };

    const removeLogo = () => {
        // Mettre à jour le bon état selon le mode de création
        if (creationMode === 'manuel') {
            setFormData(prevState => ({
                ...prevState,
                logo: null
            }));
        } else if (creationMode === 'redmine') {
            setRedmineData(prevState => ({
                ...prevState,
                logo: null
            }));
        }
        
        setLogoPreview(null);
        // Réinitialiser le champ fichier
        const fileInput = document.getElementById('logo');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        // Choisir les données à valider selon le mode de création
        const currentData = creationMode === 'manuel' ? formData : redmineData;

        if (!currentData.nom.trim()) {
            newErrors.nom = 'Le nom du projet est obligatoire';
        } else if (currentData.nom.trim().length < 2) {
            newErrors.nom = 'Le nom doit contenir au moins 2 caractères';
        }

        if (!currentData.contrat.trim()) {
            newErrors.contrat = 'Le contrat est obligatoire';
        }

        if (currentData.id_redmine && isNaN(currentData.id_redmine)) {
            newErrors.id_redmine = 'L\'ID Redmine doit être un nombre';
        }

        if (currentData.url && !isValidUrl(currentData.url)) {
            newErrors.url = 'URL invalide';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const isValidUrl = (string) => {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    };

    const formatUrl = (url) => {
        if (!url) return '';
        return url.startsWith('http') ? url : `https://${url}`;
    };

    // Dans votre composant AjouterProjetModal

const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    setLoading(true);
    try {
        // Choisir les données à soumettre selon le mode de création
        const currentData = creationMode === 'manuel' ? formData : redmineData;
        
        const submitData = new FormData();
        
        // Ajouter les champs texte
        submitData.append('nom', currentData.nom.trim());
        submitData.append('contrat', currentData.contrat.trim());
        
        // Ajouter les champs optionnels seulement s'ils ne sont pas vides
        if (currentData.id_redmine) {
            submitData.append('id_redmine', currentData.id_redmine);
        }
        if (currentData.url) {
            submitData.append('url', formatUrl(currentData.url.trim()));
        }
        if (currentData.charge_de_compte) {
            submitData.append('charge_de_compte', currentData.charge_de_compte);
        }
        if (currentData.logo) {
            submitData.append('logo', currentData.logo);
        }

        // --- DÉBOGAGE : Afficher ce qui est envoyé ---
        console.log("--- Données envoyées à l'API (FormData) ---");
        // FormData ne se logge pas bien, on itère dessus pour voir
        for (let [key, value] of submitData.entries()) {
            console.log(`${key}:`, value);
        }
        console.log("-------------------------------------------");

        // ASSUREZ-VOUS QUE L'URL EST CORRECTE
        // Si votre endpoint est /api/core/projets/, modifiez la ligne ci-dessous
        const response = await api.post('projets/', submitData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        console.log('Réponse du serveur (succès) :', response.data);
        toast.success('Projet ajouté avec succès');
        resetForm();
        onProjetAdded(response.data);
        onClose(); // Fermer le modal après succès

    } catch (error) {
        console.error('--- ERREUR LORS DE L\'AJOUT DU PROJET ---');
        
        // Afficher l'erreur complète dans la console
        console.error("Erreur complète :", error);
        
        // Si l'erreur vient de la réponse du serveur (status 4xx ou 5xx)
        if (error.response) {
            console.error("Status de la réponse :", error.response.status);
            console.error("Headers de la réponse :", error.response.headers);
            console.error("Données de l'erreur (du backend) :", error.response.data);

            // Gestion des erreurs de validation Django (status 400)
            if (error.response.status === 400) {
                const errorData = error.response.data;
                
                // Mettre à jour les erreurs de formulaire pour les afficher à l'utilisateur
                const newErrors = {};
                Object.keys(errorData).forEach(key => {
                    // Gère les erreurs de champ simple et les erreurs de liste
                    const message = Array.isArray(errorData[key]) ? errorData[key][0] : errorData[key];
                    newErrors[key] = message;
                });
                setErrors(newErrors);

                // Afficher un toast pour les erreurs générales (ex: non_field_errors)
                if (errorData.non_field_errors) {
                    toast.error(errorData.non_field_errors.join(', '));
                } else {
                    toast.error('Veuillez corriger les erreurs dans le formulaire.');
                }
            } 
            // Gestion des erreurs de permission (status 403)
            else if (error.response.status === 403) {
                toast.error("Vous n'avez pas la permission d'ajouter un projet.");
            }
            // Gestion des erreurs d'authentification (status 401)
            else if (error.response.status === 401) {
                toast.error("Votre session a expiré. Veuillez vous reconnecter.");
            }
            // Autres erreurs serveur
            else {
                toast.error(`Erreur serveur (${error.response.status}) : ${error.response.data?.detail || 'Erreur inconnue'}`);
            }
        } 
        // Erreur réseau (pas de réponse du serveur)
        else if (error.request) {
            console.error("La requête a été faite mais aucune réponse reçue :", error.request);
            toast.error('Erreur de connexion au serveur. Vérifiez votre réseau.');
        } 
        // Autre erreur (configuration axios, etc.)
        else {
            console.error('Erreur de configuration Axios :', error.message);
            toast.error('Une erreur inattendue est survenue.');
        }
        console.error("-------------------------------------------");
    } finally {
        setLoading(false);
    }
};

    const resetForm = () => {
        setFormData({
            nom: '',
            id_redmine: '',
            url: '',
            charge_de_compte: '',
            contrat: '',
            logo: null
        });
        setRedmineData({
            id_redmine: '',
            nom: '',
            url: '',
            charge_de_compte: '',
            contrat: '',
            logo: null
        });
        setLogoPreview(null);
        setErrors({});
        setErrorRedmine('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const handleModeChange = (mode) => {
        setCreationMode(mode);
        resetForm();
    };

    if (!show) return null;

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Ajouter un projet</h5>
                        <button type="button" className="btn-close" onClick={handleClose}></button>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            {/* Section pour choisir le mode de création */}
                            <div className="mb-4">
                                <label className="form-label fw-bold">Mode de création</label>
                                <div className="row">
                                    <div className="col-md-3">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="creationMode"
                                                id="mode-manuel"
                                                value="manuel"
                                                checked={creationMode === 'manuel'}
                                                onChange={() => handleModeChange('manuel')}
                                            />
                                            <label className="form-check-label" htmlFor="mode-manuel">
                                                Insertion manuelle
                                            </label>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="creationMode"
                                                id="mode-redmine"
                                                value="redmine"
                                                checked={creationMode === 'redmine'}
                                                onChange={() => handleModeChange('redmine')}
                                            />
                                            <label className="form-check-label" htmlFor="mode-redmine">
                                                Depuis Redmine
                                            </label>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="creationMode"
                                                id="mode-jira"
                                                value="jira"
                                                checked={creationMode === 'jira'}
                                                onChange={() => handleModeChange('jira')}
                                                disabled
                                            />
                                            <label className="form-check-label text-muted" htmlFor="mode-jira">
                                                Depuis Jira
                                            </label>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="radio"
                                                name="creationMode"
                                                id="mode-trello"
                                                value="trello"
                                                checked={creationMode === 'trello'}
                                                onChange={() => handleModeChange('trello')}
                                                disabled
                                            />
                                            <label className="form-check-label text-muted" htmlFor="mode-trello">
                                                Depuis Trello
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Formulaire pour l'insertion manuelle */}
                            {creationMode === 'manuel' && (
                                <>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="nom" className="form-label">
                                                    Nom du projet <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
                                                    id="nom"
                                                    name="nom"
                                                    value={formData.nom}
                                                    onChange={handleInputChange}
                                                    placeholder="Ex: Projet Client X, Site Web Y..."
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
                                                <label htmlFor="id_redmine" className="form-label">
                                                    ID Redmine
                                                </label>
                                                <input
                                                    type="number"
                                                    className={`form-control ${errors.id_redmine ? 'is-invalid' : ''}`}
                                                    id="id_redmine"
                                                    name="id_redmine"
                                                    value={formData.id_redmine}
                                                    onChange={handleInputChange}
                                                    placeholder="Ex: 12345"
                                                    disabled={loading}
                                                />
                                                {errors.id_redmine && (
                                                    <div className="invalid-feedback">
                                                        {errors.id_redmine}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="url" className="form-label">
                                                    URL du projet
                                                </label>
                                                <input
                                                    type="url"
                                                    className={`form-control ${errors.url ? 'is-invalid' : ''}`}
                                                    id="url"
                                                    name="url"
                                                    value={formData.url}
                                                    onChange={handleInputChange}
                                                    placeholder="https://www.exemple.com"
                                                    disabled={loading}
                                                />
                                                {errors.url && (
                                                    <div className="invalid-feedback">
                                                        {errors.url}
                                                    </div>
                                                )}
                                                <div className="form-text">
                                                    L'URL doit commencer par http:// ou https://
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="charge_de_compte" className="form-label">
                                                    Chargé de compte
                                                </label>
                                                <select
                                                    className={`form-select ${errors.charge_de_compte ? 'is-invalid' : ''}`}
                                                    id="charge_de_compte"
                                                    name="charge_de_compte"
                                                    value={formData.charge_de_compte}
                                                    onChange={handleInputChange}
                                                    disabled={loading}
                                                >
                                                    <option value="">Sélectionner un chargé de compte</option>
                                                    {chargesCompte.map(user => (
                                                        <option key={user.id} value={user.id}>
                                                            {user.first_name} {user.last_name} ({user.email})
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.charge_de_compte && (
                                                    <div className="invalid-feedback">
                                                        {errors.charge_de_compte}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section Logo */}
                                    <div className="row">
                                        <div className="col-12">
                                            <div className="mb-3">
                                                <label htmlFor="logo" className="form-label">
                                                    Logo du projet
                                                </label>
                                                
                                                {/* Preview du logo */}
                                                {logoPreview && (
                                                    <div className="mb-3">
                                                        <div className="d-flex align-items-center">
                                                            <img 
                                                                src={logoPreview} 
                                                                alt="Aperçu du logo" 
                                                                className="img-thumbnail me-3"
                                                                style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'contain' }}
                                                            />
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-danger btn-sm"
                                                                onClick={removeLogo}
                                                                disabled={loading}
                                                            >
                                                                <i className="ti ti-trash me-1"></i>
                                                                Supprimer
                                                            </button>
                                                        </div>
                                                        <small className="text-muted">
                                                            Aperçu du logo sélectionné
                                                        </small>
                                                    </div>
                                                )}

                                                <input
                                                    type="file"
                                                    className={`form-control ${errors.logo ? 'is-invalid' : ''}`}
                                                    id="logo"
                                                    name="logo"
                                                    onChange={handleFileChange}
                                                    accept="image/jpeg, image/jpg, image/png, image/gif, image/webp"
                                                    disabled={loading}
                                                />
                                                {errors.logo && (
                                                    <div className="invalid-feedback">
                                                        {errors.logo}
                                                    </div>
                                                )}
                                                <div className="form-text">
                                                    Formats acceptés: JPG, PNG, GIF, WebP (Max 5MB). Taille recommandée: 200x200px.
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-12">
                                            <div className="mb-3">
                                                <label htmlFor="contrat" className="form-label">
                                                    Contrat <span className="text-danger">*</span>
                                                </label>
                                                <textarea
                                                    className={`form-control ${errors.contrat ? 'is-invalid' : ''}`}
                                                    id="contrat"
                                                    name="contrat"
                                                    value={formData.contrat}
                                                    onChange={handleInputChange}
                                                    placeholder="Décrivez les termes du contrat, les objectifs, les livrables..."
                                                    rows="4"
                                                    disabled={loading}
                                                />
                                                {errors.contrat && (
                                                    <div className="invalid-feedback">
                                                        {errors.contrat}
                                                    </div>
                                                )}
                                                <div className="form-text">
                                                    Décrivez les termes du contrat, les objectifs du projet et les livrables attendus.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Formulaire pour la création depuis Redmine */}
                            {creationMode === 'redmine' && (
                                <>
                                    <div className="alert alert-info">
                                        <i className="ti ti-info-circle me-2"></i>
                                        Entrez l'ID d'un projet Redmine pour récupérer automatiquement ses informations.
                                    </div>
                                    
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="id_redmine" className="form-label">
                                                    ID Projet Redmine <span className="text-danger">*</span>
                                                </label>
                                                <div className="input-group">
                                                    <input
                                                        type="number"
                                                        className={`form-control ${errors.id_redmine || errorRedmine ? 'is-invalid' : ''}`}
                                                        id="id_redmine"
                                                        name="id_redmine"
                                                        value={redmineData.id_redmine}
                                                        onChange={handleInputChange}
                                                        placeholder="Ex: 12345"
                                                        disabled={loading}
                                                    />
                                                    {loadingRedmine && (
                                                        <span className="input-group-text">
                                                            <span className="spinner-border spinner-border-sm" role="status"></span>
                                                        </span>
                                                    )}
                                                </div>
                                                {errors.id_redmine && (
                                                    <div className="invalid-feedback">
                                                        {errors.id_redmine}
                                                    </div>
                                                )}
                                                {errorRedmine && (
                                                    <div className="invalid-feedback">
                                                        {errorRedmine}
                                                    </div>
                                                )}
                                                <div className="form-text">
                                                    Entrez l'ID du projet et les informations seront récupérées automatiquement.
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="nom" className="form-label">
                                                    Nom du projet <span className="text-danger">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
                                                    id="nom"
                                                    name="nom"
                                                    value={redmineData.nom}
                                                    onChange={handleInputChange}
                                                    placeholder="Le nom sera récupéré depuis Redmine"
                                                    disabled={loading}
                                                />
                                                {errors.nom && (
                                                    <div className="invalid-feedback">
                                                        {errors.nom}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="url" className="form-label">
                                                    URL du projet
                                                </label>
                                                <input
                                                    type="url"
                                                    className={`form-control ${errors.url ? 'is-invalid' : ''}`}
                                                    id="url"
                                                    name="url"
                                                    value={redmineData.url}
                                                    onChange={handleInputChange}
                                                    placeholder="L'URL sera récupérée depuis Redmine"
                                                    disabled={loading}
                                                />
                                                {errors.url && (
                                                    <div className="invalid-feedback">
                                                        {errors.url}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="charge_de_compte" className="form-label">
                                                    Chargé de compte
                                                </label>
                                                <select
                                                    className={`form-select ${errors.charge_de_compte ? 'is-invalid' : ''}`}
                                                    id="charge_de_compte"
                                                    name="charge_de_compte"
                                                    value={redmineData.charge_de_compte}
                                                    onChange={handleInputChange}
                                                    disabled={loading}
                                                >
                                                    <option value="">Sélectionner un chargé de compte</option>
                                                    {chargesCompte.map(user => (
                                                        <option key={user.id} value={user.id}>
                                                            {user.first_name} {user.last_name} ({user.email})
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.charge_de_compte && (
                                                    <div className="invalid-feedback">
                                                        {errors.charge_de_compte}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section Logo */}
                                    <div className="row">
                                        <div className="col-12">
                                            <div className="mb-3">
                                                <label htmlFor="logo" className="form-label">
                                                    Logo du projet
                                                </label>
                                                
                                                {/* Preview du logo */}
                                                {logoPreview && (
                                                    <div className="mb-3">
                                                        <div className="d-flex align-items-center">
                                                            <img 
                                                                src={logoPreview} 
                                                                alt="Aperçu du logo" 
                                                                className="img-thumbnail me-3"
                                                                style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'contain' }}
                                                            />
                                                            <button
                                                                type="button"
                                                                className="btn btn-outline-danger btn-sm"
                                                                onClick={removeLogo}
                                                                disabled={loading}
                                                            >
                                                                <i className="ti ti-trash me-1"></i>
                                                                Supprimer
                                                            </button>
                                                        </div>
                                                        <small className="text-muted">
                                                            Aperçu du logo sélectionné
                                                        </small>
                                                    </div>
                                                )}

                                                <input
                                                    type="file"
                                                    className={`form-control ${errors.logo ? 'is-invalid' : ''}`}
                                                    id="logo"
                                                    name="logo"
                                                    onChange={handleFileChange}
                                                    accept="image/jpeg, image/jpg, image/png, image/gif, image/webp"
                                                    disabled={loading}
                                                />
                                                {errors.logo && (
                                                    <div className="invalid-feedback">
                                                        {errors.logo}
                                                    </div>
                                                )}
                                                <div className="form-text">
                                                    Formats acceptés: JPG, PNG, GIF, WebP (Max 5MB). Taille recommandée: 200x200px.
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-12">
                                            <div className="mb-3">
                                                <label htmlFor="contrat" className="form-label">
                                                    Contrat <span className="text-danger">*</span>
                                                </label>
                                                <textarea
                                                    className={`form-control ${errors.contrat ? 'is-invalid' : ''}`}
                                                    id="contrat"
                                                    name="contrat"
                                                    value={redmineData.contrat}
                                                    onChange={handleInputChange}
                                                    placeholder="Décrivez les termes du contrat, les objectifs, les livrables..."
                                                    rows="4"
                                                    disabled={loading}
                                                />
                                                {errors.contrat && (
                                                    <div className="invalid-feedback">
                                                        {errors.contrat}
                                                    </div>
                                                )}
                                                <div className="form-text">
                                                    Décrivez les termes du contrat, les objectifs du projet et les livrables attendus.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Message pour Jira et Trello (non implémentés) */}
                            {(creationMode === 'jira' || creationMode === 'trello') && (
                                <div className="text-center py-5">
                                    <i className="ti ti-rocket-off display-1 text-muted mb-3"></i>
                                    <h4 className="text-muted">Fonctionnalité bientôt disponible</h4>
                                    <p className="text-muted">
                                        L'intégration avec {creationMode === 'jira' ? 'Jira' : 'Trello'} sera disponible dans une prochaine version.
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleClose}
                                disabled={loading}
                            >
                                Annuler
                            </button>
                            {creationMode !== 'jira' && creationMode !== 'trello' && (
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                            Ajout...
                                        </>
                                    ) : (
                                        'Ajouter le projet'
                                    )}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AjouterProjetModal;