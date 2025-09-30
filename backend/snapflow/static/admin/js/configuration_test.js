document.addEventListener('DOMContentLoaded', function() {
    const projetSelect = document.getElementById('id_projet');
    const scriptsAvailable = document.querySelector('#id_scripts_from'); // liste disponible

    if (!projetSelect || !scriptsAvailable) return;

    function updateScripts(projetId) {
        fetch(`/admin/scripts-by-projet/?projet_id=${projetId}`)
            .then(response => response.json())
            .then(data => {
                // Vider la liste "available"
                scriptsAvailable.innerHTML = '';

                // Ajouter les options filtrées
                data.forEach(script => {
                    const option = document.createElement('option');
                    option.value = script.id;
                    option.text = script.label;
                    scriptsAvailable.add(option);
                });
            });
    }

    projetSelect.addEventListener('change', function() {
        const projetId = this.value;
        if (projetId) {
            updateScripts(projetId);
        } else {
            scriptsAvailable.innerHTML = ''; // aucun projet sélectionné
        }
    });

    // Si un projet est déjà sélectionné (édition), déclencher le change
    if (projetSelect.value) {
        projetSelect.dispatchEvent(new Event('change'));
    }
});
