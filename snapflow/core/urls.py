from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import *
from rest_framework_simplejwt.views import TokenRefreshView
from . import stats_views

router = DefaultRouter()
router.register(r"axes", AxeViewSet)
router.register(r"sous-axes", SousAxeViewSet)
router.register(r"scripts", ScriptViewSet)
router.register(r"projets", ProjetViewSet)
router.register(r"configurations", ConfigurationTestViewSet)
router.register(r"executions", ExecutionTestViewSet)


urlpatterns = [
    path("", include(router.urls)),
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
        path('stats/scripts-tests/', ScriptsTestsStatsView.as_view(), name='scripts-tests-stats'),
        path("stats/scripts-en-attente/",  stats_views.stats_scripts_en_attente, name="stats_scripts_en_attente"),
        path("stats/execution-resultats-concluant-nonconcluant/", stats_views.stats_execution_concluant_nonconcluant, name="stats_execution_concluant_nonconcluant"),
        # path("stats/scripts-planifies/", stats_views.scripts_planifies, name="scripts_planifies"),
        


]
