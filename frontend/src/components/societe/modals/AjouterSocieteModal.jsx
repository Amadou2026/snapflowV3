import React, { useState, useEffect } from 'react';
import api from '../../../services/api';
import { toast } from 'react-toastify';

const AjouterSocieteModal = ({ show, onClose, onSocieteAdded }) => {
    const [formData, setFormData] = useState({
        nom: '',
        num_siret: '',
        url: '',
        secteur_activite: '',
        admin: '',
        projets: [], // Changé de 'projet' à 'projets' (array)
        employes: []
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // États pour les données de référence
    const [secteursActivite, setSecteursActivite] = useState([]);
    const [utilisateurs, setUtilisateurs] = useState([]);
    const [projets, setProjets] = useState([]);
    const [loadingReferences, setLoadingReferences] = useState(false);

    // États pour les employés (séparés)
    const [employesDisponibles, setEmployesDisponibles] = useState([]);
    const [employesSelectionnes, setEmployesSelectionnes] = useState([]);

    // États pour les projets (séparés)
    const [projetsDisponibles, setProjetsDisponibles] = useState([]);
    const [projetsSelectionnes, setProjetsSelectionnes] = useState([]);

    // Charger les données de référence
    useEffect(() => {
        if (show) {
            loadReferenceData();
        }
    }, [show]);

    const loadReferenceData = async () => {
        setLoadingReferences(true);
        try {
            // Charger les secteurs d'activité
            const secteursResponse = await api.get('secteurs/');
            setSecteursActivite(secteursResponse.data);

            // Charger les utilisateurs (non superusers pour l'admin)
            const usersResponse = await api.get('users/?exclude_superadmin=true');
            setUtilisateurs(usersResponse.data);
            setEmployesDisponibles(usersResponse.data);

            // Charger les projets
            const projetsResponse = await api.get('projets/');
            setProjets(projetsResponse.data);
            setProjetsDisponibles(projetsResponse.data); // Tous les projets sont disponibles initialement
        } catch (error) {
            console.error('Erreur lors du chargement des données de référence:', error);
            toast.error('Erreur lors du chargement des données de référence');
        } finally {
            setLoadingReferences(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]:
                name === 'secteur_activite' || name === 'admin'
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

    // Gestion des projets (ManyToMany)
    const ajouterProjet = (projetId) => {
        const projetIdInt = parseInt(projetId);
        const projet = projets.find(p => p.id === projetIdInt);
        
        if (projet && !formData.projets.includes(projetIdInt)) {
            const nouveauxProjets = [...formData.projets, projetIdInt];
            setFormData(prev => ({
                ...prev,
                projets: nouveauxProjets
            }));
            
            // Mettre à jour les listes
            setProjetsSelectionnes(prev => [...prev, projet]);
            setProjetsDisponibles(prev => prev.filter(p => p.id !== projetIdInt));
        }
    };

    const retirerProjet = (projetId) => {
        const projetIdInt = parseInt(projetId);
        const projet = projets.find(p => p.id === projetIdInt);
        
        const nouveauxProjets = formData.projets.filter(id => id !== projetIdInt);
        setFormData(prev => ({
            ...prev,
            projets: nouveauxProjets
        }));
        
        // Mettre à jour les listes
        setProjetsSelectionnes(prev => prev.filter(p => p.id !== projetIdInt));
        if (projet) {
            setProjetsDisponibles(prev => [...prev, projet]);
        }
    };

    const ajouterTousProjets = () => {
        const tousProjetsIds = projetsDisponibles.map(proj => proj.id);
        const nouveauxProjets = [...formData.projets, ...tousProjetsIds];
        setFormData(prev => ({
            ...prev,
            projets: nouveauxProjets
        }));
        
        // Mettre à jour les listes
        setProjetsSelectionnes(prev => [...prev, ...projetsDisponibles]);
        setProjetsDisponibles([]);
    };

    const retirerTousProjets = () => {
        setFormData(prev => ({
            ...prev,
            projets: []
        }));
        
        // Mettre à jour les listes
        setProjetsDisponibles(prev => [...prev, ...projetsSelectionnes]);
        setProjetsSelectionnes([]);
    };

    // Gestion des employés (ManyToMany)
    const ajouterEmploye = (employeId) => {
        const employeIdInt = parseInt(employeId);
        const employe = utilisateurs.find(u => u.id === employeIdInt);
        
        if (employe && !formData.employes.includes(employeIdInt)) {
            const nouveauxEmployes = [...formData.employes, employeIdInt];
            setFormData(prev => ({
                ...prev,
                employes: nouveauxEmployes
            }));
            
            // Mettre à jour les listes
            setEmployesSelectionnes(prev => [...prev, employe]);
            setEmployesDisponibles(prev => prev.filter(e => e.id !== employeIdInt));
        }
    };

    const retirerEmploye = (employeId) => {
        const employeIdInt = parseInt(employeId);
        const employe = utilisateurs.find(u => u.id === employeIdInt);
        
        const nouveauxEmployes = formData.employes.filter(id => id !== employeIdInt);
        setFormData(prev => ({
            ...prev,
            employes: nouveauxEmployes
        }));
        
        // Mettre à jour les listes
        setEmployesSelectionnes(prev => prev.filter(e => e.id !== employeIdInt));
        if (employe) {
            setEmployesDisponibles(prev => [...prev, employe]);
        }
    };

    const ajouterTousEmployes = () => {
        const tousEmployesIds = employesDisponibles.map(emp => emp.id);
        const nouveauxEmployes = [...formData.employes, ...tousEmployesIds];
        setFormData(prev => ({
            ...prev,
            employes: nouveauxEmployes
        }));
        
        // Mettre à jour les listes
        setEmployesSelectionnes(prev => [...prev, ...employesDisponibles]);
        setEmployesDisponibles([]);
    };

    const retirerTousEmployes = () => {
        setFormData(prev => ({
            ...prev,
            employes: []
        }));
        
        // Mettre à jour les listes
        setEmployesDisponibles(prev => [...prev, ...employesSelectionnes]);
        setEmployesSelectionnes([]);
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.nom.trim()) {
            newErrors.nom = 'Le nom de la société est requis';
        }

        if (formData.url && !isValidUrl(formData.url)) {
            newErrors.url = 'URL invalide';
        }

        if (formData.num_siret && !isValidSiret(formData.num_siret)) {
            newErrors.num_siret = 'Le numéro SIRET doit contenir 14 chiffres';
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

    const isValidSiret = (siret) => {
        return /^\d{14}$/.test(siret);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            // Format exact pour le sérialiseur de création
            const dataToSend = {
                nom: formData.nom,
                num_siret: formData.num_siret || '',
                url: formData.url || '',
                secteur_activite: formData.secteur_activite ? parseInt(formData.secteur_activite) : null,
                admin: formData.admin ? parseInt(formData.admin) : null,
                projets: formData.projets, // Array d'IDs de projets
                employes: formData.employes
            };

            console.log('📤 Données envoyées:', dataToSend);

            const response = await api.post('societe/create/', dataToSend);
            console.log('✅ Réponse API:', response.data);

            toast.success('Société créée avec succès');
            onSocieteAdded(response.data);
            resetForm();
        } catch (error) {
            console.error('❌ Erreur:', error);
            if (error.response?.data) {
                console.log('📋 Détails erreur:', error.response.data);
                setErrors(error.response.data);
                toast.error('Erreur lors de la création de la société');
            }
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            nom: '',
            num_siret: '',
            url: '',
            secteur_activite: '',
            admin: '',
            projets: [],
            employes: []
        });
        setEmployesDisponibles(utilisateurs);
        setEmployesSelectionnes([]);
        setProjetsDisponibles(projets);
        setProjetsSelectionnes([]);
        setErrors({});
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!show) return null;

    return (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="ti ti-building me-2"></i>
                            Ajouter une Société
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
                                            className={`form-control ${errors.secteur_activite ? 'is-invalid' : ''}`}
                                            id="secteur_activite"
                                            name="secteur_activite"
                                            value={formData.secteur_activite}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Sélectionner un secteur</option>
                                            {secteursActivite.map(secteur => (
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

                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label htmlFor="admin" className="form-label">
                                            Administrateur
                                        </label>
                                        <select
                                            className={`form-control ${errors.admin ? 'is-invalid' : ''}`}
                                            id="admin"
                                            name="admin"
                                            value={formData.admin}
                                            onChange={handleInputChange}
                                        >
                                            <option value="">Sélectionner un administrateur</option>
                                            {utilisateurs.map(user => (
                                                <option key={user.id} value={user.id}>
                                                    {user.first_name} {user.last_name} ({user.email})
                                                </option>
                                            ))}
                                        </select>
                                        {errors.admin && (
                                            <div className="invalid-feedback">
                                                {errors.admin}
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
                                                            disabled={projetsDisponibles.length === 0}
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

                                            {/* Projets sélectionnés */}
                                            <div className="col-md-5">
                                                <div className="card">
                                                    <div className="card-header d-flex justify-content-between align-items-center">
                                                        <span>Projets sélectionnés ({projetsSelectionnes.length})</span>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={retirerTousProjets}
                                                            disabled={projetsSelectionnes.length === 0}
                                                        >
                                                            ← Tout retirer
                                                        </button>
                                                    </div>
                                                    <div className="card-body p-0">
                                                        <div 
                                                            className="list-group list-group-flush"
                                                            style={{ maxHeight: '200px', overflowY: 'auto' }}
                                                        >
                                                            {projetsSelectionnes.map(projet => (
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
                                                                    >
                                                                        <i className="ti ti-minus"></i>
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            {projetsSelectionnes.length === 0 && (
                                                                <div className="list-group-item text-center text-muted">
                                                                    Aucun projet sélectionné
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <small className="form-text text-muted">
                                            {projetsSelectionnes.length} projet(s) sélectionné(s) pour cette société
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
                                                            disabled={employesDisponibles.length === 0}
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

                                            {/* Employés sélectionnés */}
                                            <div className="col-md-5">
                                                <div className="card">
                                                    <div className="card-header d-flex justify-content-between align-items-center">
                                                        <span>Employés sélectionnés ({employesSelectionnes.length})</span>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger"
                                                            onClick={retirerTousEmployes}
                                                            disabled={employesSelectionnes.length === 0}
                                                        >
                                                            ← Tout retirer
                                                        </button>
                                                    </div>
                                                    <div className="card-body p-0">
                                                        <div 
                                                            className="list-group list-group-flush"
                                                            style={{ maxHeight: '200px', overflowY: 'auto' }}
                                                        >
                                                            {employesSelectionnes.map(employe => (
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
                                                                    >
                                                                        <i className="ti ti-minus"></i>
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            {employesSelectionnes.length === 0 && (
                                                                <div className="list-group-item text-center text-muted">
                                                                    Aucun employé sélectionné
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <small className="form-text text-muted">
                                            {employesSelectionnes.length} employé(s) sélectionné(s) pour cette société
                                        </small>
                                        {errors.employes && (
                                            <div className="invalid-feedback d-block">
                                                {errors.employes}
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
                                disabled={loading || loadingReferences}
                            >
                                {loading ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                        Création...
                                    </>
                                ) : (
                                    <>
                                        <i className="ti ti-plus me-1"></i>
                                        Créer la société
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

export default AjouterSocieteModal;