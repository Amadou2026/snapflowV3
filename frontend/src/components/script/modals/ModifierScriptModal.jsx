import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const ModifierScriptModal = ({ show, onClose, onScriptUpdated, script, projets, axes, sousAxes, priorityOptions, userProjet, isSuperAdmin }) => {
    const [formData, setFormData] = useState({
        nom: '',
        fichier: null,
        projet: '',
        axe: '',
        sous_axe: '',
        priorite: 2
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [fileName, setFileName] = useState('');

    useEffect(() => {
        if (script) {
            setFormData({
                nom: script.nom || '',
                fichier: null, // Ne pas pré-remplir le fichier
                projet: script.projet || '',
                axe: script.axe || '',
                sous_axe: script.sous_axe || '',
                priorite: script.priorite || 2
            });
            setFileName(script.fichier ? 'Fichier existant' : '');
        }
    }, [script]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'projet' || name === 'axe' || name === 'sous_axe' || name === 'priorite' 
                ? parseInt(value) || '' 
                : value
        }));

        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                fichier: file
            }));
            setFileName(file.name);
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.nom.trim()) {
            newErrors.nom = 'Le nom du script est requis';
        }

        if (formData.nom.length > 255) {
            newErrors.nom = 'Le nom ne peut pas dépasser 255 caractères';
        }

        if (!formData.projet) {
            newErrors.projet = 'Le projet est requis';
        }

        if (!formData.axe) {
            newErrors.axe = 'L\'axe est requis';
        }

        if (!formData.sous_axe) {
            newErrors.sous_axe = 'Le sous-axe est requis';
        }

        // Vérification de sécurité pour les non-superadmins
        if (!isSuperAdmin && formData.projet !== userProjet) {
            newErrors.projet = 'Vous ne pouvez pas modifier le projet de ce script';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Vérification de sécurité finale
        if (!isSuperAdmin && formData.projet !== userProjet) {
            toast.error('Action non autorisée');
            return;
        }

        setLoading(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('nom', formData.nom);
            if (formData.fichier) {
                formDataToSend.append('fichier', formData.fichier);
            }
            formDataToSend.append('projet', formData.projet);
            formDataToSend.append('axe', formData.axe);
            formDataToSend.append('sous_axe', formData.sous_axe);
            formDataToSend.append('priorite', formData.priorite);

            const response = await api.put(`scripts/${script.id}/`, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            onScriptUpdated(response.data);
            setErrors({});
        } catch (error) {
            console.error('Erreur lors de la modification:', error);
            if (error.response?.data) {
                setErrors(error.response.data);
            } else {
                toast.error('Erreur lors de la modification du script');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setErrors({});
        onClose();
    };

    // Filtrer les sous-axes en fonction de l'axe sélectionné
    const filteredSousAxes = formData.axe 
        ? sousAxes.filter(sa => sa.axe === parseInt(formData.axe))
        : [];

    // Filtrer les projets disponibles pour les non-superadmins
    const availableProjets = isSuperAdmin 
        ? projets 
        : projets.filter(p => p.id === userProjet);

    if (!show || !script) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="ti ti-edit me-2"></i>
                            Modifier le Script
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={handleClose}
                        ></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            {!isSuperAdmin && (
                                <div className="alert alert-info">
                                    <i className="ti ti-info-circle me-2"></i>
                                    Vous modifiez un script de votre projet. Le champ projet est verrouillé.
                                </div>
                            )}

                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label htmlFor="nom" className="form-label">
                                            Nom du script *
                                        </label>
                                        <input
                                            type="text"
                                            className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
                                            id="nom"
                                            name="nom"
                                            value={formData.nom}
                                            onChange={handleInputChange}
                                            placeholder="Ex: Script de déploiement"
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
                                        <label htmlFor="fichier" className="form-label">
                                            Nouveau fichier (optionnel)
                                        </label>
                                        <input
                                            type="file"
                                            className={`form-control ${errors.fichier ? 'is-invalid' : ''}`}
                                            id="fichier"
                                            name="fichier"
                                            onChange={handleFileChange}
                                            accept=".sh,.py,.js,.bash,.ps1,.bat"
                                        />
                                        {fileName && (
                                            <small className="form-text text-muted">
                                                {fileName === 'Fichier existant' 
                                                    ? 'Fichier actuel conservé' 
                                                    : `Nouveau fichier: ${fileName}`
                                                }
                                            </small>
                                        )}
                                        {errors.fichier && (
                                            <div className="invalid-feedback">
                                                {errors.fichier}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-4">
                                    <div className="mb-3">
                                        <label htmlFor="projet" className="form-label">
                                            Projet {!isSuperAdmin && '(Votre projet)'}
                                        </label>
                                        <select
                                            className={`form-control ${errors.projet ? 'is-invalid' : ''}`}
                                            id="projet"
                                            name="projet"
                                            value={formData.projet}
                                            onChange={handleInputChange}
                                            disabled={!isSuperAdmin}
                                        >
                                            <option value="">Sélectionner un projet</option>
                                            {availableProjets.map(projet => (
                                                <option key={projet.id} value={projet.id}>
                                                    {projet.nom}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.projet && (
                                            <div className="invalid-feedback">
                                                {errors.projet}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="mb-3">
                                        <label htmlFor="axe" className="form-label">
                                            Axe *
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
                                <div className="col-md-4">
                                    <div className="mb-3">
                                        <label htmlFor="sous_axe" className="form-label">
                                            Sous-axe *
                                        </label>
                                        <select
                                            className={`form-control ${errors.sous_axe ? 'is-invalid' : ''}`}
                                            id="sous_axe"
                                            name="sous_axe"
                                            value={formData.sous_axe}
                                            onChange={handleInputChange}
                                            disabled={!formData.axe}
                                        >
                                            <option value="">Sélectionner un sous-axe</option>
                                            {filteredSousAxes.map(sousAxe => (
                                                <option key={sousAxe.id} value={sousAxe.id}>
                                                    {sousAxe.nom}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.sous_axe && (
                                            <div className="invalid-feedback">
                                                {errors.sous_axe}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label htmlFor="priorite" className="form-label">
                                            Priorité
                                        </label>
                                        <select
                                            className={`form-control ${errors.priorite ? 'is-invalid' : ''}`}
                                            id="priorite"
                                            name="priorite"
                                            value={formData.priorite}
                                            onChange={handleInputChange}
                                        >
                                            {Object.entries(priorityOptions).map(([value, option]) => (
                                                <option key={value} value={value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.priorite && (
                                            <div className="invalid-feedback">
                                                {errors.priorite}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Section d'information sur le script actuel */}
                            <div className="row mt-4">
                                <div className="col-12">
                                    <div className="card bg-light">
                                        <div className="card-body">
                                            <h6 className="card-title">
                                                <i className="ti ti-info-circle me-2"></i>
                                                Informations du script actuel
                                            </h6>
                                            <div className="row">
                                                <div className="col-md-6">
                                                    <small className="text-muted">Nom actuel:</small>
                                                    <p className="mb-1">{script.nom}</p>
                                                </div>
                                                <div className="col-md-6">
                                                    <small className="text-muted">Priorité actuelle:</small>
                                                    <p className="mb-1">
                                                        <span className={`badge ${priorityOptions[script.priorite]?.class || 'bg-light-secondary'}`}>
                                                            {priorityOptions[script.priorite]?.label || 'Inconnue'}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
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
                                        Modification...
                                    </>
                                ) : (
                                    <>
                                        <i className="ti ti-check me-1"></i>
                                        Modifier le script
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

export default ModifierScriptModal;