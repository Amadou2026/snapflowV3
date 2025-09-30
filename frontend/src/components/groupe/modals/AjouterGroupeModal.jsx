import React, { useState, useEffect } from 'react';
import api from '../../../services/api';

const AjouterGroupeModal = ({ show, onClose, onGroupeAdded }) => {
    const [formData, setFormData] = useState({
        nom: '',
        type_groupe: 'personnalisé',
        role_predefini: '',
        description: '',
        permissions: []
    });
    const [availablePermissions, setAvailablePermissions] = useState([]);
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
        if (show) fetchPermissions();
    }, [show]);

    const fetchPermissions = async () => {
        try {
            const response = await api.get('user/permissions/');
            const perms = response.data.permissions || [];

            const permsArray = perms.map(perm => {
                const [app_label, codename] = perm.split('.');
                return {
                    id: perm,
                    name: perm,
                    app_label,
                    codename,
                    display_name: `${app_label} | ${codename.replace(/_/g, ' ')}`
                };
            });

            setAvailablePermissions(permsArray);
        } catch (err) {
            console.error('Erreur lors du chargement des permissions:', err.response?.data || err.message);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
            // Validation côté frontend
            if (formData.type_groupe === 'predéfini' && !formData.role_predefini) {
                setError('Le rôle prédéfini est obligatoire pour un groupe prédéfini.');
                setLoading(false);
                return;
            }

            const groupeData = {
                nom: formData.nom,
                type_groupe: formData.type_groupe,
                role_predefini: formData.role_predefini || '',
                description: formData.description,
                permissions: formData.permissions.map(p => p.includes('.') ? p : `core.${p}`)
            };

            console.log('Données du groupe à créer:', groupeData);

            const response = await api.post('groupes/', groupeData);
            console.log('Groupe créé avec succès:', response.data);

            onGroupeAdded(response.data);
            resetForm();
            onClose();
        } catch (err) {
            console.error('Erreur lors de la création:', err);
            if (err.response?.data) {
                const errorMessages = Object.values(err.response.data).flat().join(', ');
                setError('Erreur de validation: ' + errorMessages);
            } else {
                setError('Erreur de connexion au serveur');
            }
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            nom: '',
            type_groupe: 'personnalisé',
            role_predefini: '',
            description: '',
            permissions: []
        });
        setError('');
        setSearchPermission('');
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    const filteredPermissions = availablePermissions.filter(perm =>
        perm.display_name.toLowerCase().includes(searchPermission.toLowerCase()) ||
        perm.app_label.toLowerCase().includes(searchPermission.toLowerCase()) ||
        perm.codename.toLowerCase().includes(searchPermission.toLowerCase())
    );

    const groupPermissionsByApp = filteredPermissions.reduce((acc, perm) => {
        if (!acc[perm.app_label]) acc[perm.app_label] = [];
        acc[perm.app_label].push(perm);
        return acc;
    }, {});

    if (!show) return null;

    return (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog modal-xl">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Ajouter un Groupe</h5>
                        <button type="button" className="btn-close" onClick={handleClose}></button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            {error && <div className="alert alert-danger">{error}</div>}

                            <div className="row">
                                <div className="col-md-6">
                                    <div className="form-floating mb-3">
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="nom"
                                            name="nom"
                                            placeholder=" "
                                            value={formData.nom}
                                            onChange={handleChange}
                                            required
                                        />
                                        <label htmlFor="nom">Nom du groupe *</label>
                                    </div>
                                </div>

                                <div className="col-md-6">
                                    <div className="form-floating mb-3">
                                        <select
                                            className="form-select"
                                            id="type_groupe"
                                            name="type_groupe"
                                            value={formData.type_groupe}
                                            onChange={handleChange}
                                        >
                                            {TYPE_CHOICES.map(type => (
                                                <option key={type.value} value={type.value}>{type.label}</option>
                                            ))}
                                        </select>
                                        <label htmlFor="type_groupe">Type de groupe</label>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-12">
                                    <div className="form-floating mb-3">
                                        <select
                                            className="form-select"
                                            id="role_predefini"
                                            name="role_predefini"
                                            value={formData.role_predefini}
                                            onChange={handleChange}
                                        >
                                            {ROLE_PREDEFINIS.map(role => (
                                                <option key={role.value} value={role.value}>{role.label}</option>
                                            ))}
                                        </select>
                                        <label htmlFor="role_predefini">Rôle prédéfini</label>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-md-12">
                                    <div className="form-floating mb-3">
                                        <textarea
                                            className="form-control"
                                            id="description"
                                            name="description"
                                            placeholder=" "
                                            value={formData.description}
                                            onChange={handleChange}
                                            style={{ height: '100px' }}
                                        />
                                        <label htmlFor="description">Description</label>
                                    </div>
                                </div>
                            </div>

                            <div className="row">
                                <div className="col-12">
                                    <h6>Permissions disponibles (liées à votre compte)</h6>
                                    <div className="mb-3">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Rechercher une permission..."
                                            value={searchPermission}
                                            onChange={(e) => setSearchPermission(e.target.value)}
                                        />
                                    </div>

                                    <div className="border rounded p-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        <div className="mb-2">
                                            <small className="text-muted">
                                                {formData.permissions.length} permission(s) sélectionnée(s)
                                            </small>
                                        </div>

                                        {Object.keys(groupPermissionsByApp).map(appLabel => (
                                            <div key={appLabel} className="mb-3">
                                                <h6 className="text-primary mb-2">{appLabel}</h6>
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
                                                                />
                                                                <label
                                                                    className="form-check-label small"
                                                                    htmlFor={`perm_${permission.id}`}
                                                                    title={permission.name}
                                                                >
                                                                    {permission.display_name}
                                                                </label>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}

                                        {filteredPermissions.length === 0 && (
                                            <p className="text-muted text-center">Aucune permission trouvée</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary" onClick={handleClose}>
                                Annuler
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Création...' : 'Créer le groupe'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AjouterGroupeModal;
