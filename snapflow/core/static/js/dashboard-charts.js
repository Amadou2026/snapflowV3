// dashboard-charts.js

// Configuration globale des graphiques
Chart.defaults.font.family = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
Chart.defaults.color = '#64748b';
Chart.defaults.borderColor = '#e2e8f0';

// Couleurs modernes
const colors = {
  primary: '#3b82f6',
  success: '#3b82f6',
  error: '#ef4444',
  warning: '#f59e0b',
  purple: '#8b5cf6',
  pink: '#ec4899',
  indigo: '#6366f1',
  teal: '#14b8a6'
};

// Fonction pour récupérer le projet sélectionné dans le <select>
function getSelectedProjetId() {
  const select = document.getElementById('projet');
  if (!select) {
    console.log("Select projet non trouvé");
    return null;
  }
  const val = select.value;
  console.log("Valeur sélectionnée dans projet:", val);
  return val !== "" ? val : null;
}

// Fonction dédiée pour initialiser le graphique tests par jour (sous forme de barres)
function initTestsChart(labels, values, projectName) {
  const ctx = document.getElementById('testsChart').getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Tests exécutés',
        data: values,
        backgroundColor: colors.primary + '80',
        borderColor: colors.primary,
        borderWidth: 1,
        borderRadius: 4,
        barThickness: 32
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#f1f5f9',
          bodyColor: '#f1f5f9',
          borderColor: '#334155',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: (context) => 'Date : ' + context[0].label,
            label: (context) => context.parsed.y + ' tests exécutés'
          }
        },
        datalabels: {
          color: '#ff0000ff',
          font: {
            size: 12,
            weight: 'bold'
          },
          anchor: 'end',
          align: 'start',
          formatter: function (value) {
            return `${projectName} : ${value}`;
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          ticks: { color: '#64748b' }
        },
        x: {
          grid: { display: false },
          ticks: { color: '#64748b' }
        }
      }
    },
    plugins: [ChartDataLabels] // 👈 Active le plugin datalabels
  });
}



function initProjetChart(labels, counts) {
  const ctx = document.getElementById('projetChart').getContext('2d');

  // Générer dynamiquement une couleur par projet
  const generateColors = (count) => {
    const baseColors = [
      '#0ea5e9', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1', '#14b8a6',
      '#ef4444', '#84cc16', '#eab308', '#a855f7', '#06b6d4', '#f97316', '#22d3ee'
    ];
    // Boucle la liste de couleurs si on a plus de projets que de couleurs de base
    return Array.from({ length: count }, (_, i) => baseColors[i % baseColors.length]);
  };

  const backgroundColors = generateColors(labels.length);

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        label: 'Tests',
        data: counts,
        backgroundColor: backgroundColors,
        borderWidth: 0,
        hoverBorderWidth: 3,
        hoverBorderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            padding: 20,
            usePointStyle: true,
            pointStyle: 'circle',
            font: { weight: '500' }
          }
        },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#f1f5f9',
          bodyColor: '#f1f5f9',
          borderColor: '#334155',
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: (context) => {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed * 100) / total).toFixed(1);
              return `${context.label}: ${context.parsed} tests (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}


// Fonction dédiée pour succès et échecs avec totaux affichés dans le sous-titre
function initSFChart(labels, successData, failData) {
  const totalSuccess = successData.reduce((a, b) => a + b, 0);
  const totalFail = failData.reduce((a, b) => a + b, 0);
  const totalAll = totalSuccess + totalFail;

  const extendedLabels = [...labels, "Total"];
  const extendedSuccessData = [...successData, totalSuccess];
  const extendedFailData = [...failData, totalFail];
  const extendedTotalData = extendedSuccessData.map((v, i) => v + (extendedFailData[i] || 0));

  const ctx = document.getElementById('sfChart').getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: extendedLabels,
      datasets: [
        {
          label: 'Succès',
          data: extendedSuccessData,
          backgroundColor: colors.success,
          borderWidth: 1
        },
        {
          label: 'Échecs',
          data: extendedFailData,
          backgroundColor: colors.error,
          borderWidth: 1
        },
        {
          label: 'Total',
          data: extendedTotalData,
          backgroundColor: 'rgba(232, 233, 235, 0)',
          borderWidth: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: {
            usePointStyle: true,
            pointStyle: 'rect',
            padding: 20,
            font: { weight: '500' },
            generateLabels: function (chart) {
              const defaultLabels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
              return defaultLabels.map(label => {
                if (label.text === 'Total') {
                  return {
                    ...label,
                    fillStyle: '#dddfe2ff',
                    fontColor: '#000000',
                    text: label.text
                  };
                }
                return label;
              });
            }
          }
        },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#f1f5f9',
          bodyColor: '#f1f5f9',
          borderColor: '#334155',
          borderWidth: 1,
          cornerRadius: 8,
          mode: 'index',
          intersect: false
        },
        datalabels: {
          color: (context) => {
            const datasetLabel = context.dataset.label;
            if (datasetLabel === 'Succès') return '#ffffffff'; // noir
            if (datasetLabel === 'Échecs') return '#ffffff'; // blanc
            if (datasetLabel === 'Total') return '#000000';  // noir
            return '#ffffff';
          },
          font: { weight: 'bold', size: 12 },
          formatter: (value, context) => (value === 0 ? '' : `${context.dataset.label}: ${value}`),
          anchor: 'end',
          align: 'start'
        }
      },
      scales: {
        x: {
          stacked: true,
          grid: { display: false },
          ticks: { color: '#64748b' }
        },
        y: {
          type: 'logarithmic',
          stacked: true,
          beginAtZero: true,
          max: 80,
          ticks: {
            stepSize: 5,
            color: '#64748b'
          },
          grid: { color: '#f1f5f9' }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: true
      }
    },
    plugins: [ChartDataLabels]
  });
}

  // init par defaut
  function initCharts() {
    // Initialisation par défaut si aucune autre fonction n'est encore appelée
    console.log("initCharts() appelée – aucun graphique spécifique défini.");

    // Exemple : désactive les erreurs silencieuses
    try {
      // Appelle les fonctions individuelles de graphiques si elles existent
      if (typeof initTestsParJourChart === 'function') initTestsParJourChart();
      if (typeof initRepartitionProjetChart === 'function') initRepartitionProjetChart();
      if (typeof initErreursParScriptChart === 'function') initErreursParScriptChart();
      if (typeof fetchScriptsTestsStats === 'function') fetchScriptsTestsStats();
    } catch (err) {
      console.error("Erreur dans initCharts():", err);
    }
  }

//  FIn


//Nouveau 
function initTestsChartMultiProjet(labels, datasets) {
  const canvas = document.getElementById('testsParJourChart');
  if (!canvas) {
    console.error("Canvas 'testsParJourChart' introuvable dans le DOM.");
    return;
  }

  const ctx = canvas.getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: context => `${context.dataset.label}: ${context.parsed.y}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: '#64748b' },
          grid: { color: '#f1f5f9' }
        },
        x: {
          ticks: { color: '#64748b', maxRotation: 45, minRotation: 45 },
          grid: { display: false }
        }
      }
    }
  });
}

// Debut erreur par script Tests non exécutés et non concluants

function initErreursScriptChart(labels, erreursCounts) {
  const ctx = document.getElementById('erreursScriptChart').getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: "Nombre d'erreurs",
        data: erreursCounts,
        backgroundColor: 'rgba(239, 68, 68, 0.7)', // rouge avec opacité
        borderColor: '#ef4444',
        borderWidth: 1,
        borderRadius: 6,
        barThickness: 24,
        maxBarThickness: 32,
      }]
    },
    options: {
      indexAxis: 'y', // REND LE GRAPH HORIZONTAL
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#1e293b',
          titleColor: '#f1f5f9',
          bodyColor: '#f1f5f9',
          borderColor: '#334155',
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: context => `${context.parsed.x} erreurs`
          }
        },
        datalabels: {
          color: '#f8fafc',
          anchor: 'end',
          align: 'right',
          font: {
            weight: 'bold',
            size: 12
          },
          formatter: value => value
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { color: '#64748b', stepSize: 1 },
          grid: { color: '#e2e8f0' }
        },
        y: {
          ticks: { color: '#475569' },
          grid: { display: false }
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}



// Fin erreur par script

// Chargement des données et initialisation des graphiques + KPI
document.addEventListener('DOMContentLoaded', () => {
  // Récupère le projet_id depuis l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const projetId = urlParams.get('projet_id');
  console.log("Projet sélectionné après DOM ready:", projetId);

  const queryParam = projetId ? `?projet_id=${projetId}` : '';

  // Fetch tests par jour
  fetch(`/api/stats/tests-par-jour${queryParam}`)
    .then(response => response.json())
    .then(testsParJourData => {
      // console.log("testsParJourData =", testsParJourData);

      const allDates = new Set();
      const datasets = [];

      const projectColors = [
        '#3b82f6', // bleu
        '#10b981', // vert
        '#f59e0b', // orange
        '#ef4444', // rouge
        '#8b5cf6', // violet
        '#0ea5e9'  // cyan
      ];

      let colorIndex = 0;

      for (const [projet, dataArray] of Object.entries(testsParJourData)) {
        const dataMap = {};
        dataArray.forEach(entry => {
          allDates.add(entry.date);
          dataMap[entry.date] = entry.total;
        });

        datasets.push({
          label: projet,
          data: dataMap, // { '2024-01-01': 4, ... }
          backgroundColor: projectColors[colorIndex % projectColors.length],
          borderRadius: 4,
          barThickness: 28
        });

        colorIndex++;
      }

      const sortedDates = Array.from(allDates).sort(); // pour avoir X cohérent

      // Convertir les objets "dataMap" en tableau aligné sur les dates
      datasets.forEach(ds => {
        ds.data = sortedDates.map(date => ds.data[date] || 0);
      });

      initTestsChartMultiProjet(sortedDates, datasets);
    })
    .catch(error => {
      console.error('Erreur récupération tests par jour:', error);
    });

  // === Graphique erreurs par script ===
  const canvasErreurs = document.getElementById('erreursScriptChart');
  if (canvasErreurs) {
    fetch(`/api/stats/taux-erreur-par-script${queryParam}`)
      .then(response => response.json())
      .then(data => {
        const labels = data.map(item => item.script);
        const erreursCounts = data.map(item => item.erreurs);

        if (labels.length === 0) {
          console.warn("Aucune donnée pour le graphique erreurs par script.");
          return;
        }

        initErreursScriptChart(labels, erreursCounts);
      })
      .catch(error => {
        console.error("Erreur récupération taux d'erreur par script:", error);
      });
  } else {
    console.warn("Canvas 'erreursScriptChart' introuvable dans le DOM.");
  }
  // fin
  // Debut
  // Début : variable globale pour conserver l'instance
  let projetErreurChartInstance = null;

  function initProjetErreurChart(data) {
    const ctx = document.getElementById('projetErreurChart').getContext('2d');

    if (projetErreurChartInstance) {
      projetErreurChartInstance.destroy();
    }

    // Si min et max identiques (un seul projet avec erreurs)
    let labels, valeurs, backgroundColors;

    if (!data.min || !data.max) {
      // Pas de données
      labels = [];
      valeurs = [];
      backgroundColors = [];
    } else if (data.min.id === data.max.id) {
      labels = [data.max.nom];
      valeurs = [data.max.valeur];
      backgroundColors = ['#3b82f6']; // Bleu
    } else {
      labels = [data.min.nom, data.max.nom];
      valeurs = [data.min.valeur, data.max.valeur];
      backgroundColors = ['#3b82f6', '#ef4444']; // Bleu et rouge
    }

    projetErreurChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: "Nombre d'erreurs",
          data: valeurs,
          backgroundColor: backgroundColors,
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { enabled: true },
          datalabels: {
            anchor: 'end',
            align: 'right',
            color: '#000',
            font: { weight: 'bold', size: 14 },
            formatter: value => value
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { precision: 0, color: '#374151' }
          },
          y: {
            ticks: { color: '#374151' }
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  const periodeSelect = document.getElementById('periodeSelect');

  function chargerProjetErreurChart() {
    const periode = periodeSelect.value;

    fetch(`/api/stats/repartition-projet-erreurs/?periode=${periode}`)
      .then(res => res.json())
      .then(data => {
        initProjetErreurChart(data);
      })
      .catch(err => console.error('Erreur fetch projet erreurs:', err));
  }

  periodeSelect.addEventListener('change', chargerProjetErreurChart);

  chargerProjetErreurChart();

  // Fin  

  // Fetch taux de réussite
  fetch(`/api/stats/taux-reussite${queryParam}`)
    .then(response => response.json())
    .then(data => {
      const taux = data.taux_reussite;
      const kpiDiv = document.getElementById("kpi-taux-reussite");
      const detailDiv = document.getElementById("kpi-detail-tests");
      const statusIndicator = document.getElementById("status-indicator");

      if (kpiDiv && statusIndicator) {
        kpiDiv.innerText = `${taux}%`;

        if (detailDiv) {
          detailDiv.innerText = `${data.succès} succès / ${data.total} tests`;
        }

        if (taux >= 90) {
          statusIndicator.innerText = " ";
          statusIndicator.className = "status-indicator excellent";
        } else if (taux >= 70) {
          statusIndicator.innerText = " ";
          statusIndicator.className = "status-indicator good";
        } else {
          statusIndicator.innerText = " ";
          statusIndicator.className = "status-indicator poor";
        }
      }
    })
    .catch(error => {
      console.error("Erreur lors du chargement du taux de réussite :", error);
    });

  // Fetch répartition par projet
  fetch(`/api/stats/repartition-projet${queryParam}`)
    .then(response => response.json())
    .then(data => {
      initProjetChart(data.projet_labels, data.projet_counts);
    })
    .catch(error => {
      console.error('Erreur récupération répartition par projet:', error);
    });

  // Fetch Succès vs Échec par jour
  fetch(`/api/stats/success-vs-failed-par-jour${queryParam}`)
    .then(response => response.json())
    .then(data => {
      const labels = data.map(item => item.date);
      const successData = data.map(item => item.succès || 0);
      const failData = data.map(item => item.échec || 0);
      initSFChart(labels, successData, failData);
    })
    .catch(error => console.error('Erreur récupération succès vs échec:', error));

  // Fetch taux d'erreur par script
  fetch(`/api/stats/taux-erreur-par-script${queryParam}`)
    .then(response => response.json())
    .then(data => {
      const labels = data.map(item => item.script);
      const erreursCounts = data.map(item => item.erreurs);
      initErreursScriptChart(labels, erreursCounts);
    })
    .catch(error => console.error('Erreur récupération taux d\'erreur par script:', error));

  
});


