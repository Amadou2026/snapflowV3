import React, { useState, useEffect } from 'react';
import HeaderAdmin from '../components/admin/HeaderAdmin';
import FooterAdmin from '../components/admin/FooterAdmin';
import SidebarAdmin from '../components/admin/SidebarAdmin';
import FilterDashboard from '../components/dashboard/FilterDashboard';
import api from '../services/api';

const Dashboard = ({ user, logout }) => {
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    testsParJour: [],
    successVsFailed: [],
    testsParProjet: [],
    tauxReussite: {},
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

      // Nettoyer les paramètres vides
      const params = Object.fromEntries(
        Object.entries(activeFilters).filter(([_, value]) => value !== '')
      );

      console.log('Fetching dashboard data with params:', params);

      // Récupérer toutes les données statistiques en parallèle
      const [
        testsParJourResponse,
        successVsFailedResponse,
        testsParProjetResponse,
        tauxReussiteResponse,
        tauxErreurScriptResponse
      ] = await Promise.all([
        api.get('/stats/tests-par-jour/', { params }),
        api.get('/stats/success-vs-failed-par-jour/', { params }),
        api.get('/stats/tests-par-projet/', { params }),
        api.get('/stats/taux-reussite/', { params }),
        api.get('/stats/taux-erreur-par-script/', { params })
      ]);

      // Calculer les totaux pour les cartes de stats
      const totalTests = testsParProjetResponse.data.reduce((sum, projet) => sum + projet.total, 0);
      const totalSuccess = tauxReussiteResponse.data.succès || 0;
      const totalEchec = tauxReussiteResponse.data.échec || 0;
      const tauxReussite = tauxReussiteResponse.data.taux_reussite || 0;
      const tauxEchec = tauxReussiteResponse.data.taux_echec || 0;

      setDashboardData({
        stats: {
          totalTests: totalTests,
          totalSuccess: totalSuccess,
          totalEchec: totalEchec,
          tauxReussite: tauxReussite,
          tauxEchec: tauxEchec
        },
        testsParJour: testsParJourResponse.data,
        successVsFailed: successVsFailedResponse.data,
        testsParProjet: testsParProjetResponse.data,
        tauxReussite: tauxReussiteResponse.data,
        tauxErreurScript: tauxErreurScriptResponse.data
      });

      // console.log('✅ Tests par jour:', testsParJourResponse.data);
      // console.log('✅ Success vs Failed:', successVsFailedResponse.data);
      // console.log('✅ Tests par projet:', testsParProjetResponse.data);
      // console.log('✅ Taux réussite:', tauxReussiteResponse.data);
      // console.log('✅ Taux erreur script:', tauxErreurScriptResponse.data);

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

  // Fonction pour formater les dates
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  // Obtenir les 7 derniers jours de données
  const getLast7DaysData = () => {
    return dashboardData.successVsFailed.slice(-7);
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
            {/* Breadcrumb */}
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

            {/* Filtres */}
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

            {/* Indicateur de filtres actifs */}
            {(activeFilters.projet_id || activeFilters.periode !== 'mois') && (
              <div className="row mb-3">
                <div className="col-12">
                  <div className="alert alert-info py-2">
                    <small>
                      <i className="ti ti-filter me-1"></i>
                      Filtres actifs:
                      {activeFilters.projet_id && ` Projet: ${dashboardData.testsParProjet.find(p => (p.id || p.projet) === activeFilters.projet_id)?.projet}`}
                      {activeFilters.periode && ` | Période: ${activeFilters.periode}`}
                      {activeFilters.date_debut && activeFilters.date_fin &&
                        ` (${formatDate(activeFilters.date_debut)} - ${formatDate(activeFilters.date_fin)})`
                      }
                    </small>
                  </div>
                </div>
              </div>
            )}

            {/* Main Content */}
            <div className="row">
              {/* Stats Cards */}
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

              {/* Tests par jour */}
              <div className="col-md-12 col-xl-6">
                <div className="card">
                  <div className="card-header">
                    <h5>Tests par jour</h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Projet</th>
                            <th>Date</th>
                            <th className="text-end">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(dashboardData.testsParJour).slice(0, 5).map(([projet, data], index) => (
                            data.slice(0, 2).map((item, itemIndex) => (
                              <tr key={`${index}-${itemIndex}`}>
                                {itemIndex === 0 && (
                                  <td rowSpan={Math.min(data.length, 2)} className="fw-bold">
                                    {projet}
                                  </td>
                                )}
                                <td>{item.date ? formatDate(item.date) : 'N/A'}</td>
                                <td className="text-end">{item.total}</td>
                              </tr>
                            ))
                          ))}
                          {Object.keys(dashboardData.testsParJour).length === 0 && (
                            <tr>
                              <td colSpan="3" className="text-center text-muted">
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

              {/* Succès vs Échec par jour */}
              <div className="col-md-12 col-xl-6">
                <div className="card">
                  <div className="card-header">
                    <h5>Succès vs Échec</h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th className="text-success">Succès</th>
                            <th className="text-danger">Échec</th>
                            <th className="text-info">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getLast7DaysData().map((item, index) => (
                            <tr key={index}>
                              <td>{formatDate(item.date)}</td>
                              <td className="text-success fw-bold">{item.succès}</td>
                              <td className="text-danger fw-bold">{item.échec}</td>
                              <td className="text-info fw-bold">{item.succès + item.échec}</td>
                            </tr>
                          ))}
                          {dashboardData.successVsFailed.length === 0 && (
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

              {/* Top scripts avec erreurs */}
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

              {/* Répartition par projet */}
              <div className="col-md-12 col-xl-6">
                <div className="card">
                  <div className="card-header">
                    <h5>Répartition par projet</h5>
                  </div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Projet</th>
                            <th className="text-end">Total tests</th>
                            <th className="text-end">Pourcentage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dashboardData.testsParProjet.slice(0, 8).map((projet, index) => {
                            const percentage = dashboardData.stats.totalTests > 0
                              ? ((projet.total / dashboardData.stats.totalTests) * 100).toFixed(1)
                              : 0;
                            return (
                              <tr key={index}>
                                <td>{projet.projet}</td>
                                <td className="text-end fw-bold">{projet.total}</td>
                                <td className="text-end">
                                  <span className="badge bg-light-primary">{percentage}%</span>
                                </td>
                              </tr>
                            );
                          })}
                          {dashboardData.testsParProjet.length === 0 && (
                            <tr>
                              <td colSpan="3" className="text-center text-muted">
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

              {/* Détails taux de réussite */}
              {/* <div className="col-md-12">
                <div className="card">
                  <div className="card-header">
                    <h5>Détails du taux de réussite</h5>
                  </div>
                  <div className="card-body">
                    <div className="row text-center">
                      <div className="col-md-3">
                        <h3 className="text-primary">{dashboardData.tauxReussite.total}</h3>
                        <p className="text-muted">Total tests</p>
                      </div>
                      <div className="col-md-3">
                        <h3 className="text-success">{dashboardData.tauxReussite.succès}</h3>
                        <p className="text-muted">Succès</p>
                      </div>
                      <div className="col-md-3">
                        <h3 className="text-danger">{dashboardData.tauxReussite.échec}</h3>
                        <p className="text-muted">Échecs</p>
                      </div>
                      <div className="col-md-3">
                        <h3 className="text-info">{dashboardData.tauxReussite.taux_reussite}%</h3>
                        <p className="text-muted">Taux de réussite</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>

      <FooterAdmin />
    </div>
  );
};

export default Dashboard;