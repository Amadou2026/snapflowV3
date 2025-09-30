import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../../services/api';

const AjouterProjetModal = ({ show, onClose, onProjetAdded }) => {
    const [formData, setFormData] = useState({
        nom: '',
        id_redmine: '',
        url: '',
        charge_de_compte: '',
        contrat: '' // Ajout du champ contrat
    });
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
            const projetData = {
                nom: formData.nom.trim(),
                id_redmine: formData.id_redmine ? parseInt(formData.id_redmine) : null,
                url: formData.url ? formatUrl(formData.url.trim()) : '',
                charge_de_compte: formData.charge_de_compte || null,
                contrat: formData.contrat.trim() // Ajout du contrat
            };

            console.log('Données envoyées:', projetData);

            const response = await api.post('projets/', projetData);

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
            contrat: ''
        });
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