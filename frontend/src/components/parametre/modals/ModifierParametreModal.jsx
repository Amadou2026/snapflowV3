import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const ModifierParametreModal = ({ show, onClose, onParametreUpdated, parametre }) => {
    const [formData, setFormData] = useState({
        redmine_url: '',
        redmine_api_key: '',
        email_host_user: '',
        email_host_password: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState({
        redmine: false,
        email: false
    });

    useEffect(() => {
        if (parametre) {
            setFormData({
                redmine_url: parametre.redmine_url || '',
                redmine_api_key: parametre.redmine_api_key || '',
                email_host_user: parametre.email_host_user || '',
                email_host_password: parametre.email_host_password || ''
            });
        }
    }, [parametre]);

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

    const togglePasswordVisibility = (field) => {
        setShowPassword(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const validateForm = () => {
        const newErrors = {};

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
            const response = await api.put(`parametres/${parametre.id}/`, formData);
            onParametreUpdated(response.data);
            setErrors({});
        } catch (error) {
            console.error('Erreur lors de la modification:', error);
            if (error.response?.data) {
                setErrors(error.response.data);
            } else {
                toast.error('Erreur lors de la modification des paramètres');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setErrors({});
        setShowPassword({ redmine: false, email: false });
        onClose();
    };

    if (!show || !parametre) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="ti ti-edit me-2"></i>
                            Modifier les paramètres
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={handleClose}
                        ></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="row mb-4">
                                <div className="col-12">
                                    <div className="card bg-light">
                                        <div className="card-body py-3">
                                            <div className="row align-items-center">
                                                <div className="col-auto">
                                                    <div className="wid-50 hei-50 rounded-circle bg-info d-flex align-items-center justify-content-center">
                                                        <i className="ti ti-building text-white f-20"></i>
                                                    </div>
                                                </div>
                                                <div className="col">
                                                    <h6 className="mb-1">{parametre.societe_nom}</h6>
                                                    <small className="text-muted">Société associée</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <h6 className="mb-3 text-primary">
                                <i className="ti ti-brand-redmine me-2"></i>
                                Configuration Redmine
                            </h6>

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
                                        <div className="input-group">
                                            <input
                                                type={showPassword.redmine ? "text" : "password"}
                                                className="form-control"
                                                id="redmine_api_key"
                                                name="redmine_api_key"
                                                value={formData.redmine_api_key}
                                                onChange={handleInputChange}
                                                placeholder="Votre clé API Redmine"
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary"
                                                onClick={() => togglePasswordVisibility('redmine')}
                                            >
                                                <i className={`ti ti-${showPassword.redmine ? 'eye-off' : 'eye'}`}></i>
                                            </button>
                                        </div>
                                        {/* Supprimé le texte sur la synchronisation */}
                                    </div>
                                </div>
                            </div>

                            <h6 className="mb-3 mt-4 text-primary">
                                <i className="ti ti-mail me-2"></i>
                                Configuration Email
                            </h6>

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
                                        <div className="input-group">
                                            <input
                                                type={showPassword.email ? "text" : "password"}
                                                className="form-control"
                                                id="email_host_password"
                                                name="email_host_password"
                                                value={formData.email_host_password}
                                                onChange={handleInputChange}
                                                placeholder="Mot de passe de l'email"
                                            />
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary"
                                                onClick={() => togglePasswordVisibility('email')}
                                            >
                                                <i className={`ti ti-${showPassword.email ? 'eye-off' : 'eye'}`}></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="alert alert-info mt-3">
                                <i className="ti ti-info-circle me-2"></i>
                                <strong>Note :</strong> Les mots de passe sont stockés de manière sécurisée. Laissez les champs vides si vous ne souhaitez pas les modifier.
                            </div>

                            {/* Supprimé la section de dernière synchronisation */}
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
                                        Modification...
                                    </>
                                ) : (
                                    <>
                                        <i className="ti ti-check me-1"></i>
                                        Modifier les paramètres
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

export default ModifierParametreModal;