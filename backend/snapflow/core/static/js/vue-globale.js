document.addEventListener("DOMContentLoaded", function () {
    // Récupération des scripts planifiés
    fetch("/api/stats/next-scripts/")
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById("scheduled-scripts");
            if (data.scheduled_scripts && data.scheduled_scripts.length > 0) {
                let html = `
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Script</th>
                                <th>Configuration</th>
                                <th>Exécution prévue</th>
                                <th>Dans</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                data.scheduled_scripts.forEach(script => {
                    html += `
                        <tr>
                            <td>${script.script_name}</td>
                            <td>${script.configuration_name}</td>
                            <td>${new Date(script.execution_time).toLocaleString()}</td>
                            <td>${Math.round(script.time_until_seconds / 60)} min</td>
                        </tr>
                    `;
                });
                html += `</tbody></table>`;
                container.innerHTML = html;
            } else {
                container.innerHTML = "<p>Aucun script planifié.</p>";
            }
        });

    // Récupération des configurations en retard
    fetch("/api/stats/overdue/")
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById("overdue-configurations");
            if (data.overdue_configurations && data.overdue_configurations.length > 0) {
                let html = `
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th>Configuration</th>
                                <th>Projet</th>
                                <th>Attendu</th>
                                <th>Retard</th>
                                <th>Scripts</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                data.overdue_configurations.forEach(item => {
                    html += `
                        <tr>
                            <td>${item.configuration_name}</td>
                            <td>${item.project_name}</td>
                            <td>${new Date(item.expected_time).toLocaleString()}</td>
                            <td>${Math.round(item.delay_seconds / 60)} min</td>
                            <td>${item.scripts_count}</td>
                        </tr>
                    `;
                });
                html += `</tbody></table>`;
                container.innerHTML = html;
            } else {
                container.innerHTML = "<p>Aucune configuration en retard</p>";
            }
        });
});

// Toggle affichage au clic sur l'en-tête
document.addEventListener("click", function(e) {
    if (e.target.closest(".log-header")) {
        const logItem = e.target.closest(".log-item");
        logItem.classList.toggle("active");
    }
});
