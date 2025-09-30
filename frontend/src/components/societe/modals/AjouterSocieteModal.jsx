import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const AjouterSocieteModal = ({ show, onClose, onSocieteAdded }) => {
    const [formData, setFormData] = useState({
        nom: '',
        num_siret: '',
        url: '',
        secteur_activite: '', // Ce sera maintenant l'ID du secteur
        admin: '', // ID de l'administrateur
        projet: '', // ID du projet
        // employes: [] // Tableau d'IDs des employés
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // États pour les données de référence
    const [secteursActivite, setSecteursActivite] = useState([]);
    const [utilisateurs, setUtilisateurs] = useState([]);
    const [projets, setProjets] = useState([]);
    const [loadingReferences, setLoadingReferences] = useState(false);

    // Charger les données de référence
    useEffect(() => {
        if (show) {
            loadReferenceData();
        }
    }, [show]);

    const loadReferenceData = async () => {
        setLoadingReferences(true);
        try {
            // Charger les secteurs d'activité
            const secteursResponse = await api.get('secteurs/');
            setSecteursActivite(secteursResponse.data);

            // Charger les utilisateurs (non superusers pour l'admin)
            const usersResponse = await api.get('users/?exclude_superadmin=true');
            setUtilisateurs(usersResponse.data);

            // Charger les projets
            const projetsResponse = await api.get('projets/');
            // console.log('Projets:', projetsResponse.data);
            setProjets(projetsResponse.data);
        } catch (error) {
            console.error('Erreur lors du chargement des données de référence:', error);
        } finally {
            setLoadingReferences(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]:
                name === 'secteur_activite' || name === 'admin'
                    ? parseInt(value) || null
                    : value
        }));

        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };


    const handleEmployesChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
        setFormData(prev => ({
            ...prev,
            employes: selectedOptions
        }));
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.nom.trim()) {
            newErrors.nom = 'Le nom de la société est requis';
        }

        if (formData.url && !isValidUrl(formData.url)) {
            newErrors.url = 'URL invalide';
        }

        if (formData.num_siret && !isValidSiret(formData.num_siret)) {
            newErrors.num_siret = 'Le numéro SIRET doit contenir 14 chiffres';
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

    const isValidSiret = (siret) => {
        return /^\d{14}$/.test(siret);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            // Format exact pour le sérialiseur de création
            const dataToSend = {
                nom: formData.nom,
                num_siret: formData.num_siret,
                url: formData.url,
                secteur_activite: parseInt(formData.secteur_activite), // ID seulement
                admin: parseInt(formData.admin) || null, // ID ou null
                projet: formData.projet, // Pour l'instant null si vous n'avez pas de champ projet
            };

            console.log('📤 Données envoyées:', dataToSend);

            const response = await api.post('societe/create/', dataToSend);
            console.log('✅ Réponse API:', response.data);

            onSocieteAdded(response.data);
            resetForm();
        } catch (error) {
            console.error('❌ Erreur:', error);
            if (error.response?.data) {
                console.log('📋 Détails erreur:', error.response.data);
                setErrors(error.response.data);
            }
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            nom: '',
            num_siret: '',
            url: '',
            secteur_activite: '',
            admin: '',
            projet: '',
            employes: []
        });
        setErrors({});
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!show) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="ti ti-building me-2"></i>
                            Ajouter une Société
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
                                            Nom de la société *
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
                                            id="nom"
                                            name="nom"
                                            value={formData.nom}
                                            onChange={handleInputChange}
                                            placeholder="Ex: Attijari Bank"
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
                                        <label htmlFor="num_siret" className="form-label">
                                            Numéro SIRET
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.num_siret ? 'is-invalid' : ''}`}
                                            id="num_siret"
                                            name="num_siret"
                                            value={formData.num_siret}
                                            onChange={handleInputChange}
                                            placeholder="Ex: 00000000000002"
                                            maxLength="14"
                                        />
                                        {errors.num_siret && (
                                            <div className="invalid-feedback">
                                                {errors.num_siret}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label htmlFor="url" className="form-label">
                                            Site Web
                                        </label>
                                        <input
                                            type="url"
                                            className={`form-control ${errors.url ? 'is-invalid' : ''}`}
                                            id="url"
                                            name="url"
                                            value={formData.url}
                                            onChange={handleInputChange}
                                            placeholder="https://www.exemple.com"
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
                                        <label htmlFor="secteur_activite" className="form-label">
                                            Secteur d'activité
                                        </label>
                                        <select
                                            className={`form-control ${errors.secteur_activite ? 'is-invalid' : ''}`}
                                            id="secteur_activite"
                                            name="secteur_activite"
                                            value={formData.secteur_activite}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Sélectionner un secteur</option>
                                            {secteursActivite.map(secteur => (
                                                <option key={secteur.id} value={secteur.id}>
                                                    {secteur.nom}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.secteur_activite && (
                                            <div className="invalid-feedback">
                                                {errors.secteur_activite}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label htmlFor="admin" className="form-label">
                                            Administrateur
                                        </label>
                                        <select
                                            className={`form-control ${errors.admin ? 'is-invalid' : ''}`}
                                            id="admin"
                                            name="admin"
                                            value={formData.admin}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Sélectionner un administrateur</option>
                                            {utilisateurs.map(user => (
                                                <option key={user.id} value={user.id}>
                                                    {user.first_name} {user.last_name} ({user.email})
                                                </option>
                                            ))}
                                        </select>
                                        {errors.admin && (
                                            <div className="invalid-feedback">
                                                {errors.admin}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label htmlFor="projet" className="form-label">
                                            Projet associé
                                        </label>
                                        <select
                                            className={`form-control ${errors.projet ? 'is-invalid' : ''}`}
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

                            {/* <div className="row">
                                <div className="col-12">
                                    <div className="mb-3">
                                        <label htmlFor="employes" className="form-label">
                                            Employés
                                        </label>
                                        <select
                                            multiple
                                            className={`form-control ${errors.employes ? 'is-invalid' : ''}`}
                                            id="employes"
                                            name="employes"
                                            value={formData.employes}
                                            onChange={handleEmployesChange}
                                            size="4"
                                        >
                                            {utilisateurs.map(user => (
                                                <option key={user.id} value={user.id}>
                                                    {user.nom} {user.prenom} ({user.email})
                                                </option>
                                            ))}
                                        </select>
                                        <small className="form-text text-muted">
                                            Maintenez Ctrl (ou Cmd sur Mac) pour sélectionner plusieurs employés
                                        </small>
                                        {errors.employes && (
                                            <div className="invalid-feedback">
                                                {errors.employes}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div> */}
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
                                        Créer la société
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

export default AjouterSocieteModal;