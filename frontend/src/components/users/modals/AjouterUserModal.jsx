import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const AjouterUserModal = ({ show, onClose, onUserAdded }) => {
    const [formData, setFormData] = useState({
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        confirm_password: '',
        is_active: true,
        is_staff: false,
        groups: [],
        societe: ''  // Maintenant obligatoire
    });
    const [groupes, setGroupes] = useState([]);
    const [societes, setSocietes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (show) {
            fetchGroupes();
            fetchSocietes();
        }
    }, [show]);

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
        
        // Effacer l'erreur quand l'utilisateur modifie le champ
        if (error) setError('');
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

        // Validation renforcée
        if (!formData.societe) {
            setError('Veuillez sélectionner une société');
            return;
        }

        if (formData.password !== formData.confirm_password) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        if (formData.password.length < 8) {
            setError('Le mot de passe doit contenir au moins 8 caractères');
            return;
        }

        setLoading(true);

        try {
            // Préparer les données pour l'API
            const userData = {
                email: formData.email,
                first_name: formData.first_name,
                last_name: formData.last_name,
                password: formData.password,
                is_active: formData.is_active,
                is_staff: formData.is_staff,
                groups: formData.groups,
                societe: parseInt(formData.societe)  // Maintenant obligatoire
            };

            console.log('Données envoyées à l\'API:', userData);

            const response = await api.post('users/', userData);
            console.log('Utilisateur créé avec succès:', response.data);

            onUserAdded(response.data);
            resetForm();
            onClose();

        } catch (error) {
            console.error('Erreur lors de la création:', error);

            if (error.response?.data) {
                console.log('Détails de l\'erreur API:', error.response.data);

                if (error.response.data.email) {
                    setError('Cet email est déjà utilisé');
                } else if (error.response.data.societe) {
                    setError('Erreur avec la société: ' + error.response.data.societe);
                } else if (error.response.data.password) {
                    setError('Erreur avec le mot de passe: ' + error.response.data.password);
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

    const resetForm = () => {
        setFormData({
            email: '',
            first_name: '',
            last_name: '',
            password: '',
            confirm_password: '',
            is_active: true,
            is_staff: false,
            groups: [],
            societe: ''
        });
        setError('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!show) return null;

    return (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Ajouter un Utilisateur</h5>
                        <button type="button" className="btn-close" onClick={handleClose}></button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    <i className="ti ti-alert-circle me-2"></i>
                                    {error}
                                </div>
                            )}

                            {/* Section Société - Mise en avant */}
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
                                        />
                                        <label htmlFor="last_name">Nom *</label>
                                    </div>
                                </div>

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
                                            required
                                        />
                                        <label htmlFor="password">Mot de passe *</label>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
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
                                            required
                                        />
                                        <label htmlFor="confirm_password">Confirmer le mot de passe *</label>
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
                                        <label htmlFor="groups">Groupes (optionnel)</label>
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
                                            <br></br>
                                            <small className="form-text text-muted">
                                                Précise si l'utilisateur doit être considéré comme actif.
                                            </small>
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
                                                Statut équipe
                                            </label> <br></br>
                                            <small className="form-text text-muted">
                                                Précise si l'utilisateur peut se connecter à ce site d'administration.
                                            </small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={handleClose}>
                                Annuler
                            </button>
                            <button 
                                type="submit" 
                                className="btn btn-primary" 
                                disabled={loading || !formData.societe}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Création...
                                    </>
                                ) : (
                                    'Créer l\'utilisateur'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AjouterUserModal;