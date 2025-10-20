import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const FilterDashboard = ({ onFilterChange, selectedProject, setSelectedProject, currentFilters }) => {
  const [filters, setFilters] = useState({
    startDate: currentFilters.date_debut || '',
    endDate: currentFilters.date_fin || '',
    periode: currentFilters.periode || 'mois',
    projet_id: currentFilters.projet_id || ''
  });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  // Périodes prédéfinies
  const periodes = [
    { value: 'jour', label: 'Dernier jour' },
    { value: 'semaine', label: 'Dernière semaine' },
    { value: 'mois', label: 'Dernier mois' },
    { value: 'annee', label: 'Dernière année' },
    { value: 'personnalise', label: 'Personnalisée' }
  ];

  useEffect(() => {
    fetchProjects();
  }, []);

  // Synchroniser avec les props quand elles changent
  useEffect(() => {
    setFilters({
      startDate: currentFilters.date_debut || '',
      endDate: currentFilters.date_fin || '',
      periode: currentFilters.periode || 'mois',
      projet_id: currentFilters.projet_id || ''
    });
  }, [currentFilters]);

  // CORRECTION: Utiliser l'endpoint 'projets/' au lieu de 'stats/tests-par-projet/'
  const fetchProjects = async () => {
    try {
      const response = await api.get('projets/');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = {
      ...filters,
      [key]: value
    };

    // Si la période change et n'est pas "personnalise", réinitialiser les dates
    if (key === 'periode' && value !== 'personnalise') {
      newFilters.startDate = '';
      newFilters.endDate = '';
    }

    setFilters(newFilters);
    
    // Mettre à jour le projet sélectionné dans le parent
    if (key === 'projet_id') {
      setSelectedProject(value);
    }

    // Pour les périodes prédéfinies, appliquer automatiquement
    if (key === 'periode' && value !== 'personnalise') {
      applyFilters(newFilters);
    } else if (key === 'projet_id') {
      applyFilters(newFilters);
    }
  };

  const applyFilters = (customFilters = null) => {
    const filtersToUse = customFilters || filters;
    
    // Pour période personnalisée, vérifier que les deux dates sont remplies
    if (filtersToUse.periode === 'personnalise') {
      if (!filtersToUse.startDate || !filtersToUse.endDate) {
        return; // Ne pas appliquer si dates manquantes
      }
    }

    setLoading(true);
    
    // Préparer les paramètres pour l'API
    const params = {};
    
    if (filtersToUse.projet_id) {
      params.projet_id = filtersToUse.projet_id;
    }
    
    if (filtersToUse.periode === 'personnalise' && filtersToUse.startDate && filtersToUse.endDate) {
      params.periode = 'personnalise';
      params.date_debut = filtersToUse.startDate;
      params.date_fin = filtersToUse.endDate;
    } else if (filtersToUse.periode !== 'personnalise') {
      params.periode = filtersToUse.periode;
    }

    console.log('Applying filters:', params);
    
    // Appeler le callback parent avec les nouveaux filtres
    onFilterChange(params);
    
    // Arrêter le loading après un délai
    setTimeout(() => setLoading(false), 300);
  };

  const handleApplyClick = () => {
    applyFilters();
  };

  const handleResetFilters = () => {
    const resetFilters = {
      startDate: '',
      endDate: '',
      periode: 'mois',
      projet_id: ''
    };
    setFilters(resetFilters);
    setSelectedProject('');
    onFilterChange({
      periode: 'mois',
      projet_id: '',
      date_debut: '',
      date_fin: ''
    });
  };

  // Calculer la date maximale pour endDate (aujourd'hui)
  const getMaxDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Calculer la date minimale pour startDate (1 an avant aujourd'hui)
  const getMinDate = () => {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    return oneYearAgo.toISOString().split('T')[0];
  };

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="card-title mb-0">
          <i className="ti ti-filter me-2"></i>
          Filtres du Dashboard
        </h5>
      </div>
      <div className="card-body">
        <div className="row g-3">
          {/* Filtre par période */}
          <div className={filters.periode === 'personnalise' ? "col-md-3" : "col-md-4"}>
            <label className="form-label">Période</label>
            <select 
              className="form-select"
              value={filters.periode}
              onChange={(e) => handleFilterChange('periode', e.target.value)}
            >
              {periodes.map(periode => (
                <option key={periode.value} value={periode.value}>
                  {periode.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date de début - visible seulement pour période personnalisée */}
          {filters.periode === 'personnalise' && (
            <div className="col-md-3">
              <label className="form-label">Date de début</label>
              <input
                type="date"
                className="form-control"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                min={getMinDate()}
                max={filters.endDate || getMaxDate()}
              />
            </div>
          )}

          {/* Date de fin - visible seulement pour période personnalisée */}
          {filters.periode === 'personnalise' && (
            <div className="col-md-3">
              <label className="form-label">Date de fin</label>
              <input
                type="date"
                className="form-control"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                min={filters.startDate || getMinDate()}
                max={getMaxDate()}
              />
            </div>
          )}

          {/* Filtre par projet */}
          <div className={filters.periode === 'personnalise' ? "col-md-3" : "col-md-5"}>
            <label className="form-label">Projet</label>
            <select 
              className="form-select"
              value={filters.projet_id}
              onChange={(e) => handleFilterChange('projet_id', e.target.value)}
            >
              <option value="">Tous les projets</option>
              {/* CORRECTION: Utiliser projet.nom au lieu de projet.projet */}
              {projects.map((projet, index) => (
                <option key={projet.id || index} value={projet.id || index}>
                  {projet.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Bouton Reset pour périodes prédéfinies */}
          {filters.periode !== 'personnalise' && (
            <div className="col-md-3 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={handleResetFilters}
                disabled={loading}
              >
                <i className="ti ti-refresh me-1"></i>
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Boutons pour période personnalisée - rangée séparée */}
        {filters.periode === 'personnalise' && (
          <div className="row mt-3">
            <div className="col-12 d-flex justify-content-end gap-2">
              <button
                className="btn btn-outline-secondary px-4"
                onClick={handleResetFilters}
                disabled={loading}
              >
                <i className="ti ti-refresh me-1"></i>
                Réinitialiser
              </button>
              <button
                className="btn btn-primary px-4"
                onClick={handleApplyClick}
                disabled={loading || !filters.startDate || !filters.endDate}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-1" />
                    Application...
                  </>
                ) : (
                  <>
                    <i className="ti ti-check me-1"></i>
                    Appliquer les filtres
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterDashboard;