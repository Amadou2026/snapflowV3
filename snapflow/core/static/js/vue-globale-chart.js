// Fonction d'initialisation du graphique tests non exécutés + non concluants
function initTestsNonExecuteChart(labels, nonExecuteCounts, nonConcluantCounts) {


    const canvas = document.getElementById('testsNonExecuteChart');
    if (!canvas) {
        console.warn("⚠️ Canvas 'testsNonExecuteChart' introuvable.");
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.warn("⚠️ Contexte 2D non récupéré pour 'testsNonExecuteChart'.");
        return;
    }

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: "Tests non exécutés",
                    data: nonExecuteCounts,
                    backgroundColor: 'rgba(220, 38, 38, 0.7)', // rouge clair
                    borderColor: 'rgba(220, 38, 38, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: "Tests non concluants",
                    data: nonConcluantCounts,
                    backgroundColor: 'rgba(234, 179, 8, 0.7)', // jaune/orange
                    borderColor: 'rgba(234, 179, 8, 1)',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top' },
                tooltip: {
                    backgroundColor: '#1e293b',
                    titleColor: '#f1f5f9',
                    bodyColor: '#f1f5f9',
                    borderColor: '#334155',
                    borderWidth: 1,
                    cornerRadius: 8
                },
                datalabels: {
                    color: '#f1f5f9',
                    anchor: 'end',
                    align: 'top',
                    font: {
                        weight: '600',
                        size: 12
                    },
                    formatter: value => value > 0 ? value : ''
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#64748b' },
                    grid: { color: '#e2e8f0' }
                },
                x: {
                    ticks: { color: '#64748b', maxRotation: 45, minRotation: 45 },
                    grid: { display: false }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}

// Chargement du graphique après que le DOM est prêt
document.addEventListener("DOMContentLoaded", () => {
    const periodeSelect = document.getElementById("periode");

    // Fonction pour fetch et afficher le graphique tests non exécutés + non concluants
    function fetchAndRenderTestsNonExecute() {
        // Récupère la période sélectionnée
        const periode = periodeSelect.value || "jour";

        // Construire la query string avec période + projet si défini
        const params = new URLSearchParams({ periode });

        const projetSelect = document.getElementById("projet-select");
        const projetId = projetSelect ? projetSelect.value : "";
        if (projetId) params.append("projet_id", projetId);

        fetch(`/api/stats/nombre-test-non-execute/?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                if (!data.length) {
                    console.warn("Pas de données pour tests non exécutés + non concluants.");
                    initTestsNonExecuteChart([], [], []);
                    return;
                }
                const labels = data.map(item => item.date);
                const nonExecuteCounts = data.map(item => item.non_execute);
                const nonConcluantCounts = data.map(item => item.non_concluant);
                initTestsNonExecuteChart(labels, nonExecuteCounts, nonConcluantCounts);
            })
            .catch(err => console.error("Erreur fetch tests non exécutés:", err));
    }

    // Initialisation au chargement
    fetchAndRenderTestsNonExecute();

    // Recharger à chaque changement de filtre
    periodeSelect.addEventListener("change", fetchAndRenderTestsNonExecute);

    // Si tu as un filtre projet, tu peux aussi écouter le changement pour rafraîchir
    const projetSelect = document.getElementById("projet-select");
    if (projetSelect) {
        projetSelect.addEventListener("change", fetchAndRenderTestsNonExecute);
    }
});


// Initialise le graphique au chargement
// document.addEventListener("DOMContentLoaded", function () {
//   const dateForm = document.getElementById("date-filter-form");

//   if (dateForm) {
//     dateForm.addEventListener("submit", function (e) {
//       e.preventDefault();
//       const startDate = document.getElementById("start-date").value;
//       const endDate = document.getElementById("end-date").value;
//       fetchConcluantNonConcluantChart(startDate, endDate);
//     });
//   }

//   // Chargement initial sans filtre
//   fetchConcluantNonConcluantChart();
// });

document.addEventListener("DOMContentLoaded", function () {
  const ctx = document.getElementById("testsconcluantnonconcluant");

  const getChartData = async (start = "", end = "") => {
    let url = "/api/stats/execution-resultats-concluant-nonconcluant/";
    if (start && end) {
      url += `?start_date=${start}&end_date=${end}`;
    }

    const response = await fetch(url);
    const data = await response.json();

    const grouped = {};

    data.forEach(item => {
      const config = item.configuration || "Inconnu";
      if (!grouped[config]) {
        grouped[config] = { Concluant: 0, "Non concluant": 0, Autres: 0 };
      }

      if (item.statut === "Concluant") {
        grouped[config]["Concluant"]++;
      } else if (item.statut === "Non concluant") {
        grouped[config]["Non concluant"]++;
      } else {
        grouped[config]["Autres"]++;
      }
    });

    const labels = Object.keys(grouped);
    const dataConcluant = labels.map(label => grouped[label]["Concluant"]);
    const dataNonConcluant = labels.map(label => grouped[label]["Non concluant"]);

    return {
      labels,
      datasets: [
        {
          label: "Concluant",
          data: dataConcluant,
          backgroundColor: "rgba(11, 223, 89, 0.6)",
        },
        {
          label: "Non concluant",
          data: dataNonConcluant,
          backgroundColor: "rgba(255, 5, 5, 0.6)",
        },
      ],
    };
  };

  const createChart = async () => {
    const chartData = await getChartData();

    new Chart(ctx, {
      type: "bar",
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
          title: {
            display: true,
            text: "Scripts concluants / non concluants par batterie de test",
          },
        },
        scales: {
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 0,
              autoSkip: true,
            }
          }
        }
      },
    });
  };

  createChart();
});


