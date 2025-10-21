import React, { useState, useEffect } from 'react';
import HeaderAdmin from '../components/admin/HeaderAdmin';
import FooterAdmin from '../components/admin/FooterAdmin';
import SidebarAdmin from '../components/admin/SidebarAdmin';
import FilterDashboard from '../components/dashboard/FilterDashboard';
import api from '../services/api';

const Dashboard = ({ user, logout }) => {
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    executionResultats: [],
    tauxErreurScript: []
  });
  const [loading, setLoading] = useState(true);
  const [activeFilters, setActiveFilters] = useState({
    periode: 'mois',
    projet_id: '',
    date_debut: '',
    date_fin: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, [activeFilters]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const params = Object.fromEntries(
        Object.entries(activeFilters).filter(([_, value]) => value !== '')
      );

      console.log('Fetching dashboard data with params:', params);

      const [
        executionResultatsResponse,
        tauxErreurScriptResponse,
        tauxReussiteResponse
      ] = await Promise.all([
        api.get('/stats/execution-results/', { params }),
        api.get('/stats/taux-erreur-par-script/', { params }),
        api.get('/stats/taux-reussite/', { params })
      ]);

      const totalSuccess = tauxReussiteResponse.data.succès || 0;
      const totalEchec = tauxReussiteResponse.data.échec || 0;
      const tauxReussite = tauxReussiteResponse.data.taux_reussite || 0;
      const tauxEchec = tauxReussiteResponse.data.taux_echec || 0;

      setDashboardData({
        stats: {
          totalTests: totalSuccess + totalEchec,
          totalSuccess: totalSuccess,
          totalEchec: totalEchec,
          tauxReussite: tauxReussite,
          tauxEchec: tauxEchec
        },
        executionResultats: executionResultatsResponse.data || [],
        tauxErreurScript: tauxErreurScriptResponse.data
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    console.log('Setting active filters:', newFilters);
    setActiveFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  const handleProjectChange = (projet_id) => {
    setActiveFilters(prev => ({
      ...prev,
      projet_id
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${day}/${month}/${year}`;
    } catch (error) {
      return dateString;
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      
      return `${hours}:${minutes}:${seconds}`;
    } catch (error) {
      return dateString;
    }
  };

  const getStatusBadge = (statut) => {
    if (statut === 'réussi' || statut === 'success' || statut === 'Réussi') {
      return <span className="badge bg-success">Réussi</span>;
    } else if (statut === 'échec' || statut === 'failed' || statut === 'Échec') {
      return <span className="badge bg-danger">Échec</span>;
    } else {
      return <span className="badge bg-warning">En attente</span>;
    }
  };

  if (loading) {
    return (
      <div className="pc-container">
        <HeaderAdmin user={user} logout={logout} />
        <div className="pc-content">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Chargement du Dashboard...</p>
            </div>
          </div>
        </div>
        <FooterAdmin />
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper">
      <HeaderAdmin user={user} logout={logout} />

      <div className="main-container">
        <SidebarAdmin />

        <div className="pc-container">
          <div className="pc-content">
            <div className="page-header">
              <div className="page-block">
                <div className="row align-items-center">
                  <div className="col-md-12">
                    <div className="page-header-title">
                      <h5 className="m-b-10">Bienvenue {user?.first_name} {user?.last_name}</h5>
                    </div>
                    <ul className="breadcrumb">
                      <li className="breadcrumb-item"><a href="#!">Dashboard</a></li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="row mb-4">
              <div className="col-12">
                <FilterDashboard
                  onFilterChange={handleFilterChange}
                  selectedProject={activeFilters.projet_id}
                  setSelectedProject={handleProjectChange}
                  currentFilters={activeFilters}
                />
              </div>
            </div>

            {(activeFilters.projet_id || activeFilters.periode !== 'mois') && (
              <div className="row mb-3">
                <div className="col-12">
                  <div className="alert alert-info py-2">
                    <small>
                      <i className="ti ti-filter me-1"></i>
                      Filtres actifs:
                      {activeFilters.projet_id && ` Projet: ${activeFilters.projet_id}`}
                      {activeFilters.periode && ` | Période: ${activeFilters.periode}`}
                      {activeFilters.date_debut && activeFilters.date_fin &&
                        ` (${formatDate(activeFilters.date_debut)} - ${formatDate(activeFilters.date_fin)})`
                      }
                    </small>
                  </div>
                </div>
              </div>
            )}

            <div className="row">
              <div className="col-md-6 col-xl-3">
                <div className="card">
                  <div className="card-body">
                    <h6 className="mb-2 f-w-400 text-muted">Total de tests</h6>
                    <h4 className="mb-3">
                      {dashboardData.stats.totalTests?.toLocaleString()}
                      <span className="badge bg-light-primary border border-primary ms-2">
                        <i className="ti ti-chart-bar"></i> Total
                      </span>
                    </h4>
                    <p className="mb-0 text-muted text-sm">
                      Nombre total de tests exécutés
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-md-6 col-xl-3">
                <div className="card">
                  <div className="card-body">
                    <h6 className="mb-2 f-w-400 text-muted">Total succès</h6>
                    <h4 className="mb-3">
                      {dashboardData.stats.totalSuccess?.toLocaleString()}
                      <span className={`badge bg-light-${dashboardData.stats.tauxReussite > 70 ? 'success' : 'warning'} border border-${dashboardData.stats.tauxReussite > 70 ? 'success' : 'warning'} ms-2`}>
                        <i className={`ti ti-trending-${dashboardData.stats.tauxReussite > 70 ? 'up' : 'down'}`}></i>
                        {dashboardData.stats.tauxReussite}%
                      </span>
                    </h4>
                    <p className="mb-0 text-muted text-sm">
                      Taux de réussite global
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-md-6 col-xl-3">
                <div className="card">
                  <div className="card-body">
                    <h6 className="mb-2 f-w-400 text-muted">Total échec</h6>
                    <h4 className="mb-3">
                      {dashboardData.stats.totalEchec?.toLocaleString()}
                      <span className={`badge bg-light-${dashboardData.stats.tauxEchec < 30 ? 'warning' : 'danger'} border border-${dashboardData.stats.tauxEchec < 30 ? 'warning' : 'danger'} ms-2`}>
                        <i className="ti ti-alert-triangle"></i>
                        {dashboardData.stats.tauxEchec}%
                      </span>
                    </h4>
                    <p className="mb-0 text-muted text-sm">
                      Taux d'échec global
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-md-6 col-xl-3">
                <div className="card">
                  <div className="card-body">
                    <h6 className="mb-2 f-w-400 text-muted">Scripts analysés</h6>
                    <h4 className="mb-3">
                      {dashboardData.tauxErreurScript.length}
                      <span className="badge bg-light-info border border-info ms-2">
                        <i className="ti ti-script"></i> Actifs
                      </span>
                    </h4>
                    <p className="mb-0 text-muted text-sm">
                      Nombre de scripts suivis
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-md-12">
                <div className="card">
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <h5>Historique d'exécution des scripts</h5>
                    <span className="badge bg-primary">{dashboardData.executionResultats.length} exécutions</span>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Script</th>
                            <th>Date d'exécution</th>
                            <th>Horaire</th>
                            <th>Statut</th>
                            <th className="text-center">Nbre d'exécutions</th>
                            <th>Campagnes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.executionResultats.map((execution, index) => (
                            <tr key={index}>
                              <td className="text-truncate" style={{ maxWidth: '200px' }} title={execution.script_nom || execution.script}>
                                <i className="ti ti-file-code me-2"></i>
                                {execution.script_nom || execution.script || 'N/A'}
                              </td>
                              <td>{formatDate(execution.date_execution || execution.date)}</td>
                              <td className="text-muted">
                                <i className="ti ti-clock me-1"></i>
                                {formatTime(execution.date_execution || execution.date)}
                              </td>
                              <td>{getStatusBadge(execution.statut || execution.resultat)}</td>
                              <td className="text-center">
                                <span className="badge bg-light-secondary border">
                                  {execution.nombre_executions || execution.total || 1}
                                </span>
                              </td>
                              <td>
                                <div className="d-flex flex-wrap gap-1">
                                  {execution.campagnes && execution.campagnes.length > 0 ? (
                                    execution.campagnes.map((campagne, idx) => (
                                      <span key={idx} className="badge bg-light-info" title={campagne}>
                                        {campagne.length > 20 ? campagne.substring(0, 20) + '...' : campagne}
                                      </span>
                                    ))
                                  ) : execution.projet ? (
                                    <span className="badge bg-light-info">{execution.projet}</span>
                                  ) : (
                                    <span className="text-muted">-</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                          {dashboardData.executionResultats.length === 0 && (
                            <tr>
                              <td colSpan="6" className="text-center text-muted py-4">
                                <i className="ti ti-inbox-off" style={{ fontSize: '2rem' }}></i>
                                <p className="mb-0 mt-2">Aucune exécution disponible</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-12 col-xl-6">
                <div className="card">
                  <div className="card-header">
                    <h5>Top scripts avec erreurs</h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Script</th>
                            <th>Total</th>
                            <th>Erreurs</th>
                            <th>Taux d'erreur</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.tauxErreurScript.slice(0, 8).map((script, index) => (
                            <tr key={index}>
                              <td className="text-truncate" style={{ maxWidth: '200px' }} title={script.script}>
                                {script.script}
                              </td>
                              <td>{script.total}</td>
                              <td className="text-danger fw-bold">{script.erreurs}</td>
                              <td>
                                <span className={`badge bg-light-${script.taux_erreur > 50 ? 'danger' : script.taux_erreur > 20 ? 'warning' : 'success'}`}>
                                  {script.taux_erreur}%
                                </span>
                              </td>
                            </tr>
                          ))}
                          {dashboardData.tauxErreurScript.length === 0 && (
                            <tr>
                              <td colSpan="4" className="text-center text-muted">
                                Aucune donnée disponible
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
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

export default Dashboard;