// Fonction d'initialisation du graphique tests non exécutés + non concluants
function initTestsNonExecuteChart(labels, nonExecuteCounts, nonConcluantCounts) {
    console.log("📊 Initialisation du graphique Tests non exécutés + non concluants");
    console.log("📅 Labels :", labels);
    console.log("❌ Non exécutés :", nonExecuteCounts);
    console.log("⚠️ Non concluants :", nonConcluantCounts);

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
