import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const AjouterParametreModal = ({ show, onClose, onParametreAdded }) => {
    const [formData, setFormData] = useState({
        societe: '',
        redmine_url: '',
        redmine_api_key: '',
        email_host_user: '',
        email_host_password: ''
    });
    const [societes, setSocietes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (show) {
            fetchSocietes();
        }
    }, [show]);

    const fetchSocietes = async () => {
        try {
            const response = await api.get('societe/');
            // Filtrer les sociétés qui n'ont pas déjà une configuration
            const societesAvecConfig = response.data.map(societe => societe.id);
            const societesSansConfig = response.data.filter(societe => !societe.configuration);
            setSocietes(societesSansConfig);
        } catch (error) {
            console.error('Erreur lors du chargement des sociétés:', error);
            toast.error('Erreur lors du chargement des sociétés');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.societe) {
            newErrors.societe = 'La société est requise';
        }

        // Validation URL Redmine si fournie
        if (formData.redmine_url && !isValidUrl(formData.redmine_url)) {
            newErrors.redmine_url = 'L\'URL Redmine n\'est pas valide';
        }

        // Validation email si fourni
        if (formData.email_host_user && !/\S+@\S+\.\S+/.test(formData.email_host_user)) {
            newErrors.email_host_user = 'L\'adresse email n\'est pas valide';
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
            const response = await api.post('parametres/', formData);
            onParametreAdded(response.data);
            resetForm();
        } catch (error) {
            console.error('Erreur lors de la création:', error);
            if (error.response?.data) {
                setErrors(error.response.data);
            } else {
                toast.error('Erreur lors de la création des paramètres');
            }
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            societe: '',
            redmine_url: '',
            redmine_api_key: '',
            email_host_user: '',
            email_host_password: ''
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
                            <i className="ti ti-plus me-2"></i>
                            Ajouter des paramètres
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
                                <div className="col-12">
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
                                        >
                                            <option value="">Sélectionnez une société</option>
                                            {societes.map(societe => (
                                                <option key={societe.id} value={societe.id}>
                                                    {societe.nom}
                                                </option>
                                            ))}
                                            {societes.length === 0 && (
                                                <option value="" disabled>
                                                    Toutes les sociétés ont déjà une configuration
                                                </option>
                                            )}
                                        </select>
                                        {errors.societe && (
                                            <div className="invalid-feedback">
                                                {errors.societe}
                                            </div>
                                        )}
                                        <div className="form-text">
                                            Sélectionnez une société qui n'a pas encore de configuration.
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label htmlFor="redmine_url" className="form-label">
                                            URL Redmine
                                        </label>
                                        <input
                                            type="url"
                                            className={`form-control ${errors.redmine_url ? 'is-invalid' : ''}`}
                                            id="redmine_url"
                                            name="redmine_url"
                                            value={formData.redmine_url}
                                            onChange={handleInputChange}
                                            placeholder="https://redmine.example.com"
                                        />
                                        {errors.redmine_url && (
                                            <div className="invalid-feedback">
                                                {errors.redmine_url}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label htmlFor="redmine_api_key" className="form-label">
                                            Clé API Redmine
                                        </label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            id="redmine_api_key"
                                            name="redmine_api_key"
                                            value={formData.redmine_api_key}
                                            onChange={handleInputChange}
                                            placeholder="Votre clé API Redmine"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label htmlFor="email_host_user" className="form-label">
                                            Email d'envoi
                                        </label>
                                        <input
                                            type="email"
                                            className={`form-control ${errors.email_host_user ? 'is-invalid' : ''}`}
                                            id="email_host_user"
                                            name="email_host_user"
                                            value={formData.email_host_user}
                                            onChange={handleInputChange}
                                            placeholder="notifications@example.com"
                                        />
                                        {errors.email_host_user && (
                                            <div className="invalid-feedback">
                                                {errors.email_host_user}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label htmlFor="email_host_password" className="form-label">
                                            Mot de passe email
                                        </label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            id="email_host_password"
                                            name="email_host_password"
                                            value={formData.email_host_password}
                                            onChange={handleInputChange}
                                            placeholder="Mot de passe de l'email"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="alert alert-info">
                                <i className="ti ti-info-circle me-2"></i>
                                <strong>Information :</strong> Tous les champs sont optionnels. Vous pouvez configurer Redmine et/ou l'email plus tard.
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
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Création...
                                    </>
                                ) : (
                                    <>
                                        <i className="ti ti-plus me-1"></i>
                                        Créer les paramètres
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

export default AjouterParametreModal;