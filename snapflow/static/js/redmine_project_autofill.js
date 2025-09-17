(function($) {
    $(document).ready(function() {
        // Lorsque la sélection change
        $('#id_redmine_project_selector').change(function() {
            var projectId = $(this).val();
            
            if (projectId) {
                // Afficher un indicateur de chargement
                $('#id_nom').val('Chargement...');
                $('#id_id_redmine').val('Chargement...');
                $('#id_redmine_slug').val('Chargement...');
                
                // Appel AJAX pour récupérer les données du projet
                $.ajax({
                    url: '/admin/core/projet/get-redmine-project/' + projectId + '/',
                    type: 'GET',
                    success: function(data) {
                        // Remplir automatiquement les champs
                        $('#id_nom').val(data.name);
                        $('#id_id_redmine').val(data.project_id);
                        $('#id_redmine_slug').val(data.identifier);
                        
                        // Message de confirmation
                        showMessage('Projet Redmine chargé avec succès !', 'success');
                    },
                    error: function() {
                        // Message d'erreur
                        showMessage('Erreur lors du chargement du projet', 'error');
                        $('#id_nom').val('');
                        $('#id_id_redmine').val('');
                        $('#id_redmine_slug').val('');
                    }
                });
            } else {
                // Effacer les champs si aucun projet sélectionné
                $('#id_nom').val('');
                $('#id_id_redmine').val('');
                $('#id_redmine_slug').val('');
            }
        });
        
        function showMessage(message, type) {
            // Créer un message temporaire
            var cssClass = type === 'success' ? 'message-success' : 'message-error';
            var messageDiv = $('<div>')
                .addClass('redmine-message ' + cssClass)
                .text(message)
                .css({
                    'position': 'fixed',
                    'top': '20px',
                    'right': '20px',
                    'padding': '10px 15px',
                    'border-radius': '4px',
                    'z-index': '10000',
                    'color': 'white',
                    'font-weight': 'bold'
                });
            
            if (type === 'success') {
                messageDiv.css('background', '#28a745');
            } else {
                messageDiv.css('background', '#dc3545');
            }
            
            $('body').append(messageDiv);
            
            // Supprimer le message après 3 secondes
            setTimeout(function() {
                messageDiv.fadeOut(function() {
                    $(this).remove();
                });
            }, 3000);
        }
    });
})(django.jQuery);