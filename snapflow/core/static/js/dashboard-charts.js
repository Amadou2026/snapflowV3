// dashboard-charts.js

// Configuration globale des graphiques
Chart.defaults.font.family = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
Chart.defaults.color = '#64748b';
Chart.defaults.borderColor = '#e2e8f0';

// Couleurs modernes
const colors = {
  primary: '#3b82f6',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  purple: '#8b5cf6',
  pink: '#ec4899',
  indigo: '#6366f1',
  teal: '#14b8a6'
};

// Fonction dédiée pour initialiser le graphique tests par jour
function initTestsChart(labels, values) {
  const ctx = document.getElementById('testsChart').getContext('2d');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Tests exécutés',
        data: values,
        backgroundColor: colors.primary + '20',
        borderColor: colors.primary,
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: colors.primary,
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8
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
            title: (context) => 'Date: ' + context[0].label,
            label: (context) => context.parsed.y + ' tests exécutés'
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
    }
  });
}

// Fonction pour initialiser le doughnut chart répartition par projet
function initProjetChart(labels, counts) {
  const ctx = document.getElementById('projetChart').getContext('2d');

  new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        label: 'Tests',
        data: counts,
        backgroundColor: [
          colors.primary,
          colors.success,
          colors.warning,
          colors.purple,
          colors.pink,
          colors.indigo,
          colors.teal
        ],
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

// Chargement des données et initialisation des graphiques + KPI
document.addEventListener('DOMContentLoaded', () => {
  // Fetch tests par jour
  fetch('/api/stats/tests-par-jour/')
    .then(response => response.json())
    .then(testsParJourData => {
      const labels = testsParJourData.map(entry => entry.date);
      const values = testsParJourData.map(entry => entry.total);

      // Initialiser le graphique tests par jour
      initTestsChart(labels, values);

      // Mettre à jour le total des tests dans la KPI si existant
      const totalTestsElem = document.getElementById('total-tests');
      if (totalTestsElem) {
        const totalTests = values.reduce((acc, val) => acc + val, 0);
        totalTestsElem.textContent = totalTests.toLocaleString();
      }
    })
    .catch(error => {
      console.error('Erreur récupération tests par jour:', error);
    });

  // Fetch taux de réussite
  fetch('/api/stats/taux-reussite/')
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
          statusIndicator.innerText = "● Excellent";
          statusIndicator.className = "status-indicator excellent";
        } else if (taux >= 70) {
          statusIndicator.innerText = "● Bon";
          statusIndicator.className = "status-indicator good";
        } else {
          statusIndicator.innerText = "● À améliorer";
          statusIndicator.className = "status-indicator poor";
        }
      }
    })
    .catch(error => {
      console.error("Erreur lors du chargement du taux de réussite :", error);
    });

  // Fetch répartition par projet
  fetch('/api/stats/repartition-projet/')
    .then(response => response.json())
    .then(data => {
      initProjetChart(data.projet_labels, data.projet_counts);
    })
    .catch(error => {
      console.error('Erreur récupération répartition par projet:', error);
    });
});

// SUccess Echecs
// Fonction pour initialiser le graphique Succès vs Échec par jour
function initSFChart(labels, successData, failData) {
  const ctx = document.getElementById('sfChart').getContext('2d');

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Succès',
          data: successData,
          borderColor: colors.success,
          backgroundColor: colors.success + '20',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: colors.success,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        },
        {
          label: 'Échecs',
          data: failData,
          borderColor: colors.error,
          backgroundColor: colors.error + '20',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: colors.error,
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
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
            pointStyle: 'circle',
            padding: 20,
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
          mode: 'index',
          intersect: false
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
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      }
    }
  });
}
// Fetch Succès vs Échec par jour
fetch('/api/stats/success-vs-failed-par-jour/')
  .then(response => response.json())
  .then(data => {
    const labels = data.map(item => item.date);
    const successData = data.map(item => item.succès || 0);
    const failData = data.map(item => item.échec || 0);

    initSFChart(labels, successData, failData);
  })
  .catch(error => console.error('Erreur récupération succès vs échec:', error));

// Fetch Succès vs Échec par jour
function initErreursScriptChart(labels, erreursCounts) {
  const ctx = document.getElementById('erreursScriptChart').getContext('2d');

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: "Nombre d'erreurs",
        data: erreursCounts,
        backgroundColor: colors.error + 'cc', // couleur rouge transparent
        borderColor: colors.error,
        borderWidth: 1,
        borderRadius: 4,
        maxBarThickness: 40
      }]
    },
    options: {
      responsive: true,
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
            label: context => `${context.parsed.y} erreurs`
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
fetch('/api/stats/taux-erreur-par-script/')
  .then(response => response.json())
  .then(data => {
    const labels = data.map(item => item.script);
    const erreursCounts = data.map(item => item.erreurs);

    initErreursScriptChart(labels, erreursCounts);
  })
  .catch(error => console.error('Erreur récupération taux d\'erreur par script:', error));

