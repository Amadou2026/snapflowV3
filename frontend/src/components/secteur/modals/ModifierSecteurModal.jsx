import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../../services/api';

const ModifierSecteurModal = ({ show, onClose, onSecteurUpdated, secteur }) => {
    const [formData, setFormData] = useState({
        nom: ''
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (secteur) {
            setFormData({
                nom: secteur.nom || ''
            });
        }
    }, [secteur]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
        
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
            newErrors.nom = 'Le nom du secteur est obligatoire';
        } else if (formData.nom.trim().length < 2) {
            newErrors.nom = 'Le nom doit contenir au moins 2 caractères';
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
            await api.put(`secteurs/${secteur.id}/`, {
                nom: formData.nom.trim()
            });

            toast.success('Secteur modifié avec succès');
            onSecteurUpdated();
            onClose();
        } catch (error) {
            console.error('Erreur lors de la modification:', error);
            
            if (error.response?.data) {
                if (error.response.data.nom) {
                    setErrors({ nom: error.response.data.nom });
                } else if (error.response.data.detail) {
                    toast.error(error.response.data.detail);
                } else {
                    toast.error('Erreur lors de la modification du secteur');
                }
            } else {
                toast.error('Erreur de connexion au serveur');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setErrors({});
        onClose();
    };

    if (!show || !secteur) return null;

    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Modifier le secteur</h5>
                        <button type="button" className="btn-close" onClick={handleClose}></button>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label htmlFor="nom" className="form-label">
                                    Nom du secteur <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
                                    id="nom"
                                    name="nom"
                                    value={formData.nom}
                                    onChange={handleInputChange}
                                    placeholder="Ex: Banque, Informatique, Santé..."
                                    disabled={loading}
                                />
                                {errors.nom && (
                                    <div className="invalid-feedback">
                                        {errors.nom}
                                    </div>
                                )}
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
                                        Modification...
                                    </>
                                ) : (
                                    'Modifier'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ModifierSecteurModal;