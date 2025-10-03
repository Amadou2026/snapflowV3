import React, { useState } from 'react';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const AjouterScriptModal = ({ show, onClose, onScriptAdded, projets, axes, sousAxes, priorityOptions, isSuperAdmin }) => {
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

    // Si l'utilisateur n'est pas super admin et n'a qu'un seul projet, le sélectionner automatiquement
    const userProjets = projets || [];
    const hasSingleProject = !isSuperAdmin && userProjets.length === 1;

    // Initialiser le projet si l'utilisateur n'a qu'un seul projet
    React.useEffect(() => {
        if (hasSingleProject && !formData.projet) {
            setFormData(prev => ({
                ...prev,
                projet: userProjets[0].id
            }));
        }
    }, [hasSingleProject, userProjets]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        const newValue = name === 'projet' || name === 'axe' || name === 'sous_axe' || name === 'priorite' 
            ? (value === '' ? '' : parseInt(value))
            : value;

        setFormData(prev => ({
            ...prev,
            [name]: newValue
        }));

        // Réinitialiser le sous-axe si l'axe change
        if (name === 'axe' && value !== formData.axe) {
            setFormData(prev => ({
                ...prev,
                sous_axe: ''
            }));
        }

        // Effacer l'erreur du champ modifié
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
            // Validation du type de fichier
            const allowedExtensions = ['.sh', '.py', '.js', '.bash', '.ps1', '.bat', '.yml', '.yaml'];
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
            
            if (!allowedExtensions.includes(fileExtension)) {
                setErrors(prev => ({
                    ...prev,
                    fichier: `Type de fichier non autorisé. Extensions acceptées: ${allowedExtensions.join(', ')}`
                }));
                return;
            }

            // Validation de la taille (max 10MB)
            const maxSize = 10 * 1024 * 1024; // 10MB
            if (file.size > maxSize) {
                setErrors(prev => ({
                    ...prev,
                    fichier: 'Le fichier est trop volumineux. Taille maximum: 10MB'
                }));
                return;
            }

            setFormData(prev => ({
                ...prev,
                fichier: file
            }));
            setFileName(file.name);
            
            // Effacer l'erreur du fichier si validation réussie
            if (errors.fichier) {
                setErrors(prev => ({
                    ...prev,
                    fichier: ''
                }));
            }
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.nom.trim()) {
            newErrors.nom = 'Le nom du script est requis';
        } else if (formData.nom.length > 255) {
            newErrors.nom = 'Le nom ne peut pas dépasser 255 caractères';
        }

        if (!formData.fichier) {
            newErrors.fichier = 'Le fichier est requis';
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

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.error('Veuillez corriger les erreurs dans le formulaire');
            return;
        }

        setLoading(true);
        try {
            const formDataToSend = new FormData();
            formDataToSend.append('nom', formData.nom.trim());
            formDataToSend.append('fichier', formData.fichier);
            formDataToSend.append('projet', formData.projet);
            formDataToSend.append('axe', formData.axe);
            formDataToSend.append('sous_axe', formData.sous_axe);
            formDataToSend.append('priorite', formData.priorite);

            const response = await api.post('scripts/', formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            onScriptAdded(response.data);
            resetForm();
            toast.success('Script créé avec succès !');
        } catch (error) {
            console.error('Erreur lors de la création:', error);
            if (error.response?.data) {
                // Gérer les erreurs de l'API
                const apiErrors = error.response.data;
                const formattedErrors = {};
                
                Object.keys(apiErrors).forEach(key => {
                    if (Array.isArray(apiErrors[key])) {
                        formattedErrors[key] = apiErrors[key].join(', ');
                    } else {
                        formattedErrors[key] = apiErrors[key];
                    }
                });
                
                setErrors(formattedErrors);
                toast.error('Erreur lors de la création du script');
            } else {
                toast.error('Erreur de connexion lors de la création du script');
            }
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            nom: '',
            fichier: null,
            projet: hasSingleProject ? userProjets[0].id : '',
            axe: '',
            sous_axe: '',
            priorite: 2
        });
        setFileName('');
        setErrors({});
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    // Filtrer les sous-axes en fonction de l'axe sélectionné
    const filteredSousAxes = formData.axe 
        ? sousAxes.filter(sa => sa.axe === parseInt(formData.axe))
        : [];

    if (!show) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="ti ti-plus me-2"></i>
                            Ajouter un Script
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={handleClose}
                            disabled={loading}
                        ></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            {/* Informations sur les permissions */}
                            {!isSuperAdmin && hasSingleProject && (
                                <div className="alert alert-info">
                                    <i className="ti ti-info-circle me-2"></i>
                                    Ce script sera associé à votre projet: <strong>{userProjets[0]?.nom}</strong>
                                </div>
                            )}
                            
                            {!isSuperAdmin && userProjets.length > 1 && (
                                <div className="alert alert-info">
                                    <i className="ti ti-info-circle me-2"></i>
                                    Sélectionnez le projet auquel associer ce script
                                </div>
                            )}

                            {isSuperAdmin && (
                                <div className="alert alert-warning">
                                    <i className="ti ti-shield me-2"></i>
                                    Mode Super Admin - Vous pouvez assigner ce script à n'importe quel projet
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
                                            placeholder="Ex: Script de déploiement V1.0"
                                            maxLength="255"
                                            disabled={loading}
                                        />
                                        {errors.nom && (
                                            <div className="invalid-feedback d-block">
                                                {errors.nom}
                                            </div>
                                        )}
                                        <small className="form-text text-muted">
                                            {formData.nom.length}/255 caractères
                                        </small>
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label htmlFor="fichier" className="form-label">
                                            Fichier script *
                                        </label>
                                        <input
                                            type="file"
                                            className={`form-control ${errors.fichier ? 'is-invalid' : ''}`}
                                            id="fichier"
                                            name="fichier"
                                            onChange={handleFileChange}
                                            accept=".sh,.py,.js,.bash,.ps1,.bat,.yml,.yaml"
                                            disabled={loading}
                                        />
                                        {fileName && (
                                            <small className="form-text text-success">
                                                <i className="ti ti-file-check me-1"></i>
                                                Fichier sélectionné: {fileName}
                                            </small>
                                        )}
                                        {errors.fichier && (
                                            <div className="invalid-feedback d-block">
                                                {errors.fichier}
                                            </div>
                                        )}
                                        <small className="form-text text-muted">
                                            Extensions autorisées: .sh, .py, .js, .bash, .ps1, .bat, .yml, .yaml (max 10MB)
                                        </small>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-4">
                                    <div className="mb-3">
                                        <label htmlFor="projet" className="form-label">
                                            Projet *
                                        </label>
                                        <select
                                            className={`form-control ${errors.projet ? 'is-invalid' : ''}`}
                                            id="projet"
                                            name="projet"
                                            value={formData.projet}
                                            onChange={handleInputChange}
                                            disabled={!isSuperAdmin && hasSingleProject || loading}
                                        >
                                            <option value="">Sélectionner un projet</option>
                                            {userProjets.map(projet => (
                                                <option key={projet.id} value={projet.id}>
                                                    {projet.nom}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.projet && (
                                            <div className="invalid-feedback d-block">
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
                                            disabled={loading}
                                        >
                                            <option value="">Sélectionner un axe</option>
                                            {axes.map(axe => (
                                                <option key={axe.id} value={axe.id}>
                                                    {axe.nom}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.axe && (
                                            <div className="invalid-feedback d-block">
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
                                            disabled={!formData.axe || loading}
                                        >
                                            <option value="">
                                                {formData.axe ? 'Sélectionner un sous-axe' : 'Sélectionnez d\'abord un axe'}
                                            </option>
                                            {filteredSousAxes.map(sousAxe => (
                                                <option key={sousAxe.id} value={sousAxe.id}>
                                                    {sousAxe.nom}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.sous_axe && (
                                            <div className="invalid-feedback d-block">
                                                {errors.sous_axe}
                                            </div>
                                        )}
                                        {formData.axe && filteredSousAxes.length === 0 && (
                                            <small className="form-text text-warning">
                                                Aucun sous-axe disponible pour cet axe
                                            </small>
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
                                            disabled={loading}
                                        >
                                            {Object.entries(priorityOptions).map(([value, option]) => (
                                                <option key={value} value={value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.priorite && (
                                            <div className="invalid-feedback d-block">
                                                {errors.priorite}
                                            </div>
                                        )}
                                        <small className="form-text text-muted">
                                            <span className={`badge ${priorityOptions[formData.priorite]?.class}`}>
                                                {priorityOptions[formData.priorite]?.label}
                                            </span>
                                        </small>
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
                                <i className="ti ti-x me-1"></i>
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
                                        Création en cours...
                                    </>
                                ) : (
                                    <>
                                        <i className="ti ti-plus me-1"></i>
                                        Créer le script
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

export default AjouterScriptModal;