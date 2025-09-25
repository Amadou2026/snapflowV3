import React, { useState, useEffect } from "react";
import HeaderAdmin from '../admin/HeaderAdmin';
import SidebarAdmin from '../admin/SidebarAdmin';
import FooterAdmin from '../admin/FooterAdmin';
import api from '../../services/api'; // Import de l'API
import { Eye, EyeOff } from "lucide-react"; // tu peux utiliser react-icons/fa si tu préfères

const ProfilUtilisateur = ({ user: initialUser, logout, setUser }) => {
    const [activeTab, setActiveTab] = useState("user-cont-1");
    const [user, setLocalUser] = useState(initialUser);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: ''
    });
    const [passwordData, setPasswordData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        if (initialUser) {
            setLocalUser(initialUser);
            setFormData({
                first_name: initialUser.first_name || '',
                last_name: initialUser.last_name || '',
                email: initialUser.email || ''
            });
        }
    }, [initialUser]);

    const handleTabClick = (tabId) => {
        setActiveTab(tabId);
        setMessage({ type: '', text: '' }); // Reset message quand on change d'onglet
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Fonction pour mettre à jour les informations personnelles
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await api.patch(`users/${user.id}/update-profile/`, formData);

            // Mettre à jour l'utilisateur local et global
            const updatedUser = { ...user, ...response.data };
            setLocalUser(updatedUser);
            setUser(updatedUser); // Mettre à jour l'utilisateur global dans App.js

            setMessage({
                type: 'success',
                text: 'Profil mis à jour avec succès!'
            });
        } catch (error) {
            console.error('Erreur lors de la mise à jour:', error);
            let errorMessage = 'Erreur lors de la mise à jour du profil';

            if (error.response?.data) {
                // Gestion des erreurs spécifiques de Django
                if (error.response.data.email) {
                    errorMessage = 'Cet email est déjà utilisé';
                } else if (error.response.data.non_field_errors) {
                    errorMessage = error.response.data.non_field_errors[0];
                }
            }

            setMessage({
                type: 'error',
                text: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        // Validation côté client
        if (passwordData.new_password !== passwordData.confirm_password) {
            setMessage({
                type: 'error',
                text: 'Les mots de passe ne correspondent pas'
            });
            setLoading(false);
            return;
        }

        if (passwordData.new_password.length < 8) {
            setMessage({
                type: 'error',
                text: 'Le mot de passe doit contenir au moins 8 caractères'
            });
            setLoading(false);
            return;
        }

        try {
            await api.post('auth/change-password/', {
                old_password: passwordData.old_password,
                new_password1: passwordData.new_password,
                new_password2: passwordData.confirm_password
            });

            setMessage({
                type: 'success',
                text: 'Mot de passe modifié avec succès!'
            });

            // Réinitialiser le formulaire
            setPasswordData({
                old_password: '',
                new_password: '',
                confirm_password: ''
            });
        } catch (error) {
            console.error('Erreur lors du changement de mot de passe:', error);
            let errorMessage = 'Erreur lors du changement de mot de passe';

            if (error.response?.data) {
                if (error.response.data.old_password) {
                    errorMessage = 'Mot de passe actuel incorrect';
                } else if (error.response.data.new_password1) {
                    errorMessage = error.response.data.new_password1[0];
                }
            }

            setMessage({
                type: 'error',
                text: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };


    const handleCancel = () => {
        // Réinitialiser les données du formulaire
        setFormData({
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            email: user?.email || ''
        });
        setMessage({ type: '', text: '' });
    };

    const handleCancelPassword = () => {
        setPasswordData({
            old_password: '',
            new_password: '',
            confirm_password: ''
        });
        setMessage({ type: '', text: '' });
    };

    return (
        <div className="dashboard-wrapper">
            <HeaderAdmin user={user} logout={logout} />
            <div className="main-container">
                <SidebarAdmin />
                <div className="page-wrapper">
                    <div className="pc-container">
                        <div className="pc-content">
                            {/* Breadcrumb */}
                            <div className="page-header">
                                <div className="page-block">
                                    <div className="row align-items-center">
                                        <div className="col-md-12">
                                            <ul className="breadcrumb">
                                                <li className="breadcrumb-item">
                                                    <a href="/dashboard">Accueil</a>
                                                </li>
                                                <li className="breadcrumb-item">
                                                    <a href="/dashboard">Dashboard</a>
                                                </li>
                                                <li className="breadcrumb-item" aria-current="page">
                                                    Profil Utilisateur
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="page-header-title">
                                                <h2 className="mb-0">Profil Utilisateur</h2>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Message d'alerte */}
                            {message.text && (
                                <div className={`alert alert-${message.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`}>
                                    {message.text}
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setMessage({ type: '', text: '' })}
                                    ></button>
                                </div>
                            )}

                            {/* Main Content */}
                            <div className="row">
                                <div className="col-sm-12">
                                    {/* Profile Header Card */}
                                    <div className="card profile-wave-card">
                                        <div className="card-body">
                                            <div className="row align-items-center">
                                                <div className="col">
                                                    <div className="d-flex align-items-center">
                                                        <div className="my-n4" style={{ width: 150 }}>
                                                            <div id="profile-chart"></div>
                                                        </div>
                                                        <div className="ms-3">
                                                            <h5>Modifier votre profil</h5>
                                                            {/* <p className="mb-0">
                                                                Complétez votre profil pour débloquer toutes les fonctionnalités
                                                            </p> */}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="row">
                                        {/* Left Sidebar: Avatar + Tabs */}
                                        <div className="col-md-4">
                                            <div className="card">
                                                <div className="card-body position-relative">
                                                    <div className="text-center">
                                                        <div className="chat-avtar d-inline-flex mx-auto">
                                                            <img
                                                                className="rounded-circle img-fluid wid-120"
                                                                src="/assets/img/user/avatar-5.jpg"
                                                                alt="User image"
                                                            />
                                                        </div>
                                                        <h5 className="mt-3">
                                                            {user?.first_name && user?.last_name
                                                                ? `${user.first_name} ${user.last_name}`
                                                                : user?.email || 'Utilisateur'
                                                            }
                                                        </h5>
                                                        <p className="text-muted">{user?.email || 'Email non disponible'}</p>
                                                    </div>

                                                    {/* Tabs */}
                                                    <div
                                                        className="nav flex-column nav-pills list-group list-group-flush user-sett-tabs"
                                                        id="user-set-tab"
                                                        role="tablist"
                                                        aria-orientation="vertical"
                                                    >
                                                        <button
                                                            className={`nav-link list-group-item list-group-item-action ${activeTab === "user-cont-1" ? "active" : ""}`}
                                                            onClick={() => handleTabClick("user-cont-1")}
                                                        >
                                                            <i className="ti ti-user m-r-10"></i> Information Personnelle
                                                        </button>

                                                        <button
                                                            className={`nav-link list-group-item list-group-item-action ${activeTab === "user-cont-3" ? "active" : ""}`}
                                                            onClick={() => handleTabClick("user-cont-3")}
                                                        >
                                                            <i className="ti ti-lock m-r-10"></i> Changer le mot de passe
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right Content: Tab Contents */}
                                        <div className="col-md-8">
                                            <div className="tab-content" id="user-set-tabContent">
                                                {activeTab === "user-cont-1" && (
                                                    <div className="tab-pane fade show active" id="user-cont-1" role="tabpanel">
                                                        {/* Personal Info Card */}
                                                        <form onSubmit={handleUpdateProfile}>
                                                            <div className="card">
                                                                <div className="card-body">
                                                                    <h5>Information Personnelle</h5>
                                                                    <hr className="mb-4" />
                                                                    <div className="row">
                                                                        <div className="col-sm-6">
                                                                            <div className="form-group">
                                                                                <label className="form-label">Prénom *</label>
                                                                                <input
                                                                                    type="text"
                                                                                    className="form-control"
                                                                                    name="first_name"
                                                                                    value={formData.first_name}
                                                                                    onChange={handleInputChange}
                                                                                    required
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                        <div className="col-sm-6">
                                                                            <div className="form-group">
                                                                                <label className="form-label">Nom *</label>
                                                                                <input
                                                                                    type="text"
                                                                                    className="form-control"
                                                                                    name="last_name"
                                                                                    value={formData.last_name}
                                                                                    onChange={handleInputChange}
                                                                                    required
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="row">
                                                                        <div className="col-sm-12">
                                                                            <div className="form-group">
                                                                                <label className="form-label">Email *</label>
                                                                                <input
                                                                                    type="email"
                                                                                    className="form-control"
                                                                                    name="email"
                                                                                    value={formData.email}
                                                                                    onChange={handleInputChange}
                                                                                    required
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="row">
                                                                        <div className="col-sm-12">
                                                                            <div className="form-group">
                                                                                <label className="form-label">Société</label>
                                                                                <input
                                                                                    type="text"
                                                                                    className="form-control"
                                                                                    value={
                                                                                        Array.isArray(user?.societe) && user.societe.length > 0
                                                                                            ? user.societe.map((s) => s.nom).join(', ')
                                                                                            : 'Non assigné'
                                                                                    }
                                                                                    readOnly
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="card-footer text-end btn-page">
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-outline-secondary"
                                                                        onClick={handleCancel}
                                                                    >
                                                                        Annuler
                                                                    </button>
                                                                    <button
                                                                        type="submit"
                                                                        className="btn btn-primary"
                                                                        disabled={loading}
                                                                    >
                                                                        {loading ? 'Enregistrement...' : 'Enregistrer'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </form>
                                                    </div>
                                                )}

                                                {activeTab === "user-cont-3" && (
                                                    <div className="tab-pane fade show active" id="user-cont-3" role="tabpanel">
                                                        <form onSubmit={handleChangePassword}>
                                                            <div className="card">
                                                                <div className="card-body">
                                                                    <h5>Changer le mot de passe</h5>
                                                                    <hr className="mb-4" />

                                                                    {/* Ancien mot de passe */}
                                                                    <div className="row">
                                                                        <div className="col-sm-12">
                                                                            <div className="form-group position-relative">
                                                                                <label className="form-label">Ancien mot de passe *</label>
                                                                                <input
                                                                                    type={showOldPassword ? "text" : "password"}
                                                                                    className="form-control"
                                                                                    name="old_password"
                                                                                    value={passwordData.old_password}
                                                                                    onChange={handlePasswordChange}
                                                                                    required
                                                                                    autoComplete="old_password"
                                                                                />
                                                                                <button
                                                                                    type="button"
                                                                                    className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                                                                                    onClick={() => setShowOldPassword(!showOldPassword)}
                                                                                >
                                                                                    {showOldPassword ? <EyeOff /> : <Eye />}
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Nouveau mot de passe */}
                                                                    <div className="row">
                                                                        <div className="col-sm-6">
                                                                            <div className="form-group position-relative">
                                                                                <label className="form-label">Nouveau mot de passe *</label>
                                                                                <input
                                                                                    type={showNewPassword ? "text" : "password"}
                                                                                    className="form-control"
                                                                                    name="new_password"
                                                                                    value={passwordData.new_password}
                                                                                    onChange={handlePasswordChange}
                                                                                    required
                                                                                    autoComplete="new-password"

                                                                                />
                                                                                <button
                                                                                    type="button"
                                                                                    className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                                                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                                                >
                                                                                    {showNewPassword ? <EyeOff /> : <Eye />}
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        {/* Confirmer mot de passe */}
                                                                        <div className="col-sm-6">
                                                                            <div className="form-group position-relative">
                                                                                <label className="form-label">Confirmer le mot de passe *</label>
                                                                                <input
                                                                                    type={showConfirmPassword ? "text" : "password"}
                                                                                    className="form-control"
                                                                                    name="confirm_password"
                                                                                    value={passwordData.confirm_password}
                                                                                    onChange={handlePasswordChange}
                                                                                    required
                                                                                    autoComplete="confirm_password"
                                                                                />
                                                                                <button
                                                                                    type="button"
                                                                                    className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                                                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                                                >
                                                                                    {showConfirmPassword ? <EyeOff /> : <Eye />}
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="card-footer text-end btn-page">
                                                                    <button
                                                                        type="button"
                                                                        className="btn btn-outline-secondary"
                                                                        onClick={handleCancelPassword}
                                                                    >
                                                                        Annuler
                                                                    </button>
                                                                    <button
                                                                        type="submit"
                                                                        className="btn btn-primary"
                                                                        disabled={loading}
                                                                    >
                                                                        {loading ? "Mise à jour..." : "Mettre à jour"}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </form>
                                                    </div>
                                                )}

                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <FooterAdmin />
        </div>
    );
};

export default ProfilUtilisateur;