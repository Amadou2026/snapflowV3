// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    // Vérifier si un token existe au chargement de l'app
    useEffect(() => {
        const checkAuthStatus = async () => {
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    // Vérifier si le token est valide en décodant
                    const decoded = jwtDecode(token);

                    // Vérifier si le token n'est pas expiré
                    if (decoded.exp * 1000 < Date.now()) {
                        throw new Error('Token expiré');
                    }

                    // Récupérer le profil complet depuis le backend
                    const response = await api.get('user/profile/');
                    setUser(response.data);
                    setIsAuthenticated(true);
                } catch (err) {
                    console.error('Erreur d\'authentification', err);
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    setUser(null);
                    setIsAuthenticated(false);
                }
            }
            setLoading(false);
        };

        checkAuthStatus();
    }, []);

    // Loading spinner pendant la vérification
    if (loading) {
        return (
            <div className="loading-container d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Chargement...</span>
                </div>
            </div>
        );
    }

    return (
        <AuthContext.Provider value={{
            user,
            setUser,
            isAuthenticated,
            setIsAuthenticated,
            loading
        }}>
            {children}
        </AuthContext.Provider>
    );
};