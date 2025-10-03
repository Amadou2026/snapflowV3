import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const ModifierSocieteModal = ({ show, onClose, onSocieteUpdated, societe }) => {
    const [formData, setFormData] = useState({
        nom: '',
        num_siret: '',
        url: '',
        secteur_activite: '', // ID du secteur
        projets: [], // Array d'IDs de projets
        employes: [] // Array d'IDs d'employés
    });
    const [secteurs, setSecteurs] = useState([]);
    const [utilisateurs, setUtilisateurs] = useState([]);
    const [projets, setProjets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [loadingReferences, setLoadingReferences] = useState(false);

    // États pour les employés (séparés)
    const [employesDisponibles, setEmployesDisponibles] = useState([]);
    const [employesActuels, setEmployesActuels] = useState([]);

    // États pour les projets (séparés)
    const [projetsDisponibles, setProjetsDisponibles] = useState([]);
    const [projetsActuels, setProjetsActuels] = useState([]);

    // Charger les données de référence
    useEffect(() => {
        if (show) {
            loadReferenceData();
        }
    }, [show]);

    // Mettre à jour le formulaire quand les données de référence sont chargées
    useEffect(() => {
        if (societe && secteurs.length > 0 && utilisateurs.length > 0 && projets.length > 0) {
            initializeFormData();
        }
    }, [societe, secteurs, utilisateurs, projets]);

    const initializeFormData = async () => {
        try {
            // Récupérer les détails complets de la société
            const response = await api.get(`societe/${societe.id}/`);
            const societeDetails = response.data;

            // Trouver l'ID du secteur d'activité
            const secteurTrouve = secteurs.find(secteur => 
                secteur.nom === societeDetails.secteur_activite
            );

            // Préparer les IDs des employés
            const employesIds = societeDetails.employes 
                ? societeDetails.employes.map(employe => employe.id)
                : [];

            // Préparer les IDs des projets
            const projetsIds = societeDetails.projets 
                ? societeDetails.projets.map(projet => projet.id)
                : [];

            setFormData({
                nom: societeDetails.nom || '',
                num_siret: societeDetails.num_siret || '',
                url: societeDetails.url || '',
                secteur_activite: secteurTrouve?.id || '',
                employes: employesIds,
                projets: projetsIds
            });

            // Mettre à jour les listes d'employés et de projets
            updateEmployesLists(employesIds);
            updateProjetsLists(projetsIds);

        } catch (error) {
            console.error('Erreur lors du chargement des détails de la société:', error);
            toast.error('Erreur lors du chargement des données de la société');
            
            // Fallback avec les données de base
            const secteurTrouve = secteurs.find(secteur => 
                secteur.nom === societe.secteur_activite
            );
            
            setFormData({
                nom: societe.nom || '',
                num_siret: societe.num_siret || '',
                url: societe.url || '',
                secteur_activite: secteurTrouve?.id || '',
                employes: [],
                projets: []
            });
            
            updateEmployesLists([]);
            updateProjetsLists([]);
        }
    };

    const loadReferenceData = async () => {
        setLoadingReferences(true);
        try {
            const [secteursResponse, usersResponse, projetsResponse] = await Promise.all([
                api.get('secteurs/'),
                api.get('users/?exclude_superadmin=true'),
                api.get('projets/')
            ]);
            
            setSecteurs(secteursResponse.data);
            setUtilisateurs(usersResponse.data);
            setProjets(projetsResponse.data);

        } catch (error) {
            console.error('Erreur lors du chargement des données de référence:', error);
            toast.error('Erreur lors du chargement des données de référence');
        } finally {
            setLoadingReferences(false);
        }
    };

    const updateEmployesLists = (employesIds) => {
        const employesActuelsList = utilisateurs.filter(user => 
            employesIds.includes(user.id)
        );
        const employesDisponiblesList = utilisateurs.filter(user => 
            !employesIds.includes(user.id)
        );
        
        setEmployesActuels(employesActuelsList);
        setEmployesDisponibles(employesDisponiblesList);
    };

    const updateProjetsLists = (projetsIds) => {
        const projetsActuelsList = projets.filter(projet => 
            projetsIds.includes(projet.id)
        );
        const projetsDisponiblesList = projets.filter(projet => 
            !projetsIds.includes(projet.id)
        );
        
        setProjetsActuels(projetsActuelsList);
        setProjetsDisponibles(projetsDisponiblesList);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    // Gestion des employés
    const ajouterEmploye = (employeId) => {
        const employeIdInt = parseInt(employeId);
        if (!formData.employes.includes(employeIdInt)) {
            const nouveauxEmployes = [...formData.employes, employeIdInt];
            setFormData(prev => ({
                ...prev,
                employes: nouveauxEmployes
            }));
            updateEmployesLists(nouveauxEmployes);
        }
    };

    const retirerEmploye = (employeId) => {
        const employeIdInt = parseInt(employeId);
        const nouveauxEmployes = formData.employes.filter(id => id !== employeIdInt);
        setFormData(prev => ({
            ...prev,
            employes: nouveauxEmployes
        }));
        updateEmployesLists(nouveauxEmployes);
    };

    const ajouterTousEmployes = () => {
        const tousEmployesIds = employesDisponibles.map(emp => emp.id);
        const nouveauxEmployes = [...formData.employes, ...tousEmployesIds];
        setFormData(prev => ({
            ...prev,
            employes: nouveauxEmployes
        }));
        updateEmployesLists(nouveauxEmployes);
    };

    const retirerTousEmployes = () => {
        setFormData(prev => ({
            ...prev,
            employes: []
        }));
        updateEmployesLists([]);
    };

    // Gestion des projets
    const ajouterProjet = (projetId) => {
        const projetIdInt = parseInt(projetId);
        if (!formData.projets.includes(projetIdInt)) {
            const nouveauxProjets = [...formData.projets, projetIdInt];
            setFormData(prev => ({
                ...prev,
                projets: nouveauxProjets
            }));
            updateProjetsLists(nouveauxProjets);
        }
    };

    const retirerProjet = (projetId) => {
        const projetIdInt = parseInt(projetId);
        const nouveauxProjets = formData.projets.filter(id => id !== projetIdInt);
        setFormData(prev => ({
            ...prev,
            projets: nouveauxProjets
        }));
        updateProjetsLists(nouveauxProjets);
    };

    const ajouterTousProjets = () => {
        const tousProjetsIds = projetsDisponibles.map(proj => proj.id);
        const nouveauxProjets = [...formData.projets, ...tousProjetsIds];
        setFormData(prev => ({
            ...prev,
            projets: nouveauxProjets
        }));
        updateProjetsLists(nouveauxProjets);
    };

    const retirerTousProjets = () => {
        setFormData(prev => ({
            ...prev,
            projets: []
        }));
        updateProjetsLists([]);
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.nom.trim()) {
            newErrors.nom = 'Le nom de la société est requis';
        }

        if (formData.num_siret && !/^\d{14}$/.test(formData.num_siret.replace(/\s/g, ''))) {
            newErrors.num_siret = 'Le numéro SIRET doit contenir 14 chiffres';
        }

        if (formData.url && !isValidUrl(formData.url)) {
            newErrors.url = 'URL invalide';
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
            // Préparer les données pour l'API
            const dataToSend = {
                nom: formData.nom.trim(),
                num_siret: formData.num_siret || '',
                url: formData.url || '',
                secteur_activite: formData.secteur_activite ? parseInt(formData.secteur_activite) : null,
                projets: formData.projets,
                employes: formData.employes
            };

            console.log('📤 Données envoyées pour modification:', dataToSend);

            const response = await api.put(`societe/${societe.id}/update/`, dataToSend);
            
            toast.success('Société modifiée avec succès');
            onSocieteUpdated(response.data);
            handleClose();
        } catch (error) {
            console.error('Erreur lors de la modification:', error);
            if (error.response?.data) {
                setErrors(error.response.data);
                toast.error('Erreur lors de la modification de la société');
            } else {
                toast.error('Erreur lors de la modification de la société');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({
            nom: '',
            num_siret: '',
            url: '',
            secteur_activite: '',
            projets: [],
            employes: []
        });
        setErrors({});
        setEmployesActuels([]);
        setEmployesDisponibles([]);
        setProjetsActuels([]);
        setProjetsDisponibles([]);
        onClose();
    };

    if (!show || !societe) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="ti ti-edit me-2"></i>
                            Modifier la société - {societe.nom}
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
                            {loadingReferences ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Chargement...</span>
                                    </div>
                                    <p className="mt-2">Chargement des données...</p>
                                </div>
                            ) : (
                                <>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="nom" className="form-label">
                                                    Nom de la société *
                                                </label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.nom ? 'is-invalid' : ''}`}
                                                    id="nom"
                                                    name="nom"
                                                    value={formData.nom}
                                                    onChange={handleInputChange}
                                                    placeholder="Ex: Attijari Bank"
                                                    disabled={loading}
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
                                                <label htmlFor="num_siret" className="form-label">
                                                    Numéro SIRET
                                                </label>
                                                <input
                                                    type="text"
                                                    className={`form-control ${errors.num_siret ? 'is-invalid' : ''}`}
                                                    id="num_siret"
                                                    name="num_siret"
                                                    value={formData.num_siret}
                                                    onChange={handleInputChange}
                                                    placeholder="Ex: 00000000000002"
                                                    maxLength="14"
                                                    disabled={loading}
                                                />
                                                {errors.num_siret && (
                                                    <div className="invalid-feedback">
                                                        {errors.num_siret}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="url" className="form-label">
                                                    Site Web
                                                </label>
                                                <input
                                                    type="url"
                                                    className={`form-control ${errors.url ? 'is-invalid' : ''}`}
                                                    id="url"
                                                    name="url"
                                                    value={formData.url}
                                                    onChange={handleInputChange}
                                                    placeholder="https://www.exemple.com"
                                                    disabled={loading}
                                                />
                                                {errors.url && (
                                                    <div className="invalid-feedback">
                                                        {errors.url}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label htmlFor="secteur_activite" className="form-label">
                                                    Secteur d'activité
                                                </label>
                                                <select
                                                    className={`form-select ${errors.secteur_activite ? 'is-invalid' : ''}`}
                                                    id="secteur_activite"
                                                    name="secteur_activite"
                                                    value={formData.secteur_activite}
                                                    onChange={handleInputChange}
                                                    disabled={loading || loadingReferences}
                                                >
                                                    <option value="">Sélectionnez un secteur</option>
                                                    {secteurs.map((secteur) => (
                                                        <option key={secteur.id} value={secteur.id}>
                                                            {secteur.nom}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.secteur_activite && (
                                                    <div className="invalid-feedback">
                                                        {errors.secteur_activite}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section Projets (ManyToMany) */}
                                    <div className="row">
                                        <div className="col-12">
                                            <div className="mb-3">
                                                <label className="form-label">
                                                    Projets Associés
                                                </label>
                                                
                                                <div className="row">
                                                    {/* Projets disponibles */}
                                                    <div className="col-md-5">
                                                        <div className="card">
                                                            <div className="card-header d-flex justify-content-between align-items-center">
                                                                <span>Projets disponibles ({projetsDisponibles.length})</span>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-primary"
                                                                    onClick={ajouterTousProjets}
                                                                    disabled={projetsDisponibles.length === 0 || loading}
                                                                >
                                                                    Tout ajouter →
                                                                </button>
                                                            </div>
                                                            <div className="card-body p-0">
                                                                <div 
                                                                    className="list-group list-group-flush"
                                                                    style={{ maxHeight: '200px', overflowY: 'auto' }}
                                                                >
                                                                    {projetsDisponibles.map(projet => (
                                                                        <div 
                                                                            key={projet.id}
                                                                            className="list-group-item d-flex justify-content-between align-items-center"
                                                                        >
                                                                            <div>
                                                                                <strong>{projet.nom}</strong>
                                                                                <br />
                                                                                <small className="text-muted">
                                                                                    {projet.charge_de_compte_nom && (
                                                                                        <>Chargé: {projet.charge_de_compte_nom}</>
                                                                                    )}
                                                                                </small>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-sm btn-success"
                                                                                onClick={() => ajouterProjet(projet.id)}
                                                                                disabled={loading}
                                                                            >
                                                                                <i className="ti ti-plus"></i>
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                    {projetsDisponibles.length === 0 && (
                                                                        <div className="list-group-item text-center text-muted">
                                                                            Aucun projet disponible
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Boutons de transfert */}
                                                    <div className="col-md-2 d-flex align-items-center justify-content-center">
                                                        <div className="text-center">
                                                            <i className="ti ti-arrow-right" style={{ fontSize: '1.5rem' }}></i>
                                                        </div>
                                                    </div>

                                                    {/* Projets actuels */}
                                                    <div className="col-md-5">
                                                        <div className="card">
                                                            <div className="card-header d-flex justify-content-between align-items-center">
                                                                <span>Projets de la société ({projetsActuels.length})</span>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={retirerTousProjets}
                                                                    disabled={projetsActuels.length === 0 || loading}
                                                                >
                                                                    ← Tout retirer
                                                                </button>
                                                            </div>
                                                            <div className="card-body p-0">
                                                                <div 
                                                                    className="list-group list-group-flush"
                                                                    style={{ maxHeight: '200px', overflowY: 'auto' }}
                                                                >
                                                                    {projetsActuels.map(projet => (
                                                                        <div 
                                                                            key={projet.id}
                                                                            className="list-group-item d-flex justify-content-between align-items-center"
                                                                        >
                                                                            <div>
                                                                                <strong>{projet.nom}</strong>
                                                                                <br />
                                                                                <small className="text-muted">
                                                                                    {projet.charge_de_compte_nom && (
                                                                                        <>Chargé: {projet.charge_de_compte_nom}</>
                                                                                    )}
                                                                                </small>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-sm btn-danger"
                                                                                onClick={() => retirerProjet(projet.id)}
                                                                                disabled={loading}
                                                                            >
                                                                                <i className="ti ti-minus"></i>
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                    {projetsActuels.length === 0 && (
                                                                        <div className="list-group-item text-center text-muted">
                                                                            Aucun projet assigné
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <small className="form-text text-muted">
                                                    {projetsActuels.length} projet(s) assigné(s) à cette société
                                                </small>
                                                {errors.projets && (
                                                    <div className="invalid-feedback d-block">
                                                        {errors.projets}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Section employés avec deux listes */}
                                    <div className="row">
                                        <div className="col-12">
                                            <div className="mb-3">
                                                <label className="form-label">
                                                    Gestion des Employés
                                                </label>
                                                
                                                <div className="row">
                                                    {/* Employés disponibles */}
                                                    <div className="col-md-5">
                                                        <div className="card">
                                                            <div className="card-header d-flex justify-content-between align-items-center">
                                                                <span>Employés disponibles ({employesDisponibles.length})</span>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-primary"
                                                                    onClick={ajouterTousEmployes}
                                                                    disabled={employesDisponibles.length === 0 || loading}
                                                                >
                                                                    Tout ajouter →
                                                                </button>
                                                            </div>
                                                            <div className="card-body p-0">
                                                                <div 
                                                                    className="list-group list-group-flush"
                                                                    style={{ maxHeight: '200px', overflowY: 'auto' }}
                                                                >
                                                                    {employesDisponibles.map(employe => (
                                                                        <div 
                                                                            key={employe.id}
                                                                            className="list-group-item d-flex justify-content-between align-items-center"
                                                                        >
                                                                            <div>
                                                                                <strong>{employe.first_name} {employe.last_name}</strong>
                                                                                <br />
                                                                                <small className="text-muted">{employe.email}</small>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-sm btn-success"
                                                                                onClick={() => ajouterEmploye(employe.id)}
                                                                                disabled={loading}
                                                                            >
                                                                                <i className="ti ti-plus"></i>
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                    {employesDisponibles.length === 0 && (
                                                                        <div className="list-group-item text-center text-muted">
                                                                            Aucun employé disponible
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Boutons de transfert */}
                                                    <div className="col-md-2 d-flex align-items-center justify-content-center">
                                                        <div className="text-center">
                                                            <i className="ti ti-arrow-right" style={{ fontSize: '1.5rem' }}></i>
                                                        </div>
                                                    </div>

                                                    {/* Employés actuels */}
                                                    <div className="col-md-5">
                                                        <div className="card">
                                                            <div className="card-header d-flex justify-content-between align-items-center">
                                                                <span>Employés de la société ({employesActuels.length})</span>
                                                                <button
                                                                    type="button"
                                                                    className="btn btn-sm btn-outline-danger"
                                                                    onClick={retirerTousEmployes}
                                                                    disabled={employesActuels.length === 0 || loading}
                                                                >
                                                                    ← Tout retirer
                                                                </button>
                                                            </div>
                                                            <div className="card-body p-0">
                                                                <div 
                                                                    className="list-group list-group-flush"
                                                                    style={{ maxHeight: '200px', overflowY: 'auto' }}
                                                                >
                                                                    {employesActuels.map(employe => (
                                                                        <div 
                                                                            key={employe.id}
                                                                            className="list-group-item d-flex justify-content-between align-items-center"
                                                                        >
                                                                            <div>
                                                                                <strong>{employe.first_name} {employe.last_name}</strong>
                                                                                <br />
                                                                                <small className="text-muted">{employe.email}</small>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                className="btn btn-sm btn-danger"
                                                                                onClick={() => retirerEmploye(employe.id)}
                                                                                disabled={loading}
                                                                            >
                                                                                <i className="ti ti-minus"></i>
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                    {employesActuels.length === 0 && (
                                                                        <div className="list-group-item text-center text-muted">
                                                                            Aucun employé assigné
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <small className="form-text text-muted">
                                                    {employesActuels.length} employé(s) assigné(s) à cette société
                                                </small>
                                                {errors.employes && (
                                                    <div className="invalid-feedback d-block">
                                                        {errors.employes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
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
                                disabled={loading || loadingReferences}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Modification...
                                    </>
                                ) : (
                                    <>
                                        <i className="ti ti-check me-1"></i>
                                        Modifier la société
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

export default ModifierSocieteModal;