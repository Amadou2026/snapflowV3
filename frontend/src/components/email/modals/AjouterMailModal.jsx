import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const AjouterMailModal = ({ show, onClose, onEmailAdded }) => {
    // MODIFIÉ : Ajout des champs prenom et nom
    const [formData, setFormData] = useState({
        prenom: '',
        nom: '',
        email: '',
        societe: '',
        est_actif: true
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
            setSocietes(response.data);
        } catch (error) {
            console.error('Erreur lors du chargement des sociétés:', error);
            toast.error('Erreur lors du chargement des sociétés');
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Effacer l'erreur lorsque l'utilisateur commence à taper
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email.trim()) {
            newErrors.email = 'L\'adresse email est requise';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'L\'adresse email n\'est pas valide';
        }

        if (!formData.societe) {
            newErrors.societe = 'La société est requise';
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
            // L'API recevra maintenant prenom et nom
            const response = await api.post('email-notifications/', formData);
            onEmailAdded(response.data);
            resetForm();
        } catch (error) {
            console.error('Erreur lors de la création:', error);
            if (error.response?.data) {
                // Gère les erreurs pour tous les champs, y compris les nouveaux
                setErrors(error.response.data);
            } else {
                toast.error('Erreur lors de la création de l\'email');
            }
        } finally {
            setLoading(false);
        }
    };

    // MODIFIÉ : Ajout de prenom et nom à la réinitialisation
    const resetForm = () => {
        setFormData({
            prenom: '',
            nom: '',
            email: '',
            societe: '',
            est_actif: true
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
                            Ajouter un email de notification
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={handleClose}
                        ></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            {/* NOUVEAU : Ligne pour le Prénom et le Nom */}
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label htmlFor="prenom" className="form-label">
                                            Prénom
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.prenom ? 'is-invalid' : ''}`}
                                            id="prenom"
                                            name="prenom"
                                            value={formData.prenom}
                                            onChange={handleInputChange}
                                            placeholder="Oussem"
                                        />
                                        {errors.prenom && (
                                            <div className="invalid-feedback">
                                                {errors.prenom}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label htmlFor="nom" className="form-label">
                                            Nom
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
                                            id="nom"
                                            name="nom"
                                            value={formData.nom}
                                            onChange={handleInputChange}
                                            placeholder="Abid"
                                        />
                                        {errors.nom && (
                                            <div className="invalid-feedback">
                                                {errors.nom}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-12">
                                    <div className="mb-3">
                                        <label htmlFor="email" className="form-label">
                                            Adresse email *
                                        </label>
                                        <input
                                            type="email"
                                            className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                                            id="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="exemple@domain.com"
                                        />
                                        {errors.email && (
                                            <div className="invalid-feedback">
                                                {errors.email}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

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
                                        </select>
                                        {errors.societe && (
                                            <div className="invalid-feedback">
                                                {errors.societe}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-12">
                                    <div className="mb-3">
                                        <div className="form-check form-switch">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="est_actif"
                                                name="est_actif"
                                                checked={formData.est_actif}
                                                onChange={handleInputChange}
                                            />
                                            <label className="form-check-label" htmlFor="est_actif">
                                                Email actif pour les notifications
                                            </label>
                                        </div>
                                        <div className="form-text">
                                            Si activé, cet email recevra les notifications des tests.
                                        </div>
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
                                        Créer l'email
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

export default AjouterMailModal;