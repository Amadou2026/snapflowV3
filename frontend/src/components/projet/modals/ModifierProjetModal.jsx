import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ModifierProjetModal = ({ show, onClose, onProjetUpdated, projet }) => {
    const [formData, setFormData] = useState({
        nom: '',
        id_redmine: '',
        url: '',
        contrat: '',
        charge_de_compte: '',
        id_redmine_charge_de_compte: '',
        logo: null
    });
    const [currentLogo, setCurrentLogo] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (show && projet) {
            setFormData({
                nom: projet.nom || '',
                id_redmine: projet.id_redmine || '',
                url: projet.url || '',
                contrat: projet.contrat || '',
                charge_de_compte: projet.charge_de_compte || '',
                id_redmine_charge_de_compte: projet.id_redmine_charge_de_compte || '',
                logo: null
            });
            setCurrentLogo(projet.logo || null);
            fetchUsers();
        }
    }, [show, projet]);

    const fetchUsers = async () => {
        try {
            const response = await api.get('users/');
            setUsers(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des utilisateurs:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        setFormData(prev => ({
            ...prev,
            logo: file
        }));
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.nom.trim()) {
            newErrors.nom = 'Le nom du projet est requis';
        }
        if (!formData.url.trim()) {
            newErrors.url = 'L\'URL est requise';
        }
        if (!formData.contrat.trim()) {
            newErrors.contrat = 'Le contrat est requis';
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
            const submitData = new FormData();
            submitData.append('nom', formData.nom);
            submitData.append('url', formData.url);
            submitData.append('contrat', formData.contrat);
            
            if (formData.id_redmine) {
                submitData.append('id_redmine', formData.id_redmine);
            }
            if (formData.charge_de_compte) {
                submitData.append('charge_de_compte', formData.charge_de_compte);
            }
            if (formData.id_redmine_charge_de_compte) {
                submitData.append('id_redmine_charge_de_compte', formData.id_redmine_charge_de_compte);
            }
            if (formData.logo) {
                submitData.append('logo', formData.logo);
            }

            const response = await api.put(`projets/${projet.id}/`, submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            onProjetUpdated(response.data);
            handleClose();
        } catch (error) {
            console.error('Erreur lors de la modification:', error);
            if (error.response?.data) {
                setErrors(error.response.data);
            } else {
                alert('Erreur lors de la modification du projet');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            nom: '',
            id_redmine: '',
            url: '',
            contrat: '',
            charge_de_compte: '',
            id_redmine_charge_de_compte: '',
            logo: null
        });
        setCurrentLogo(null);
        setErrors({});
        onClose();
    };

    if (!show) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="ti ti-edit me-2"></i>
                            Modifier le projet
                        </h5>
                        <button type="button" className="btn-close" onClick={handleClose}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label">
                                        Nom du projet <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
                                        name="nom"
                                        value={formData.nom}
                                        onChange={handleChange}
                                        placeholder="Entrez le nom du projet"
                                    />
                                    {errors.nom && <div className="invalid-feedback">{errors.nom}</div>}
                                </div>

                                <div className="col-md-6 mb-3">
                                    <label className="form-label">ID Redmine</label>
                                    <input
                                        type="number"
                                        className={`form-control ${errors.id_redmine ? 'is-invalid' : ''}`}
                                        name="id_redmine"
                                        value={formData.id_redmine}
                                        onChange={handleChange}
                                        placeholder="ID Redmine"
                                    />
                                    {errors.id_redmine && <div className="invalid-feedback">{errors.id_redmine}</div>}
                                </div>

                                <div className="col-md-12 mb-3">
                                    <label className="form-label">
                                        URL <span className="text-danger">*</span>
                                    </label>
                                    <input
                                        type="url"
                                        className={`form-control ${errors.url ? 'is-invalid' : ''}`}
                                        name="url"
                                        value={formData.url}
                                        onChange={handleChange}
                                        placeholder="https://exemple.com"
                                    />
                                    {errors.url && <div className="invalid-feedback">{errors.url}</div>}
                                </div>

                                <div className="col-md-12 mb-3">
                                    <label className="form-label">
                                        Contrat <span className="text-danger">*</span>
                                    </label>
                                    <textarea
                                        className={`form-control ${errors.contrat ? 'is-invalid' : ''}`}
                                        name="contrat"
                                        value={formData.contrat}
                                        onChange={handleChange}
                                        rows="3"
                                        placeholder="Détails du contrat"
                                    ></textarea>
                                    {errors.contrat && <div className="invalid-feedback">{errors.contrat}</div>}
                                </div>

                                <div className="col-md-6 mb-3">
                                    <label className="form-label">Chargé de compte</label>
                                    <select
                                        className={`form-control ${errors.charge_de_compte ? 'is-invalid' : ''}`}
                                        name="charge_de_compte"
                                        value={formData.charge_de_compte}
                                        onChange={handleChange}
                                    >
                                        <option value="">Sélectionner un utilisateur</option>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>
                                                {user.username || user.email}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.charge_de_compte && <div className="invalid-feedback">{errors.charge_de_compte}</div>}
                                </div>

                                <div className="col-md-6 mb-3">
                                    <label className="form-label">ID Redmine Chargé de compte</label>
                                    <input
                                        type="number"
                                        className={`form-control ${errors.id_redmine_charge_de_compte ? 'is-invalid' : ''}`}
                                        name="id_redmine_charge_de_compte"
                                        value={formData.id_redmine_charge_de_compte}
                                        onChange={handleChange}
                                        placeholder="ID Redmine"
                                    />
                                    {errors.id_redmine_charge_de_compte && <div className="invalid-feedback">{errors.id_redmine_charge_de_compte}</div>}
                                </div>

                                <div className="col-md-12 mb-3">
                                    <label className="form-label">Logo</label>
                                    {currentLogo && (
                                        <div className="mb-2">
                                            <img src={currentLogo} alt="Logo actuel" className="img-thumbnail" style={{ maxHeight: '100px' }} />
                                            <small className="d-block text-muted">Logo actuel</small>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        className={`form-control ${errors.logo ? 'is-invalid' : ''}`}
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                    {errors.logo && <div className="invalid-feedback">{errors.logo}</div>}
                                    <small className="text-muted">Formats acceptés: JPG, PNG, GIF (Max 2MB)</small>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={handleClose} disabled={loading}>
                                Annuler
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                        Modification en cours...
                                    </>
                                ) : (
                                    <>
                                        <i className="ti ti-check me-2"></i>
                                        Modifier
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

export default ModifierProjetModal;