import React, { useState } from 'react';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const AjouterSousAxeModal = ({ show, onClose, onSousAxeAdded, axes }) => {
    const [formData, setFormData] = useState({
        nom: '',
        description: '',
        axe: ''
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'axe' ? parseInt(value) || '' : value
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
            newErrors.nom = 'Le nom du sous-axe est requis';
        }

        if (formData.nom.length > 255) {
            newErrors.nom = 'Le nom ne peut pas dépasser 255 caractères';
        }

        if (!formData.axe) {
            newErrors.axe = 'L\'axe parent est requis';
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
            const response = await api.post('sous-axes/', formData);
            onSousAxeAdded(response.data);
            resetForm();
        } catch (error) {
            console.error('Erreur lors de la création:', error);
            if (error.response?.data) {
                setErrors(error.response.data);
            } else {
                toast.error('Erreur lors de la création du sous-axe');
            }
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            nom: '',
            description: '',
            axe: ''
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
                            Ajouter un Sous-Axe
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
                                            Nom du sous-axe *
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
                                            id="nom"
                                            name="nom"
                                            value={formData.nom}
                                            onChange={handleInputChange}
                                            placeholder="Ex: Sous-axe Stratégique"
                                            maxLength="255"
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
                                        <label htmlFor="axe" className="form-label">
                                            Axe parent *
                                        </label>
                                        <select
                                            className={`form-control ${errors.axe ? 'is-invalid' : ''}`}
                                            id="axe"
                                            name="axe"
                                            value={formData.axe}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Sélectionner un axe</option>
                                            {axes.map(axe => (
                                                <option key={axe.id} value={axe.id}>
                                                    {axe.nom}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.axe && (
                                            <div className="invalid-feedback">
                                                {errors.axe}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-12">
                                    <div className="mb-3">
                                        <label htmlFor="description" className="form-label">
                                            Description
                                        </label>
                                        <textarea
                                            className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                                            id="description"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="Description détaillée du sous-axe..."
                                            rows="4"
                                        />
                                        {errors.description && (
                                            <div className="invalid-feedback">
                                                {errors.description}
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
                                        Créer le sous-axe
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

export default AjouterSousAxeModal;