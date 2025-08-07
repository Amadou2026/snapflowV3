from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import *
from .serializers import *

from django.db.models.functions import TruncDate
from django.db.models import Count, Q
from django.shortcuts import render
from core.models import Projet, ExecutionTest

from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.http import FileResponse, Http404
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from io import BytesIO
from .models import ExecutionTest

from rest_framework.decorators import action
from rest_framework import status

CustomUser = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Ajoute les infos personnalisées au token
        token["email"] = user.email
        token["first_name"] = user.first_name
        token["last_name"] = user.last_name
        return token


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class AxeViewSet(viewsets.ModelViewSet):
    queryset = Axe.objects.all()
    serializer_class = AxeSerializer
    permission_classes = [IsAuthenticated]


class SousAxeViewSet(viewsets.ModelViewSet):
    queryset = SousAxe.objects.all()
    serializer_class = SousAxeSerializer
    permission_classes = [IsAuthenticated]


class ScriptViewSet(viewsets.ModelViewSet):
    queryset = Script.objects.all()
    serializer_class = ScriptSerializer
    permission_classes = [IsAuthenticated]


class ProjetViewSet(viewsets.ModelViewSet):
    queryset = Projet.objects.all()
    serializer_class = ProjetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            queryset = Projet.objects.all()
        else:
            queryset = Projet.objects.filter(charge_de_compte=user)

        projet_id = self.request.GET.get("projet_id")
        if projet_id:
            queryset = queryset.filter(id=projet_id)

        return queryset


class ConfigurationTestViewSet(viewsets.ModelViewSet):
    queryset = ConfigurationTest.objects.all()
    serializer_class = ConfigurationTestSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=["post"], url_path="activate")
    def activate(self, request, pk=None):
        config = self.get_object()
        config.is_active = True
        config.save()
        return Response({"status": "activated"}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="deactivate")
    def deactivate(self, request, pk=None):
        config = self.get_object()
        config.is_active = False
        config.save()
        return Response({"status": "deactivated"}, status=status.HTTP_200_OK)


# class ExecutionTestViewSet(viewsets.ModelViewSet):
#     queryset = ExecutionTest.objects.all()
#     serializer_class = ExecutionTestSerializer
#     permission_classes = [IsAuthenticated]
class ExecutionTestViewSet(viewsets.ModelViewSet):
    queryset = ExecutionTest.objects.all()
    serializer_class = ExecutionTestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return ExecutionTest.objects.filter(
            configuration__projet__charge_de_compte=user
        )


class RapportPDFView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            execution = ExecutionTest.objects.get(pk=pk)
        except ExecutionTest.DoesNotExist:
            raise Http404("Rapport non trouvé")

        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        p.setFont("Helvetica", 12)
        p.drawString(
            30, height - 30, f"Rapport d'exécution: {execution.configuration.nom}"
        )
        p.drawString(30, height - 50, f"Statut: {execution.statut}")
        p.drawString(30, height - 70, f"Début: {execution.started_at}")
        p.drawString(30, height - 90, f"Fin: {execution.ended_at}")

        y = height - 130
        rapport_lines = execution.rapport.split("\n")
        for line in rapport_lines:
            if y < 40:
                p.showPage()
                y = height - 40
                p.setFont("Helvetica", 10)
            p.drawString(30, y, line[:110])  # tronque au besoin
            y -= 15

        p.save()
        buffer.seek(0)
        return FileResponse(
            buffer, as_attachment=True, filename=f"rapport_{execution.id}.pdf"
        )


# Debut
# core/views.py - Version avec debug complet

from datetime import datetime, timedelta
from django.shortcuts import render
from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from core.models import Projet, ExecutionTest

from datetime import datetime, timedelta
from django.shortcuts import render
from core.models import Projet, ExecutionTest

def dashboard_view(request):
    print("=" * 50)
    print("🚨 DASHBOARD_VIEW APPELÉE - DÉBUT")
    print(f"🔍 URL complète: {request.get_full_path()}")
    print(f"🔍 Méthode HTTP: {request.method}")
    print(f"🔍 Paramètres GET RAW: {request.GET}")
    print(f"🔍 Paramètres GET dict: {dict(request.GET)}")
    
    # Récupération des paramètres avec debug détaillé
    projet_id = request.GET.get("projet_id")
    periode = request.GET.get("periode", "mois")
    selected_periode = periode if periode in ["jour", "semaine", "mois", "annee"] else "mois"
    
    print(f"🔍 projet_id récupéré: '{projet_id}' (type: {type(projet_id)})")
    print(f"🔍 periode récupérée: '{selected_periode}' (type: {type(selected_periode)})")
    
    # Vérification des valeurs vides ou None
    if not selected_periode or selected_periode.strip() == "":
        selected_periode = "mois"
        print(f"⚠️ Période vide, fallback vers: '{selected_periode}'")
    
    if not projet_id or projet_id.strip() == "":
        projet_id = None
        print(f"⚠️ Projet ID vide, fallback vers: {projet_id}")
    
    print(f"🔧 Valeurs finales: projet_id='{projet_id}', periode='{selected_periode}'")
    
    # Initialiser toutes les variables
    labels = []
    values = []
    sf_labels = []
    sf_success = []
    sf_fail = []
    projet_labels = []
    projet_counts = []
    erreurs_labels = []
    erreurs_counts = []
    total_tests = 0
    total_success = 0
    taux_reussite = 0
    projets_resumes = []

    # Gestion des projets utilisateur
    projets = Projet.objects.all()
    if request.user.is_superuser:
        projets_utilisateur = projets
    else:
        projets_utilisateur = projets.filter(charge_de_compte=request.user)

    print(f"🔍 Projets utilisateur: {projets_utilisateur.count()}")

    # Gestion du projet sélectionné
    selected_projet_id = projet_id if projet_id else ""
    projet_selectionne = None

    if projet_id:
        try:
            projet_id_int = int(projet_id)
            if projets_utilisateur.filter(id=projet_id_int).exists():
                projet_selectionne = projets_utilisateur.get(id=projet_id_int)
                print(f"✅ Projet sélectionné: {projet_selectionne.nom}")
            else:
                print("❌ Accès refusé à ce projet")
        except (Projet.DoesNotExist, ValueError) as e:
            projet_selectionne = None
            print(f"❌ Erreur projet: {e}")

    # Filtrage de base
    if projet_selectionne:
        execution_tests = ExecutionTest.objects.filter(configuration__projet=projet_selectionne)
        print(f"🔍 Tests pour projet {projet_selectionne.nom}: {execution_tests.count()}")
    else:
        execution_tests = ExecutionTest.objects.filter(configuration__projet__in=projets_utilisateur)
        print(f"🔍 Tests pour tous les projets: {execution_tests.count()}")

    # Application du filtre temporel avec debug détaillé
    aujourd_hui = datetime.now()

    if selected_periode == "jour":
        date_debut = aujourd_hui.replace(hour=0, minute=0, second=0, microsecond=0)
        print(f"✅ Filtre JOUR - depuis: {date_debut}")
    elif selected_periode == "semaine":
        date_debut = aujourd_hui - timedelta(days=7)
        print(f"✅ Filtre SEMAINE - depuis: {date_debut}")
    elif selected_periode == "mois":
        date_debut = aujourd_hui - timedelta(days=30)
        print(f"✅ Filtre MOIS - depuis: {date_debut}")
    elif selected_periode == "annee":
        date_debut = aujourd_hui - timedelta(days=365)
        print(f"✅ Filtre ANNÉE - depuis: {date_debut}")
    else:
        date_debut = aujourd_hui - timedelta(days=30)
        print(f"❌ Période inconnue '{selected_periode}', défaut MOIS - depuis: {date_debut}")

    # Application du filtre et comptage
    execution_tests_avant_filtre = execution_tests.count()
    execution_tests_filtrees = execution_tests.filter(started_at__gte=date_debut)
    execution_tests_apres_filtre = execution_tests_filtrees.count()

    if execution_tests_filtrees.exists():
        total_tests = execution_tests_filtrees.count()
        total_success = execution_tests_filtrees.filter(
            statut__in=["done", "succès", "success"]
        ).count()
        taux_reussite = round((total_success / total_tests) * 100, 2) if total_tests > 0 else 0
    else:
        total_tests = 0
        total_success = 0
        taux_reussite = 0

    # Calcul des scripts non exécutés
    total_scripts = execution_tests_filtrees.values('configuration__script').distinct().count()
    # print(f"🔍 Total scripts concernés (distincts): {total_scripts}")
    scripts_executed = execution_tests_filtrees.filter(
        statut__in=['done', 'succès', 'success']
    ).values('configuration__script').distinct().count()
    scripts_non_executes = total_scripts - scripts_executed
    percent_scripts_non_executes = round((scripts_non_executes / total_scripts * 100), 1) if total_scripts else 0
    print(f"🔍 Scripts non exécutés: {scripts_non_executes} ({percent_scripts_non_executes}%)")

    # Comptage des tests en échec (statut 'error')
    tests_en_echec = execution_tests_filtrees.filter(statut='error').count()
    percent_tests_echec = round((tests_en_echec / total_tests * 100), 1) if total_tests else 0
    # print(f"🔍 Tests en échec: {tests_en_echec} ({percent_tests_echec}%)")

    # Résumé par projet
    for p in projets_utilisateur:
        executions = execution_tests_filtrees.filter(configuration__projet=p)
        total = executions.count()
        fonctionnels = executions.filter(statut__in=["done", "succès", "success"]).count()
        non_fonctionnels = total - fonctionnels
        projets_resumes.append({
            "id": p.id,
            "nom": p.nom,
            "total": total,
            "fonctionnels": fonctionnels,
            "non_fonctionnels": non_fonctionnels,
        })

    # Contexte final
    context = {
        "labels": labels,
        "values": values,
        "sf_labels": sf_labels,
        "sf_success": sf_success,
        "sf_fail": sf_fail,
        "projet_labels": projet_labels,
        "projet_counts": projet_counts,
        "taux_reussite": taux_reussite,
        "erreurs_labels": erreurs_labels,
        "erreurs_counts": erreurs_counts,
        "total_tests": total_tests,
        "projets": projets_utilisateur,
        "selected_projet_id": selected_projet_id,
        "selected_periode": selected_periode,
        "non_fonctionnels": total_tests - total_success,
        "projets_resumes": projets_resumes,
        'scripts_non_executes': scripts_non_executes,
        'percent_scripts_non_executes': percent_scripts_non_executes,
        'tests_en_echec': tests_en_echec,
        'percent_tests_echec': percent_tests_echec,
        
        # Debug info pour le template
        "debug_info": {
            "url_complete": request.get_full_path(),
            "get_params": dict(request.GET),
            "tests_avant_filtre": execution_tests_avant_filtre,
            "tests_apres_filtre": execution_tests_apres_filtre,
            "date_debut": date_debut,
        }
    }
 
    return render(request, "admin/dashboard.html", context)

# core/views.py (ou dans views.py)

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from datetime import datetime, timedelta
from core.models import Projet, ExecutionTest, Script

class ScriptsTestsStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        projet_id = request.GET.get("projet_id")
        periode = request.GET.get("periode", "mois")
        user = request.user

        # Gestion des projets accessibles par l'utilisateur
        if user.is_superuser:
            projets = Projet.objects.all()
        else:
            projets = Projet.objects.filter(charge_de_compte=user)

        # Filtrer par projet si demandé
        if projet_id:
            projets = projets.filter(id=projet_id)

        # Calcul de la date de début selon la période choisie
        aujourd_hui = datetime.now()
        if periode == "jour":
            date_debut = aujourd_hui.replace(hour=0, minute=0, second=0, microsecond=0)
        elif periode == "semaine":
            date_debut = aujourd_hui - timedelta(days=7)
        elif periode == "mois":
            date_debut = aujourd_hui - timedelta(days=30)
        elif periode == "annee":
            date_debut = aujourd_hui - timedelta(days=365)
        else:
            date_debut = aujourd_hui - timedelta(days=30)

        # Récupération des tests filtrés par projets et date
        tests = ExecutionTest.objects.filter(configuration__projet__in=projets, started_at__gte=date_debut)

        test_ids = tests.values_list('id', flat=True)

        # Comptage des scripts distincts liés aux tests
        total_scripts = Script.objects.filter(configurationtest__executiontest__in=test_ids).distinct().count()

        # Scripts exécutés avec succès
        tests_success = tests.filter(statut__in=['done', 'succès', 'success'])
        success_test_ids = tests_success.values_list('id', flat=True)
        scripts_executed = Script.objects.filter(configurationtest__executiontest__in=success_test_ids).distinct().count()

        scripts_non_executes = total_scripts - scripts_executed
        percent_scripts_non_executes = round((scripts_non_executes / total_scripts * 100), 1) if total_scripts else 0

        total_tests = tests.count()
        tests_en_echec = tests.filter(statut='error').count()
        percent_tests_echec = round((tests_en_echec / total_tests * 100), 1) if total_tests else 0

        data = {
            "scripts_non_executes": scripts_non_executes,
            "percent_scripts_non_executes": percent_scripts_non_executes,
            "tests_en_echec": tests_en_echec,
            "percent_tests_echec": percent_tests_echec,
            "total_scripts": total_scripts,
            "total_tests": total_tests,
        }

        return Response(data)

from django.contrib.admin.views.decorators import staff_member_required
from django.shortcuts import render
from .models import ExecutionResult

@staff_member_required
def execution_resultats_view(request):
    resultats = ExecutionResult.objects.select_related('execution', 'script', 'execution__configuration').order_by('-execution__started_at')
    return render(request, 'admin/execution_resultats.html', {'resultats': resultats})
