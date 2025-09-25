import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ModifierUserModal = ({ show, onClose, onUserUpdated, user }) => {
    const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        is_active: true,
        is_staff: false,
        groups: []
    });
    const [groupes, setGroupes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (show && user) {
            // Initialiser les données du formulaire avec les données de l'utilisateur
            setFormData({
                email: user.email || '',
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                is_active: user.is_active !== undefined ? user.is_active : true,
                is_staff: user.is_staff !== undefined ? user.is_staff : false,
                groups: user.groups ? user.groups.map(group => group.id) : []
            });
            fetchGroupes();
        }
    }, [show, user]);

    const fetchGroupes = async () => {
        try {
            const response = await api.get('groupes/');
            setGroupes(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des groupes:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleGroupChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
        setFormData(prev => ({
            ...prev,
            groups: selectedOptions
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Préparer les données pour la mise à jour
            const userData = {
                email: formData.email,
                first_name: formData.first_name,
                last_name: formData.last_name,
                is_active: formData.is_active,
                is_staff: formData.is_staff,
                groups: formData.groups // Les IDs sont déjà des integers
            };

            console.log('Données de mise à jour envoyées:', userData);

            const response = await api.patch(`users/${user.id}/`, userData);
            console.log('Utilisateur modifié avec succès:', response.data);

            onUserUpdated(response.data);
            onClose();
            
        } catch (error) {
            console.error('Erreur lors de la modification:', error);
            
            if (error.response?.data) {
                console.log('Détails de l\'erreur API:', error.response.data);
                
                if (error.response.data.email) {
                    setError('Cet email est déjà utilisé');
                } else if (error.response.data.groups) {
                    setError('Erreur avec les groupes: ' + error.response.data.groups);
                } else if (error.response.data.non_field_errors) {
                    setError(error.response.data.non_field_errors.join(', '));
                } else {
                    const errorMessages = Object.values(error.response.data).flat().join(', ');
                    setError('Erreur de validation: ' + errorMessages);
                }
            } else {
                setError('Erreur de connexion au serveur');
            }
        } finally {
            setLoading(false);
        }
    };

    if (!show || !user) return null;

    return (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Modifier l'Utilisateur</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    {error}
                                </div>
                            )}

                            <div className="row">
                                <div className="col-md-6">
                                    <div className="form-floating mb-3">
                                        <input
                                            type="email"
                                            className="form-control"
                                            id="email"
                                            name="email"
                                            placeholder=" "
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                        <label htmlFor="email">Email *</label>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-6">
                                    <div className="form-floating mb-3">
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="first_name"
                                            name="first_name"
                                            placeholder=" "
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            required
                                        />
                                        <label htmlFor="first_name">Prénom *</label>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="form-floating mb-3">
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="last_name"
                                            name="last_name"
                                            placeholder=" "
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            required
                                        />
                                        <label htmlFor="last_name">Nom *</label>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-12">
                                    <div className="form-floating mb-3">
                                        <select
                                            className="form-select"
                                            id="groups"
                                            name="groups"
                                            multiple
                                            value={formData.groups}
                                            onChange={handleGroupChange}
                                            aria-label="Sélection des groupes"
                                            style={{ height: 'auto', minHeight: '120px' }}
                                        >
                                            <option value="">Sélectionner un ou plusieurs groupes</option>
                                            {groupes.map(groupe => (
                                                <option key={groupe.id} value={groupe.id}>
                                                    {groupe.nom} ({groupe.role_predefini})
                                                </option>
                                            ))}
                                        </select>
                                        <label htmlFor="groups">Groupes</label>
                                    </div>
                                    <small className="form-text text-muted">
                                        Maintenez Ctrl (ou Cmd sur Mac) pour sélectionner plusieurs groupes
                                    </small>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <div className="form-check form-switch">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="is_active"
                                                name="is_active"
                                                checked={formData.is_active}
                                                onChange={handleChange}
                                            />
                                            <label className="form-check-label" htmlFor="is_active">
                                                Compte actif
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <div className="form-check form-switch">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="is_staff"
                                                name="is_staff"
                                                checked={formData.is_staff}
                                                onChange={handleChange}
                                            />
                                            <label className="form-check-label" htmlFor="is_staff">
                                                Accès administrateur
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section pour changer le mot de passe (optionnel) */}
                            
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Annuler
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Modification...' : 'Modifier l\'utilisateur'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ModifierUserModal;