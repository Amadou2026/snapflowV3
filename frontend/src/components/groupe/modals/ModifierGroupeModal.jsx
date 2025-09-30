import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const ModifierGroupeModal = ({ show, onClose, onGroupeUpdated, groupe }) => {
    const [formData, setFormData] = useState({
        nom: '',
        type_groupe: 'personnalisé',
        role_predefini: '',
        description: '',
        permissions: []
    });
    const [availablePermissions, setAvailablePermissions] = useState([]);
    const [permissionIdMap, setPermissionIdMap] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [searchPermission, setSearchPermission] = useState('');

    const TYPE_CHOICES = [
        { value: 'personnalisé', label: 'Personnalisé' },
        { value: 'predéfini', label: 'Prédéfini' }
    ];

    const ROLE_PREDEFINIS = [
        { value: '', label: 'Aucun rôle spécifique' },
        { value: 'administrateur', label: 'Administrateur' },
        { value: 'qa', label: 'Quality Assurance' },
        { value: 'developpeur', label: 'Développeur' },
        { value: 'manager', label: 'Manager' },
        { value: 'chef_projet', label: 'Chef de Projet' }
    ];

    useEffect(() => {
        if (show && groupe) {
            setFormData({
                nom: groupe.nom || '',
                type_groupe: groupe.type_groupe || 'personnalisé',
                role_predefini: groupe.role_predefini || '',
                description: groupe.description || '',
                permissions: groupe.permissions || []
            });
            fetchPermissions();
        }
    }, [show, groupe]);

    const fetchPermissions = async () => {
        try {
            // Récupérer toutes les permissions disponibles avec leurs IDs
            const response = await api.get('user/permissions/');
            const allPermsResponse = await api.get('permissions/');
            
            const perms = response.data.permissions || [];
            const allPermsData = allPermsResponse.data || [];

            // Créer un mapping permission_name -> permission_id
            const idMap = {};
            allPermsData.forEach(perm => {
                const fullName = `${perm.content_type__app_label}.${perm.codename}`;
                idMap[fullName] = perm.id;
            });
            setPermissionIdMap(idMap);

            // Transformer les permissions en format utilisable
            const permsArray = perms.map(perm => {
                const [app_label, codename] = perm.split('.');
                return {
                    id: perm,
                    permId: idMap[perm],
                    name: perm,
                    app_label: app_label,
                    codename: codename,
                    display_name: `${app_label} | ${codename.replace(/_/g, ' ')}`
                };
            });

            setAvailablePermissions(permsArray);
        } catch (error) {
            console.error('Erreur lors du chargement des permissions:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePermissionToggle = (permissionId) => {
        setFormData(prev => ({
            ...prev,
            permissions: prev.permissions.includes(permissionId)
                ? prev.permissions.filter(id => id !== permissionId)
                : [...prev.permissions, permissionId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Convertir les permissions en IDs numériques
            const permissionIds = formData.permissions.map(perm => {
                // Si c'est déjà un ID numérique, le retourner
                if (typeof perm === 'number') return perm;
                
                // Sinon, utiliser le mapping
                const permName = perm.includes('.') ? perm : `core.${perm}`;
                return permissionIdMap[permName];
            }).filter(id => id !== undefined);

            const groupeData = {
                nom: formData.nom,
                type_groupe: formData.type_groupe,
                role_predefini: formData.role_predefini || null,
                description: formData.description,
                permissions: permissionIds
            };

            console.log('Données de mise à jour du groupe:', groupeData);

            const response = await api.patch(`groupes/${groupe.groupe_perso_id}/`, groupeData);
            console.log('Groupe modifié avec succès:', response.data);

            onGroupeUpdated(response.data);
            onClose();

        } catch (error) {
            console.error('Erreur lors de la modification:', error);
            
            if (error.response?.data) {
                if (error.response.data.nom) {
                    setError('Ce nom de groupe est déjà utilisé');
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

    const filteredPermissions = availablePermissions.filter(perm =>
        perm.display_name.toLowerCase().includes(searchPermission.toLowerCase()) ||
        perm.app_label.toLowerCase().includes(searchPermission.toLowerCase()) ||
        perm.codename.toLowerCase().includes(searchPermission.toLowerCase())
    );

    const groupPermissionsByApp = filteredPermissions.reduce((acc, perm) => {
        if (!acc[perm.app_label]) {
            acc[perm.app_label] = [];
        }
        acc[perm.app_label].push(perm);
        return acc;
    }, {});

    if (!show || !groupe) return null;

    return (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            Modifier le Groupe : {groupe.nom}
                            {groupe.est_protege && (
                                <span className="badge bg-warning ms-2">Protégé</span>
                            )}
                        </h5>
                        <button 
                            type="button" 
                            className="btn-close" 
                            onClick={onClose}
                            disabled={loading}
                        ></button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            {error && (
                                <div className="alert alert-danger" role="alert">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    {error}
                                </div>
                            )}

                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label htmlFor="nom" className="form-label">
                                            <i className="fas fa-users me-2"></i>
                                            Nom du groupe *
                                        </label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="nom"
                                            name="nom"
                                            value={formData.nom}
                                            onChange={handleChange}
                                            required
                                            disabled={loading}
                                            placeholder="Nom du groupe"
                                        />
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label htmlFor="type_groupe" className="form-label">
                                            <i className="fas fa-tag me-2"></i>
                                            Type de groupe
                                        </label>
                                        <select
                                            className="form-select"
                                            id="type_groupe"
                                            name="type_groupe"
                                            value={formData.type_groupe}
                                            onChange={handleChange}
                                            disabled={loading}
                                        >
                                            {TYPE_CHOICES.map(type => (
                                                <option key={type.value} value={type.value}>
                                                    {type.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label htmlFor="role_predefini" className="form-label">
                                            <i className="fas fa-user-tie me-2"></i>
                                            Rôle prédéfini
                                        </label>
                                        <select
                                            className="form-select"
                                            id="role_predefini"
                                            name="role_predefini"
                                            value={formData.role_predefini}
                                            onChange={handleChange}
                                            disabled={loading}
                                        >
                                            {ROLE_PREDEFINIS.map(role => (
                                                <option key={role.value} value={role.value}>
                                                    {role.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">
                                            <i className="fas fa-info-circle me-2"></i>
                                            Statut du groupe
                                        </label>
                                        <div>
                                            {groupe.est_protege ? (
                                                <span className="badge bg-warning fs-6">
                                                    <i className="fas fa-shield-alt me-1"></i>
                                                    Groupe protégé
                                                </span>
                                            ) : (
                                                <span className="badge bg-secondary fs-6">
                                                    <i className="fas fa-users me-1"></i>
                                                    Groupe modifiable
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-3">
                                <label htmlFor="description" className="form-label">
                                    <i className="fas fa-align-left me-2"></i>
                                    Description
                                </label>
                                <textarea
                                    className="form-control"
                                    id="description"
                                    name="description"
                                    rows="3"
                                    value={formData.description}
                                    onChange={handleChange}
                                    disabled={loading}
                                    placeholder="Description du groupe et de ses responsabilités..."
                                ></textarea>
                            </div>

                            {/* Section Permissions */}
                            <div className="mb-3">
                                <label className="form-label">
                                    <i className="fas fa-key me-2"></i>
                                    Permissions
                                </label>
                                
                                {/* Barre de recherche pour les permissions */}
                                <div className="mb-3">
                                    <div className="input-group">
                                        <span className="input-group-text">
                                            <i className="fas fa-search"></i>
                                        </span>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Rechercher une permission..."
                                            value={searchPermission}
                                            onChange={(e) => setSearchPermission(e.target.value)}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>

                                <div className="border rounded p-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    <div className="mb-2">
                                        <small className="text-muted">
                                            {formData.permissions.length} permission(s) sélectionnée(s)
                                        </small>
                                    </div>
                                    
                                    {Object.keys(groupPermissionsByApp).length === 0 ? (
                                        <div className="text-center py-3">
                                            <i className="fas fa-search fa-2x text-muted mb-2"></i>
                                            <p className="text-muted">Aucune permission trouvée</p>
                                        </div>
                                    ) : (
                                        Object.keys(groupPermissionsByApp).map(appLabel => (
                                            <div key={appLabel} className="mb-3">
                                                <h6 className="text-primary border-bottom pb-1">
                                                    <i className="fas fa-cube me-2"></i>
                                                    {appLabel.toUpperCase()}
                                                </h6>
                                                <div className="row">
                                                    {groupPermissionsByApp[appLabel].map(permission => (
                                                        <div key={permission.id} className="col-md-6 mb-2">
                                                            <div className="form-check">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    id={`perm_${permission.id}`}
                                                                    checked={formData.permissions.includes(permission.id)}
                                                                    onChange={() => handlePermissionToggle(permission.id)}
                                                                    disabled={loading}
                                                                />
                                                                <label 
                                                                    className="form-check-label" 
                                                                    htmlFor={`perm_${permission.id}`}
                                                                    title={permission.display_name}
                                                                >
                                                                    {permission.codename.replace(/_/g, ' ')}
                                                                </label>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button 
                                type="button" 
                                className="btn btn-secondary" 
                                onClick={onClose}
                                disabled={loading}
                            >
                                <i className="fas fa-times me-2"></i>
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
                                        <i className="fas fa-save me-2"></i>
                                        Modifier le groupe
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

export default ModifierGroupeModal;