
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *
from rest_framework_simplejwt.views import TokenRefreshView
from . import stats_views, views
from .views import api_user_permissions


router = DefaultRouter()
router.register(r"axes", AxeViewSet)
router.register(r"sous-axes", SousAxeViewSet)
router.register(r"scripts", ScriptViewSet)
router.register(r"projets", ProjetViewSet)
router.register(r"configuration-tests", ConfigurationTestViewSet)
router.register(r"executions", ExecutionTestViewSet)
router.register(r"groupes", GroupePersonnaliseViewSet, basename="groupepersonnalise")
router.register(
    r"email-notifications", views.EmailNotificationViewSet, basename="emailnotification"
)
router.register(
    r"parametres", views.ConfigurationViewSet, basename="configuration"
)  # Changé


urlpatterns = [
    path("", include(router.urls)),
    path(
        "execution-resultats/",
        views.ExecutionResultatList.as_view(),
        name="execution-resultats-list",
    ),
    path("users/", UserListCreateView.as_view(), name="user-list"),
    path("users/<int:pk>/", UserDetailView.as_view(), name="user-detail"),
    path(
        "users/<int:pk>/update-profile/",
        views.update_user_profile,
        name="update-user-profile",
    ),
    path("auth/change-password/", views.change_password, name="change-password"),
    # Admin chaange le mdp
    path(
        "users/<int:user_id>/admin-change-password/",
        views.admin_change_password,
        name="admin-change-password",
    ),
    path("user/profile/", UserProfileView.as_view(), name="user-profile"),
    path("token/", CustomTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path(
        "executions/<int:pk>/rapport-pdf/", RapportPDFView.as_view(), name="rapport_pdf"
    ),
    path("stats/tests-par-jour/", stats_views.tests_par_jour, name="tests_par_jour"),
    path(
        "stats/success-vs-failed-par-jour/",
        stats_views.success_vs_failed_par_jour,
        name="success_vs_failed_par_jour",
    ),
    path(
        "stats/tests-par-projet/", stats_views.tests_par_projet, name="tests-par-projet"
    ),
    path("stats/taux-reussite/", stats_views.taux_reussite, name="taux-reussite"),
    path(
        "stats/taux-erreur-par-script/",
        stats_views.taux_erreur_par_script,
        name="taux_erreur_par_script",
    ),
    path(
        "stats/repartition-projet/",
        stats_views.repartition_par_projet,
        name="repartition-projet",
    ),
    path(
        "stats/repartition-projet-erreurs/",
        stats_views.repartition_par_projet_erreurs,
        name="repartition-projet-erreurs",
    ),
    path("admin/dashboard/", dashboard_view, name="dashboard"),
    path(
        "stats/debug-filters/", stats_views.debug_filters, name="debug-filters"
    ),  # ✅ Ajout
    path(
        "stats/nombre-test-non-execute/",
        stats_views.nombre_test_non_execute,
        name="nombre-test-non-execute",
    ),
    path(
        "stats/scripts-tests/",
        ScriptsTestsStatsView.as_view(),
        name="scripts-tests-stats",
    ),
    path(
        "stats/scripts-en-attente/",
        stats_views.stats_scripts_en_attente,
        name="stats_scripts_en_attente",
    ),
    path(
        "stats/execution-resultats-concluant-nonconcluant/",
        stats_views.stats_execution_concluant_nonconcluant,
        name="stats_execution_concluant_nonconcluant",
    ),
    # path("stats/scripts-planifies/", stats_views.scripts_planifies, name="scripts_planifies"),
    path(
        "stats/scheduled/",
        views.ScheduledScriptsListView.as_view(),
        name="scheduled_list",
    ),
    path(
        "statsscheduled/<int:config_id>/",
        views.configuration_detail_scheduled,
        name="scheduled_detail",
    ),
    path(
        "stats/next-scripts/", views.api_next_scheduled_scripts, name="api_next_scripts"
    ),
    path(
        "stats/to-execute/", views.api_configurations_to_execute, name="api_to_execute"
    ),
    path("stats/overdue/", views.api_overdue_configurations, name="api_overdue"),
    path(
        "stats/execution-results/",
        views.execution_results_api,
        name="execution-results-api",
    ),
    path(
        "admin-menu/", views.api_admin_menu, name="api_admin_menu"
    ),  # Affiche le sidebar pareil que sur l'admin django
    path(
        "scripts-par-projet/", views.scripts_par_projet, name="scripts-par-projet"
    ),  # retourne les scripts par projet
    path(
        "user/permissions/", api_user_permissions, name="api_user_permissions"
    ),  # Gestion de permission
    path("permissions/", list_all_permissions, name="all-permissions"),
    # Société - URLs CRUD
    path("societe/", views.list_societes, name="list_societes"),
    path("societe/create/", views.create_societe, name="create_societe"),
    path("societe/<int:pk>/", views.detail_societe, name="detail_societe"),
    path("societe/<int:pk>/update/", views.update_societe, name="update_societe"),
    path("societe/<int:pk>/delete/", views.delete_societe, name="delete_societe"),
    # Secteur Activité
    path("secteurs/", SecteurActiviteListAPIView.as_view(), name="secteurs-list"),
    path(
        "secteurs/<int:pk>/",
        SecteurActiviteDetailAPIView.as_view(),
        name="secteurs-detail",
    ),
    
    #
    path(
        "stats/configurations-actives/",
        stats_views.configurations_actives,
        name="configurations-actives",
    ),
    path(
        "stats/configurations-statistiques/",
        stats_views.configurations_statistiques,
        name="configurations-statistiques",
    ),
    # projets
    path(
        "projets/<int:projet_id>/detail-complet/",
        views.ProjetDetailAPIView.as_view(),
        name="projet-detail-complet",
    ),
    # Routes supplémentaires pour les sous-sections
    path(
        "projets/<int:projet_id>/configurations/",
        views.ProjetViewSet.as_view({"get": "configurations"}),
        name="projet-configurations",
    ),
    path(
        "projets/<int:projet_id>/scripts/",
        views.ProjetViewSet.as_view({"get": "scripts"}),
        name="projet-scripts",
    ),
    path(
        "projets/<int:projet_id>/executions/",
        views.ProjetViewSet.as_view({"get": "executions"}),
        name="projet-executions",
    ),
    path(
        "projets/<int:projet_id>/statistiques/",
        views.ProjetViewSet.as_view({"get": "statistiques"}),
        name="projet-statistiques",
    ),
    path("projet-actif/", views.set_projet_actif, name="set-projet-actif"),
    path("projet-actif/get/", views.get_projet_actif, name="get-projet-actif"),
    # Script à probleme
    
    path('stats/scripts-problemes/', views.scripts_problemes, name='scripts-problemes'),
    # path('stats/detecter-scripts-problemes/', views.detecter_scripts_problemes, name='detecter-scripts-problemes'),
]
