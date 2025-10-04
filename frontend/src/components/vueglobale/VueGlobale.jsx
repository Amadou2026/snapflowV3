import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, CheckCircle, XCircle, AlertCircle, Calendar, Clock, PlayCircle, Activity, FileText } from 'lucide-react';
import HeaderAdmin from '../admin/HeaderAdmin';
import SidebarAdmin from '../admin/SidebarAdmin';
import FooterAdmin from '../admin/FooterAdmin';
import FiltreVueGlobale from './FiltreVueGlobale';
import api from '../../services/api';

const VueGlobale = ({ user, logout }) => {
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        projet: '',
        dateDebut: '',
        dateFin: '',
        periode: 'mois'
    });
    const [stats, setStats] = useState({
        testsParJour: [],
        successVsFailed: [],
        testsParProjet: [],
        tauxReussite: null,
        tauxErreurScript: [],
        repartitionProjet: [],
        repartitionErreurs: null,
        testsNonExecutes: [],
        scriptsTests: null,
        scriptsEnAttente: null,
        executionResultats: [],
        nextScripts: [],
        toExecute: [],
        overdue: [],
        executionResults: []
    });

    const buildQueryParams = () => {
        const params = {};
        if (filters.projet) params.projet_id = filters.projet;
        if (filters.dateDebut) params.start_date = filters.dateDebut;
        if (filters.dateFin) params.end_date = filters.dateFin;
        if (filters.periode) params.periode = filters.periode;
        return params;
    };

    const fetchAllStats = async () => {
        try {
            setLoading(true);
            const queryParams = buildQueryParams();

            const [
                testsJourRes,
                successFailedRes,
                testsProjetRes,
                tauxReussiteRes,
                testsNonExecuteRes,
                scriptsTestsRes,
                scriptsEnAttenteRes,
                executionResultatsRes,
                repartitionProjetRes,
                repartitionErreursRes,
                nextScriptsRes,
                toExecuteRes,
                overdueRes,
                executionResultsRes,
                tauxErreurScriptRes
            ] = await Promise.all([
                api.get('stats/tests-par-jour/', { params: queryParams }),
                api.get('stats/success-vs-failed-par-jour/', { params: queryParams }),
                api.get('stats/tests-par-projet/', { params: queryParams }),
                api.get('stats/taux-reussite/', { params: queryParams }),
                api.get('stats/nombre-test-non-execute/', { params: queryParams }),
                api.get('stats/scripts-tests/', { params: queryParams }),
                api.get('stats/scripts-en-attente/', { params: queryParams }),
                api.get('stats/execution-resultats-concluant-nonconcluant/', { params: queryParams }),
                api.get('stats/repartition-projet/', { params: queryParams }),
                api.get('stats/repartition-projet-erreurs/', { params: queryParams }),
                api.get('stats/next-scripts/', { params: queryParams }),
                api.get('stats/to-execute/', { params: queryParams }),
                api.get('stats/overdue/', { params: queryParams }),
                api.get('stats/execution-results/', { params: queryParams }),
                api.get('stats/taux-erreur-par-script/', { params: queryParams })
            ]);

            // Formatage des données
            const testsParJourData = {};
            Object.entries(testsJourRes.data).forEach(([projet, data]) => {
                testsParJourData[projet] = data.map(item => ({
                    date: item.date,
                    total: item.total
                }));
            });

            const successVsFailed = successFailedRes.data.map(item => ({
                date: item.date,
                success: item.succès || 0,
                failed: item.échec || 0
            }));

            const testsParProjet = testsProjetRes.data.projet_labels.map((label, index) => ({
                projet: label,
                tests: testsProjetRes.data.projet_counts[index]
            }));

            const repartitionProjet = testsProjetRes.data.projet_labels.map((label, index) => ({
                name: label,
                value: testsProjetRes.data.projet_counts[index],
                color: ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][index % 5]
            }));

            const tauxErreurScript = tauxErreurScriptRes.data.map(item => ({
                script: item.script,
                erreurs: item.erreurs
            }));

            const testsNonExecutes = testsNonExecuteRes.data.map(item => ({
                date: item.date,
                non_execute: item.non_execute,
                non_concluant: item.non_concluant
            }));

            setStats({
                testsParJour: testsParJourData,
                successVsFailed,
                testsParProjet,
                tauxReussite: tauxReussiteRes.data,
                repartitionProjet,
                repartitionErreurs: repartitionErreursRes.data,
                testsNonExecutes,
                scriptsTests: scriptsTestsRes.data,
                scriptsEnAttente: scriptsEnAttenteRes.data,
                executionResultats: executionResultatsRes.data,
                nextScripts: nextScriptsRes.data,
                toExecute: toExecuteRes.data,
                overdue: overdueRes.data,
                executionResults: executionResultsRes.data,
                tauxErreurScript
            });

            setLoading(false);
        } catch (error) {
            console.error('Erreur lors du chargement des stats:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllStats();
    }, [filters]);

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    if (loading) {
        return (
            <div className="dashboard-wrapper">
                <HeaderAdmin user={user} logout={logout} />
                <div className="main-container">
                    <SidebarAdmin />
                    <div className="page-wrapper">
                        <div className="pc-content">
                            <div className="text-center p-5">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Chargement...</span>
                                </div>
                                <p className="mt-3 text-muted">Chargement des statistiques...</p>
                            </div>
                        </div>
                    </div>
                </div>
                <FooterAdmin />
            </div>
        );
    }

    // Calculs pour les KPIs
    const totalTests = stats.tauxReussite?.total || 0;
    const testsReussis = stats.tauxReussite?.succès || 0;
    const testsEchoues = stats.tauxReussite?.échec || 0;
    const tauxReussite = stats.tauxReussite?.taux_reussite || 0;
    const tauxEchec = stats.tauxReussite?.taux_echec || 0;
    
    const scriptsNonExecutes = stats.scriptsTests?.scripts_non_executes || 0;
    const percentScriptsNonExecutes = stats.scriptsTests?.percent_scripts_non_executes || 0;
    const testsEnEchec = stats.scriptsTests?.tests_en_echec || 0;
    const percentTestsEchec = stats.scriptsTests?.percent_tests_echec || 0;
    
    const scriptsEnAttente = stats.scriptsEnAttente?.tests_script_en_attente || 0;

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
                                                    <Link to="/dashboard">Accueil</Link>
                                                </li>
                                                <li className="breadcrumb-item">
                                                    <Link to="/dashboard">Dashboard</Link>
                                                </li>
                                                <li className="breadcrumb-item" aria-current="page">
                                                    Vue Globale
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="col-md-12">
                                            <div className="page-header-title">
                                                <h2 className="mb-0">Vue Globale</h2>
                                                <p className="text-muted mb-0">
                                                    Période: {filters.periode}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Filtres */}
                            <FiltreVueGlobale 
                                onFilterChange={handleFilterChange}
                                user={user}
                            />

                            {/* KPI Cards - Ligne 1 */}
                            <div className="row mb-4">
                                {/* Total Tests */}
                                <div className="col-md-6 col-xl-3">
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div>
                                                    <p className="text-muted mb-1">Total Tests</p>
                                                    <h3 className="mb-0">{totalTests}</h3>
                                                    <small className="text-muted">tests exécutés</small>
                                                </div>
                                                <div className="avtar avtar-l bg-light-primary">
                                                    <Activity className="text-primary" size={28} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Taux de Réussite */}
                                <div className="col-md-6 col-xl-3">
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div>
                                                    <p className="text-muted mb-1">Taux de Réussite</p>
                                                    <h3 className="mb-0">{tauxReussite.toFixed(1)}%</h3>
                                                    <small className="text-muted">
                                                        {testsReussis}/{totalTests} tests
                                                    </small>
                                                </div>
                                                <div className="avtar avtar-l bg-light-success">
                                                    <CheckCircle className="text-success" size={28} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Taux d'Échec */}
                                <div className="col-md-6 col-xl-3">
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div>
                                                    <p className="text-muted mb-1">Taux d'Échec</p>
                                                    <h3 className="mb-0">{tauxEchec.toFixed(1)}%</h3>
                                                    <small className="text-muted">
                                                        {testsEchoues}/{totalTests} tests
                                                    </small>
                                                </div>
                                                <div className="avtar avtar-l bg-light-danger">
                                                    <XCircle className="text-danger" size={28} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Scripts Planifiés */}
                                <div className="col-md-6 col-xl-3">
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div>
                                                    <p className="text-muted mb-1">Scripts Planifiés</p>
                                                    <h3 className="mb-0">{scriptsEnAttente}</h3>
                                                    <small className="text-muted">en attente</small>
                                                </div>
                                                <div className="avtar avtar-l bg-light-warning">
                                                    <Clock className="text-warning" size={28} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* KPI Cards - Ligne 2 */}
                            <div className="row mb-4">
                                {/* Scripts Non Exécutés */}
                                <div className="col-md-6 col-xl-3">
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div>
                                                    <p className="text-muted mb-1">Scripts Non Exécutés</p>
                                                    <h3 className="mb-0">{scriptsNonExecutes}</h3>
                                                    <small className="text-muted">
                                                        {percentScriptsNonExecutes.toFixed(1)}% du total
                                                    </small>
                                                </div>
                                                <div className="avtar avtar-l bg-light-danger">
                                                    <AlertCircle className="text-danger" size={28} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tests en Échec */}
                                <div className="col-md-6 col-xl-3">
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div>
                                                    <p className="text-muted mb-1">Tests en Échec</p>
                                                    <h3 className="mb-0">{testsEnEchec}</h3>
                                                    <small className="text-muted">
                                                        {percentTestsEchec.toFixed(1)}% du total
                                                    </small>
                                                </div>
                                                <div className="avtar avtar-l bg-light-danger">
                                                    <XCircle className="text-danger" size={28} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Configurations Retard */}
                                <div className="col-md-6 col-xl-3">
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div>
                                                    <p className="text-muted mb-1">En Retard</p>
                                                    <h3 className="mb-0">{stats.overdue?.total_count || 0}</h3>
                                                    <small className="text-muted">configurations</small>
                                                </div>
                                                <div className="avtar avtar-l bg-light-warning">
                                                    <AlertCircle className="text-warning" size={28} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* À Exécuter */}
                                <div className="col-md-6 col-xl-3">
                                    <div className="card">
                                        <div className="card-body">
                                            <div className="d-flex align-items-center justify-content-between">
                                                <div>
                                                    <p className="text-muted mb-1">À Exécuter</p>
                                                    <h3 className="mb-0">{stats.toExecute?.total_count || 0}</h3>
                                                    <small className="text-muted">configurations</small>
                                                </div>
                                                <div className="avtar avtar-l bg-light-info">
                                                    <PlayCircle className="text-info" size={28} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Graphiques - Ligne 1 */}
                            <div className="row mb-4">
                                {/* Tests par Jour */}
                                <div className="col-lg-8">
                                    <div className="card">
                                        <div className="card-header">
                                            <h5>Tests Exécutés par Jour</h5>
                                        </div>
                                        <div className="card-body">
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={Object.values(stats.testsParJour)[0] || []}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="date" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar dataKey="total" fill="#4f46e5" name="Tests" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                {/* Répartition par Projet */}
                                <div className="col-lg-4">
                                    <div className="card">
                                        <div className="card-header">
                                            <h5>Répartition par Projet</h5>
                                        </div>
                                        <div className="card-body">
                                            <ResponsiveContainer width="100%" height={300}>
                                                <PieChart>
                                                    <Pie
                                                        data={stats.repartitionProjet}
                                                        cx="50%"
                                                        cy="50%"
                                                        labelLine={false}
                                                        outerRadius={80}
                                                        fill="#8884d8"
                                                        dataKey="value"
                                                        label={(entry) => entry.name}
                                                    >
                                                        {stats.repartitionProjet.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Graphiques - Ligne 2 */}
                            <div className="row mb-4">
                                {/* Succès vs Échecs */}
                                <div className="col-lg-8">
                                    <div className="card">
                                        <div className="card-header">
                                            <h5>Succès vs Échecs par Jour</h5>
                                        </div>
                                        <div className="card-body">
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={stats.successVsFailed}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="date" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar dataKey="success" fill="#10b981" name="Succès" />
                                                    <Bar dataKey="failed" fill="#ef4444" name="Échecs" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                {/* Erreurs par Script */}
                                <div className="col-lg-4">
                                    <div className="card">
                                        <div className="card-header">
                                            <h5>Top Erreurs par Script</h5>
                                        </div>
                                        <div className="card-body">
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={stats.tauxErreurScript.slice(0, 5)} layout="vertical">
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis type="number" />
                                                    <YAxis dataKey="script" type="category" width={100} />
                                                    <Tooltip />
                                                    <Bar dataKey="erreurs" fill="#ef4444" />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tests Non Exécutés et Non Concluants */}
                            <div className="row mb-4">
                                <div className="col-12">
                                    <div className="card">
                                        <div className="card-header">
                                            <h5>Tests Non Exécutés et Non Concluants</h5>
                                        </div>
                                        <div className="card-body">
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={stats.testsNonExecutes}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="date" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar dataKey="non_execute" fill="#dc2626" name="Non Exécutés" />
                                                    <Bar dataKey="non_concluant" fill="#eab308" name="Non Concluants" />
                                                </BarChart>
                                            </ResponsiveContainer>
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

export default VueGlobale;