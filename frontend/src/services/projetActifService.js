import api from './api';

export const projetActifService = {
  // Définir le projet actif
  async setProjetActif(projetId) {
    try {
      const response = await api.post('projet-actif/', { projet_id: projetId });
      return response.data;
    } catch (error) {
      console.error('Erreur définition projet actif:', error);
      throw error;
    }
  },

  // Récupérer le projet actif
  async getProjetActif() {
    try {
      const response = await api.get('projet-actif/get/');
      return response.data;
    } catch (error) {
      console.error('Erreur récupération projet actif:', error);
      throw error;
    }
  },

  // Vérifier si un projet est actif
  async hasProjetActif() {
    try {
      const data = await this.getProjetActif();
      return data.projet_actif !== null;
    } catch (error) {
      return false;
    }
  }
};