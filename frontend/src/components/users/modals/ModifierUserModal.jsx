import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ModifierUserModal = ({ show, onClose, onUserUpdated, user }) => {
    const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        is_active: true,
        is_staff: false,
        groups: [],
        societe: '',
        password: '',
        confirm_password: ''
    });
    const [groupes, setGroupes] = useState([]);
    const [societes, setSocietes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showPasswordFields, setShowPasswordFields] = useState(false);

    useEffect(() => {
        if (show && user) {
            // Initialiser les données du formulaire avec les données de l'utilisateur
            setFormData({
                email: user.email || '',
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                is_active: user.is_active !== undefined ? user.is_active : true,
                is_staff: user.is_staff !== undefined ? user.is_staff : false,
                groups: user.groups && user.groups.length > 0
                    ? user.groups.map(group => typeof group === 'object' ? group.id : group)
                    : [],
                societe: user.societe ? user.societe.id || user.societe : '',
                password: '',
                confirm_password: ''
            });
            setShowPasswordFields(false);
            setError('');
            setSuccessMessage('');
            fetchGroupes();
            fetchSocietes();
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

    const fetchSocietes = async () => {
        try {
            const response = await api.get('societe/');
            setSocietes(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des sociétés:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Effacer les messages d'erreur quand l'utilisateur tape
        if (error) setError('');
        if (successMessage) setSuccessMessage('');
    };

    const handleGroupChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
        setFormData(prev => ({
            ...prev,
            groups: selectedOptions
        }));
    };

    const togglePasswordFields = () => {
        setShowPasswordFields(!showPasswordFields);
        // Réinitialiser les champs mot de passe quand on masque
        if (showPasswordFields) {
            setFormData(prev => ({
                ...prev,
                password: '',
                confirm_password: ''
            }));
        }
        setError('');
        setSuccessMessage('');
    };

    const validateForm = () => {
        // Validation de la société (maintenant obligatoire)
        if (!formData.societe) {
            setError('Veuillez sélectionner une société');
            return false;
        }

        // Validation des mots de passe si les champs sont visibles et remplis
        if (showPasswordFields && formData.password) {
            if (formData.password.length < 8) {
                setError('Le mot de passe doit contenir au moins 8 caractères');
                return false;
            }
            
            if (formData.password !== formData.confirm_password) {
                setError('Les mots de passe ne correspondent pas');
                return false;
            }
        }
        return true;
    };

    const changeUserPassword = async () => {
        if (!formData.password) {
            return true; // Pas de changement de mot de passe demandé
        }

        setPasswordLoading(true);
        try {
            // Utiliser le nouvel endpoint admin pour changer le mot de passe
            const passwordData = {
                new_password: formData.password,
                confirm_password: formData.confirm_password
            };

            // console.log('Changement de mot de passe admin:', passwordData);

            const response = await api.post(`users/${user.id}/admin-change-password/`, passwordData);

            // console.log('Mot de passe modifié avec succès:', response.data);
            setSuccessMessage('Mot de passe modifié avec succès');
            return true;
        } catch (error) {
            // console.error('Erreur lors du changement de mot de passe:', error);
            if (error.response?.data) {
                const errorData = error.response.data;
                
                // Gestion des erreurs spécifiques
                if (errorData.new_password) {
                    setError('Erreur avec le nouveau mot de passe: ' + errorData.new_password);
                } else if (errorData.confirm_password) {
                    setError('Erreur de confirmation: ' + errorData.confirm_password);
                } else if (errorData.detail) {
                    setError('Erreur: ' + errorData.detail);
                } else {
                    // Afficher la première erreur trouvée
                    const firstError = Object.values(errorData)[0];
                    setError('Erreur: ' + (Array.isArray(firstError) ? firstError[0] : firstError));
                }
            } else {
                setError('Erreur de connexion lors du changement de mot de passe');
            }
            return false;
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            // 1. Changer le mot de passe si demandé
            let passwordChanged = true;
            if (showPasswordFields && formData.password) {
                passwordChanged = await changeUserPassword();
                if (!passwordChanged) {
                    setLoading(false);
                    return; // Arrêter si erreur de mot de passe
                }
            }

            // 2. Mettre à jour les autres informations utilisateur
            const userData = {
                email: formData.email,
                first_name: formData.first_name,
                last_name: formData.last_name,
                is_active: formData.is_active,
                is_staff: formData.is_staff,
                groups: formData.groups,
                societe: parseInt(formData.societe)  // Maintenant obligatoire
            };

            // console.log('Données de mise à jour envoyées:', userData);

            const response = await api.patch(`users/${user.id}/`, userData);
            // console.log('Utilisateur modifié avec succès:', response.data);

            // Afficher un message de succès combiné
            if (showPasswordFields && formData.password) {
                setSuccessMessage('Utilisateur et mot de passe modifiés avec succès');
            } else {
                setSuccessMessage('Utilisateur modifié avec succès');
            }

            // Fermer après un délai
            setTimeout(() => {
                onUserUpdated(response.data);
                onClose();
            }, 1500);

        } catch (error) {
            // console.error('Erreur lors de la modification:', error);

            if (error.response?.data) {
                // console.log('Détails de l\'erreur API:', error.response.data);

                if (error.response.data.email) {
                    setError('Cet email est déjà utilisé');
                } else if (error.response.data.groups) {
                    setError('Erreur avec les groupes: ' + error.response.data.groups);
                } else if (error.response.data.societe) {
                    setError('Erreur avec la société: ' + error.response.data.societe);
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
                                    <i className="ti ti-alert-circle me-2"></i>
                                    {error}
                                </div>
                            )}

                            {successMessage && (
                                <div className="alert alert-success" role="alert">
                                    <i className="ti ti-check me-2"></i>
                                    {successMessage}
                                </div>
                            )}

                            {/* Section Société - Mise en avant comme obligatoire */}
                            <div className="card bg-light mb-4">
                                <div className="card-body">
                                    <div className="row">
                                        <div className="col-12">
                                            <div className="form-floating mb-3">
                                                <select
                                                    className={`form-control ${error && !formData.societe ? 'is-invalid' : ''}`}
                                                    id="societe"
                                                    name="societe"
                                                    value={formData.societe}
                                                    onChange={handleChange}
                                                    required
                                                >
                                                    <option value="">Sélectionner une société *</option>
                                                    {societes.map(societe => (
                                                        <option key={societe.id} value={societe.id}>
                                                            {societe.nom}
                                                        </option>
                                                    ))}
                                                </select>
                                                <label htmlFor="societe" className="text-primary">
                                                    Société <span className="text-danger">*</span>
                                                </label>
                                                <div className="form-text text-primary">
                                                    <i className="ti ti-info-circle me-1"></i>
                                                    L'association à une société est obligatoire pour cet utilisateur.
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

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
                                            autoComplete="email"
                                        />
                                        <label htmlFor="email">Email *</label>
                                    </div>
                                </div>

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
                                            autoComplete="given-name"
                                        />
                                        <label htmlFor="first_name">Prénom *</label>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
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
                                            autoComplete="family-name"
                                        />
                                        <label htmlFor="last_name">Nom *</label>
                                    </div>
                                </div>
                            </div>

                            {/* Section pour changer le mot de passe */}
                            <div className="row mb-3">
                                <div className="col-12">
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h6 className="mb-1">Changer le mot de passe</h6>
                                                    <small className="text-muted">
                                                        Optionnel - Laissez vide pour conserver le mot de passe actuel
                                                    </small>
                                                </div>
                                                <button
                                                    type="button"
                                                    className={`btn btn-sm ${showPasswordFields ? 'btn-outline-danger' : 'btn-outline-primary'}`}
                                                    onClick={togglePasswordFields}
                                                    disabled={loading || passwordLoading}
                                                >
                                                    {showPasswordFields ? (
                                                        <>
                                                            <i className="ti ti-x me-1"></i>
                                                            Annuler
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="ti ti-key me-1"></i>
                                                            Modifier le mot de passe
                                                        </>
                                                    )}
                                                </button>
                                            </div>

                                            {showPasswordFields && (
                                                <div className="row mt-3">
                                                    <div className="col-md-6">
                                                        <div className="form-floating mb-3">
                                                            <input
                                                                type="password"
                                                                className="form-control"
                                                                id="password"
                                                                name="password"
                                                                placeholder=" "
                                                                value={formData.password}
                                                                onChange={handleChange}
                                                                autoComplete="new-password"
                                                                disabled={passwordLoading}
                                                            />
                                                            <label htmlFor="password">Nouveau mot de passe</label>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <div className="form-floating mb-3">
                                                            <input
                                                                type="password"
                                                                className="form-control"
                                                                id="confirm_password"
                                                                name="confirm_password"
                                                                placeholder=" "
                                                                value={formData.confirm_password}
                                                                onChange={handleChange}
                                                                autoComplete="new-password"
                                                                disabled={passwordLoading}
                                                            />
                                                            <label htmlFor="confirm_password">Confirmer le mot de passe</label>
                                                        </div>
                                                    </div>
                                                    <div className="col-12">
                                                        <small className="text-muted">
                                                            Le mot de passe doit contenir au moins 8 caractères
                                                        </small>
                                                        {passwordLoading && (
                                                            <div className="mt-2">
                                                                <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                                                                <small className="text-muted">Changement du mot de passe...</small>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
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
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                                Annuler
                            </button>
                            <button 
                                type="submit" 
                                className="btn btn-primary" 
                                disabled={loading || passwordLoading || !formData.societe}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Modification...
                                    </>
                                ) : (
                                    'Modifier l\'utilisateur'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ModifierUserModal;