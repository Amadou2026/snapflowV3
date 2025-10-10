import React from 'react';

const ViewUserModal = ({ show, onClose, user }) => {
    if (!show || !user) return null;

    // Fonction pour obtenir le nom de la société
    const getSocieteName = (userItem) => {
        // Le serializer renvoie la société sous 'societes' (au pluriel)
        if (userItem.societes && typeof userItem.societes === 'object') {
            return userItem.societes.nom || 'Société sans nom';
        }
        // Fallback vers societe si disponible (au cas où)
        else if (userItem.societe && typeof userItem.societe === 'object') {
            return userItem.societe.nom || 'Société sans nom';
        }
        else if (userItem.societe && typeof userItem.societe === 'number') {
            return `Société ID: ${userItem.societe}`;
        }
        return 'Non assigné';
    };

    return (
        <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                <div className="modal-content">
                    <div className="modal-header border-0 pb-0">
                        <h5 className="mb-0">Détails de l'Utilisateur</h5>
                        <button type="button" className="btn-link-danger" onClick={onClose}>
                            <i className="ti ti-x f-20"></i>
                        </button>
                    </div>
                    <div className="modal-body">
                        <div className="row">
                            {/* Colonne gauche : profil */}
                            <div className="col-lg-4">
                                <div className="card">
                                    <div className="card-body text-center position-relative">
                                        <div className="position-absolute end-0 top-0 p-3">
                                            <span className="badge bg-primary">Profil</span>
                                        </div>
                                        {/* <img
                                            src="/assets/img/user/avatar-1.jpg"
                                            alt="avatar"
                                            className="rounded-circle img-fluid wid-60 mb-3"
                                        /> */}
                                        <h5>{user.first_name} {user.last_name}</h5>
                                        <p className="text-muted text-sm">{user.email}</p>
                                        <hr className="my-3" />
                                        <div className="mb-2">
                                            {user.groupes && user.groupes.length > 0
                                                ? user.groupes.map((g) => (
                                                    <span key={g.id} className="badge bg-info me-1">{g.nom}</span>
                                                ))
                                                : <span className="badge bg-light text-dark">Aucun rôle</span>
                                            }
                                        </div>
                                        <div className="mb-2">
                                            <span className={`badge ${user.is_active ? 'bg-success' : 'bg-danger'}`}>
                                                {user.is_active ? 'Actif' : 'Inactif'}
                                            </span>
                                        </div>
                                        {/* <hr className="my-3" />
                                        <div className="text-start">
                                            <div className="mb-2 d-flex align-items-center">
                                                <i className="ti ti-mail me-2"></i>
                                                <p className="mb-0">{user.email}</p>
                                            </div>
                                            <div className="mb-2 d-flex align-items-center">
                                                <i className="ti ti-building me-2"></i>
                                                <p className="mb-0">
                                                    {getSocieteName(user)}
                                                </p>
                                            </div>
                                        </div> */}
                                    </div>
                                </div>
                            </div>

                            {/* Colonne droite : détails personnels */}
                            <div className="col-lg-8">
                                <div className="card mb-3">
                                    <div className="card-header">
                                        <h5>Détails personnels</h5>
                                    </div>
                                    <div className="card-body">
                                        <ul className="list-group list-group-flush">
                                            <li className="list-group-item px-0 pt-0">
                                                <div className="row">
                                                    <div className="col-md-6">
                                                        <p className="mb-1 text-muted">Prénom</p>
                                                        <h6 className="mb-0">{user.first_name}</h6>
                                                    </div>
                                                    <div className="col-md-6">
                                                        <p className="mb-1 text-muted">Nom</p>
                                                        <h6 className="mb-0">{user.last_name}</h6>
                                                    </div>
                                                </div>
                                            </li>
                                            <li className="list-group-item px-0">
                                                <p className="mb-1 text-muted">Email</p>
                                                <h6 className="mb-0">{user.email}</h6>
                                            </li>
                                            <li className="list-group-item px-0">
                                                <p className="mb-1 text-muted">Société</p>
                                                <h6 className="mb-0">
                                                    {getSocieteName(user)}
                                                </h6>
                                            </li>
                                            <li className="list-group-item px-0">
                                                <p className="mb-1 text-muted">Statut</p>
                                                <h6 className="mb-0">
                                                    <span className={`badge ${user.is_active ? 'bg-success' : 'bg-danger'}`}>
                                                        {user.is_active ? 'Actif' : 'Inactif'}
                                                    </span>
                                                    {user.is_staff && (
                                                        <span className="badge bg-warning ms-1">Staff</span>
                                                    )}
                                                    {user.is_superuser && (
                                                        <span className="badge bg-danger ms-1">Super Admin</span>
                                                    )}
                                                </h6>
                                            </li>
                                            <li className="list-group-item px-0">
                                                <p className="mb-1 text-muted">Groupes/Rôles</p>
                                                <div className="mb-0">
                                                    {user.groupes && user.groupes.length > 0
                                                        ? user.groupes.map((g) => (
                                                            <span key={g.id} className="badge bg-info me-1 mb-1">
                                                                {g.nom} {g.role_predefini && `(${g.role_predefini})`}
                                                            </span>
                                                        ))
                                                        : <span className="badge bg-light text-dark">Aucun groupe assigné</span>
                                                    }
                                                </div>
                                            </li>
                                            <li className="list-group-item px-0 pb-0">
                                                <p className="mb-1 text-muted">Date de création</p>
                                                <h6 className="mb-0">{new Date(user.date_joined).toLocaleDateString('fr-FR')}</h6>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewUserModal;