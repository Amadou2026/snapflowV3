from django.contrib.admin import AdminSite

class SnapflowAdminSite(AdminSite):
    site_header = "Administration Snapflow"
    site_title = "Snapflow Admin"
    index_title = "Tableau de bord Snapflow"

    def get_app_list(self, request):
        app_dict = self._build_app_dict(request)

        # ✅ Ordre personnalisé des modèles (à ajuster selon ton besoin)
        model_order = [
            'Projet',
            'Axe',
            'SousAxe',
            'Email de notification',
            'Script',
            'Batterie de test',
            'Execution tests',
            'Résultats des scripts',
            'Dashboard',
            'Vue globale',
            'Utilisateurs',
            'Paramètres globaux',
        ]

        for app in app_dict.values():
            app['models'].sort(
                key=lambda x: model_order.index(x['object_name']) if x['object_name'] in model_order else 999
            )

        # Optionnel : ordre des applications (par nom)
        return sorted(app_dict.values(), key=lambda x: x['name'])
