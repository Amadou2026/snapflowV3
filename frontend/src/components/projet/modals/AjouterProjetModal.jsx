import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../../services/api';

const AjouterProjetModal = ({ show, onClose, onProjetAdded }) => {
    const [formData, setFormData] = useState({
        nom: '',
        id_redmine: '',
        url: '',
        charge_de_compte: '',
        contrat: '',
        logo: null
    });
    const [logoPreview, setLogoPreview] = useState(null);
    const [chargesCompte, setChargesCompte] = useState([]);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
        
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

            setFormData(prevState => ({
                ...prevState,
                logo: file
            }));

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
        setFormData(prevState => ({
            ...prevState,
            logo: null
        }));
        setLogoPreview(null);
        // Réinitialiser le champ fichier
        const fileInput = document.getElementById('logo');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.nom.trim()) {
            newErrors.nom = 'Le nom du projet est obligatoire';
        } else if (formData.nom.trim().length < 2) {
            newErrors.nom = 'Le nom doit contenir au moins 2 caractères';
        }

        if (!formData.contrat.trim()) {
            newErrors.contrat = 'Le contrat est obligatoire';
        }

        if (formData.id_redmine && isNaN(formData.id_redmine)) {
            newErrors.id_redmine = 'L\'ID Redmine doit être un nombre';
        }

        if (formData.url && !isValidUrl(formData.url)) {
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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const submitData = new FormData();
            
            // Ajouter les champs texte
            submitData.append('nom', formData.nom.trim());
            submitData.append('contrat', formData.contrat.trim());
            
            if (formData.id_redmine) {
                submitData.append('id_redmine', formData.id_redmine);
            }
            if (formData.url) {
                submitData.append('url', formatUrl(formData.url.trim()));
            }
            if (formData.charge_de_compte) {
                submitData.append('charge_de_compte', formData.charge_de_compte);
            }
            if (formData.logo) {
                submitData.append('logo', formData.logo);
            }

            console.log('Données envoyées:', {
                nom: formData.nom,
                id_redmine: formData.id_redmine,
                url: formData.url,
                charge_de_compte: formData.charge_de_compte,
                contrat: formData.contrat,
                logo: formData.logo ? formData.logo.name : 'Aucun'
            });

            const response = await api.post('projets/', submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success('Projet ajouté avec succès');
            resetForm();
            onProjetAdded(response.data);
        } catch (error) {
            console.error('Erreur lors de l\'ajout:', error);
            
            if (error.response?.data) {
                // Gestion des erreurs de validation Django
                const errorData = error.response.data;
                console.log('Erreurs détaillées:', errorData);
                
                // Mettre à jour les erreurs de formulaire
                const newErrors = {};
                Object.keys(errorData).forEach(key => {
                    newErrors[key] = Array.isArray(errorData[key]) ? errorData[key][0] : errorData[key];
                });
                setErrors(newErrors);

                // Afficher un message toast pour les erreurs générales
                if (errorData.detail) {
                    toast.error(errorData.detail);
                } else if (Object.keys(errorData).length > 0) {
                    toast.error('Veuillez corriger les erreurs dans le formulaire');
                } else {
                    toast.error('Erreur lors de l\'ajout du projet');
                }
            } else {
                toast.error('Erreur de connexion au serveur');
            }
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
        setLogoPreview(null);
        setErrors({});
    };

    const handleClose = () => {
        resetForm();
        onClose();
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
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AjouterProjetModal;