import api from './api';

export const projetService = {
    // Récupérer tous les projets de l'utilisateur
    async getUserProjects() {
        try {
            const response = await api.get('projets/');
            return response.data;
        } catch (error) {
            console.error('Erreur récupération projets:', error);
            throw error;
        }
    },

    // Récupérer les détails complets d'un projet
    async getProjectDetail(projectId) {
        try {
            const response = await api.get(`projets/${projectId}/detail-complet/`);
            return response.data;
        } catch (error) {
            console.error('Erreur récupération détail projet:', error);
            throw error;
        }
    },

    // Récupérer les configurations d'un projet
    async getProjectConfigurations(projectId) {
        try {
            const response = await api.get(`projets/${projectId}/configurations/`);
            return response.data;
        } catch (error) {
            console.error('Erreur récupération configurations:', error);
            throw error;
        }
    },

    // Récupérer les scripts d'un projet
    async getProjectScripts(projectId) {
        try {
            const response = await api.get(`projets/${projectId}/scripts/`);
            return response.data;
        } catch (error) {
            console.error('Erreur récupération scripts:', error);
            throw error;
        }
    },

    // Récupérer les exécutions d'un projet
    async getProjectExecutions(projectId) {
        try {
            const response = await api.get(`projets/${projectId}/executions/`);
            return response.data;
        } catch (error) {
            console.error('Erreur récupération exécutions:', error);
            throw error;
        }
    },

    // Récupérer les statistiques d'un projet
    async getProjectStatistics(projectId) {
        try {
            const response = await api.get(`projets/${projectId}/statistiques/`);
            return response.data;
        } catch (error) {
            console.error('Erreur récupération statistiques:', error);
            throw error;
        }
    }
};