import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const ModifierSocieteModal = ({ show, onClose, onSocieteUpdated, societe }) => {
    const [formData, setFormData] = useState({
        nom: '',
        num_siret: '',
        url: '',
        secteur_activite: ''
    });
    const [secteurs, setSecteurs] = useState([]); // État pour stocker la liste des secteurs
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [loadingSecteurs, setLoadingSecteurs] = useState(false);

    // Charger la liste des secteurs d'activité
    useEffect(() => {
        const fetchSecteurs = async () => {
            setLoadingSecteurs(true);
            try {
                const response = await api.get('secteurs/');
                setSecteurs(response.data);
            } catch (error) {
                console.error('Erreur lors du chargement des secteurs:', error);
                toast.error('Erreur lors du chargement des secteurs');
            } finally {
                setLoadingSecteurs(false);
            }
        };

        if (show) {
            fetchSecteurs();
        }
    }, [show]);

    useEffect(() => {
        if (societe) {
            setFormData({
                nom: societe.nom || '',
                num_siret: societe.num_siret || '',
                url: societe.url || '',
                secteur_activite: societe.secteur_activite || ''
            });
        }
    }, [societe]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.nom.trim()) {
            newErrors.nom = 'Le nom de la société est requis';
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            const response = await api.put(`societe/${societe.id}/update/`, formData);
            onSocieteUpdated(response.data);
            setErrors({});
        } catch (error) {
            console.error('Erreur lors de la modification:', error);
            if (error.response?.data) {
                setErrors(error.response.data);
            } else {
                alert('Erreur lors de la modification de la société');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setErrors({});
        onClose();
    };

    if (!show || !societe) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="ti ti-edit me-2"></i>
                            Modifier la société
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
                                            className={`form-select ${errors.secteur_activite ? 'is-invalid' : ''}`}
                                            id="secteur_activite"
                                            name="secteur_activite"
                                            value={formData.secteur_activite}
                                            onChange={handleInputChange}
                                            disabled={loadingSecteurs}
                                        >
                                            <option value="">Sélectionnez un secteur</option>
                                            {secteurs.map((secteur) => (
                                                <option key={secteur.id} value={secteur.nom}>
                                                    {secteur.nom}
                                                </option>
                                            ))}
                                        </select>
                                        {loadingSecteurs && (
                                            <div className="form-text">
                                                <small>Chargement des secteurs...</small>
                                            </div>
                                        )}
                                        {errors.secteur_activite && (
                                            <div className="invalid-feedback">
                                                {errors.secteur_activite}
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
                                disabled={loading || loadingSecteurs}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Modification...
                                    </>
                                ) : (
                                    <>
                                        <i className="ti ti-check me-1"></i>
                                        Modifier la société
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

export default ModifierSocieteModal;