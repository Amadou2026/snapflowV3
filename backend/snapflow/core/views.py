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

from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes

from django.shortcuts import render, redirect
from django.contrib import messages
from django.views.decorators.http import require_POST

from rest_framework.decorators import action
from django.utils.decorators import method_decorator

from django.contrib import admin
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required

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
        # Récupération des paramètres avec debug détaillé
    projet_id = request.GET.get("projet_id")
    periode = request.GET.get("periode", "mois")
    selected_periode = periode if periode in ["jour", "semaine", "mois", "annee"] else "mois"
       
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
    taux_echec = 0
    projets_resumes = []

    # Gestion des projets utilisateur
    projets = Projet.objects.all()
    if request.user.is_superuser:
        projets_utilisateur = projets
    else:
        projets_utilisateur = projets.filter(charge_de_compte=request.user)

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
        tests_en_echec = execution_tests_filtrees.filter(statut="error").count()

        taux_reussite = round((total_success / total_tests) * 100, 2) if total_tests > 0 else 0
        taux_echec = round((tests_en_echec / total_tests) * 100, 2) if total_tests > 0 else 0
    else:
        total_tests = 0
        total_success = 0
        tests_en_echec = 0
        taux_reussite = 0
        taux_echec = 0

    # Calcul des scripts non exécutés
    total_scripts = execution_tests_filtrees.values('configuration__script').distinct().count()
    scripts_executed = execution_tests_filtrees.filter(
        statut__in=['done', 'succès', 'success']
    ).values('configuration__script').distinct().count()
    scripts_non_executes = total_scripts - scripts_executed
    percent_scripts_non_executes = round((scripts_non_executes / total_scripts * 100), 1) if total_scripts else 0
    print(f"🔍 Scripts non exécutés: {scripts_non_executes} ({percent_scripts_non_executes}%)")

    # Comptage des tests en échec déjà calculé
    percent_tests_echec = round((tests_en_echec / total_tests * 100), 1) if total_tests else 0

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
        "taux_echec": taux_echec,  
        "erreurs_labels": erreurs_labels,
        "erreurs_counts": erreurs_counts,
        "total_tests": total_tests,
        "projets": projets_utilisateur,
        "selected_projet_id": selected_projet_id,
        "selected_periode": selected_periode,
        "non_fonctionnels": total_tests - total_success,
        "projets_resumes": projets_resumes,
        "scripts_non_executes": scripts_non_executes,
        "percent_scripts_non_executes": percent_scripts_non_executes,
        "tests_en_echec": tests_en_echec,
        "percent_tests_echec": percent_tests_echec,

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


# core/views.py Les tests échoués

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


# views.py
from datetime import timedelta
from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from django.views.decorators.http import require_http_methods
from django.views.generic import ListView
from django.utils import timezone
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from .models import ConfigurationTest, Projet, Script


# ========== VUES API (JSON) ==========

@require_http_methods(["GET"])
def api_next_scheduled_scripts(request):
    """API pour obtenir les prochains scripts planifiés"""
    hours_ahead = int(request.GET.get('hours', 24))
    project_id = request.GET.get('project_id')
    
    if project_id:
        try:
            data = get_next_scripts_for_project(int(project_id), hours_ahead)
            scripts_data = [{
                'script_id': item['script'].id,
                'script_name': getattr(item['script'], 'nom', str(item['script'])),
                'configuration_id': item['configuration'].id,
                'configuration_name': item['configuration'].nom,
                'execution_time': item['execution_time'].isoformat(),
                'time_until_seconds': int(item['time_until'].total_seconds())
            } for item in data]
        except ValueError:
            return JsonResponse({'error': 'Invalid project_id'}, status=400)
    else:
        scheduled = ConfigurationTest.get_next_scheduled_configurations(hours_ahead)
        scripts_data = []
        for item in scheduled:
            for script in item['scripts']:
                scripts_data.append({
                    'script_id': script.id,
                    'script_name': getattr(script, 'nom', str(script)),
                    'configuration_id': item['configuration'].id,
                    'configuration_name': item['configuration'].nom,
                    'execution_time': item['next_execution'].isoformat(),
                    'time_until_seconds': int(item['time_until_execution'].total_seconds())
                })
    
    return JsonResponse({
        'scheduled_scripts': scripts_data,
        'total_count': len(scripts_data),
        'hours_ahead': hours_ahead
    })


@require_http_methods(["GET"])
def api_configurations_to_execute(request):
    """API pour obtenir les configurations à exécuter maintenant"""
    configurations = ConfigurationTest.get_configurations_to_execute()
    
    data = [{
        'configuration_id': config.id,
        'configuration_name': config.nom,
        'project_name': config.projet.nom if hasattr(config.projet, 'nom') else str(config.projet),
        'scripts': [{
            'id': script.id,
            'name': getattr(script, 'nom', str(script))
        } for script in config.scripts.all()],
        'periodicite': config.get_periodicite_display(),
        'last_execution': config.last_execution.isoformat() if config.last_execution else None
    } for config in configurations]
    
    return JsonResponse({
        'configurations_to_execute': data,
        'total_count': len(data)
    })


@require_http_methods(["GET"])
def api_overdue_configurations(request):
    """API pour obtenir les configurations en retard"""
    overdue = ConfigurationTest.get_overdue_configurations()
    
    data = [{
        'configuration_id': item['configuration'].id,
        'configuration_name': item['configuration'].nom,
        'project_name': item['configuration'].projet.nom if hasattr(item['configuration'].projet, 'nom') else str(item['configuration'].projet),
        'expected_time': item['expected_time'].isoformat(),
        'delay_seconds': int(item['delay'].total_seconds()),
        'scripts_count': len(item['scripts'])
    } for item in overdue]
    
    return JsonResponse({
        'overdue_configurations': data,
        'total_count': len(data)
    })


# ========== VUES HTML ==========

@login_required
def dashboard_scheduled_scripts(request):
    """Tableau de bord des scripts planifiés"""
    hours_ahead = int(request.GET.get('hours', 24))
    
    context = {
        'dashboard_data': get_dashboard_data(),
        'hours_ahead': hours_ahead,
        'next_scheduled': ConfigurationTest.get_next_scheduled_configurations(hours_ahead),
        'projects': Projet.objects.all(),
        'active_configurations_count': ConfigurationTest.objects.filter(is_active=True).count(),
    }
    
    return render(request, 'configurations/dashboard.html', context)


@method_decorator(login_required, name='dispatch')
class ScheduledScriptsListView(ListView):
    """Vue liste des scripts planifiés"""
    model = ConfigurationTest
    template_name = 'configurations/scheduled_list.html'
    context_object_name = 'configurations'
    paginate_by = 20
    
    def get_queryset(self):
        queryset = ConfigurationTest.objects.filter(is_active=True).select_related('projet')
        
        project_id = self.request.GET.get('project')
        if project_id:
            queryset = queryset.filter(projet_id=project_id)
            
        return queryset.order_by('nom')
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['projects'] = Projet.objects.all()
        context['selected_project'] = self.request.GET.get('project', '')
        
        # Ajouter les prochaines exécutions pour chaque configuration
        for config in context['configurations']:
            config.next_execution = config.get_next_execution_time()
            config.is_overdue = False
            if config.last_execution:
                expected_next = config.last_execution + config.get_periodicite_timedelta()
                config.is_overdue = timezone.now() > expected_next
        
        return context


@login_required
def configuration_detail_scheduled(request, config_id):
    """Détail d'une configuration avec ses scripts planifiés"""
    configuration = get_object_or_404(ConfigurationTest, id=config_id)
    
    context = {
        'configuration': configuration,
        'next_execution': configuration.get_next_execution_time(),
        'is_due': configuration.is_due_for_execution(),
        'scripts': configuration.scripts.all(),
        'periodicite_display': configuration.get_periodicite_display(),
    }
    
    # Calculer si en retard
    if configuration.last_execution:
        expected_next = configuration.last_execution + configuration.get_periodicite_timedelta()
        if timezone.now() > expected_next:
            context['is_overdue'] = True
            context['delay'] = timezone.now() - expected_next
    
    return render(request, 'configurations/detail_scheduled.html', context)


# ========== FONCTIONS UTILITAIRES ==========

def get_dashboard_data():
    """Fonction utilitaire pour récupérer les données du tableau de bord"""
    return {
        'configurations_to_execute_now': ConfigurationTest.get_configurations_to_execute(),
        'next_24h_schedule': ConfigurationTest.get_next_scheduled_configurations(24),
        'overdue_configurations': ConfigurationTest.get_overdue_configurations(),
        'active_configurations_count': ConfigurationTest.objects.filter(is_active=True).count(),
    }


def get_next_scripts_for_project(project_id, hours_ahead=24):
    """Obtenir les prochains scripts pour un projet spécifique"""
    configurations = ConfigurationTest.objects.filter(
        projet_id=project_id, 
        is_active=True
    ).prefetch_related('scripts')
    
    next_scripts = []
    now = timezone.now()
    limit_time = now + timedelta(hours=hours_ahead)
    
    for config in configurations:
        next_time = config.get_next_execution_time()
        if next_time and now <= next_time <= limit_time:
            for script in config.scripts.all():
                next_scripts.append({
                    'script': script,
                    'configuration': config,
                    'execution_time': next_time,
                    'time_until': next_time - now
                })
    
    # Trier par heure d'exécution
    next_scripts.sort(key=lambda x: x['execution_time'])
    return next_scripts


#  Vue page d'accueille
# core/views.py
from django.shortcuts import render
from django.views.generic import TemplateView

class HomeView(TemplateView):
    template_name = 'home/index.html'

def home_view(request):
    return render(request, 'home/index.html')

# JS Script Dynamique
from django.http import JsonResponse
from django.contrib.admin.views.decorators import staff_member_required
from .models import Script

@staff_member_required
def scripts_by_projet(request):
    projet_id = request.GET.get('projet_id')
    if projet_id:
        scripts = Script.objects.filter(projet_id=projet_id).values('id', 'nom', 'axe__nom', 'sous_axe__nom')
        data = [
            {
                'id': s['id'],
                'label': f"{s['axe__nom'] or '-'} / {s['sous_axe__nom'] or '-'} / {s['nom']}"
            } for s in scripts
        ]
    else:
        data = []
    return JsonResponse(data, safe=False)


@require_POST
def sync_redmine_projects(request):
    try:
        config = Configuration.objects.first()
        if not config:
            messages.error(request, "Configuration non trouvée")
            return redirect('admin:index')
        
        success, message = config.sync_redmine_projects()
        
        if success:
            messages.success(request, message)
        else:
            messages.error(request, message)
            
    except Exception as e:
        messages.error(request, f"Erreur: {e}")
    
    return redirect('admin:core_configuration_changelist')



# Voir les logs

from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import JsonResponse
from .models import ExecutionResult
import os

@api_view(['GET'])
def execution_results_api(request):
    # Récupérer les 20 derniers résultats d'exécution
    results = ExecutionResult.objects.select_related(
        'script', 
        'execution', 
        'execution__configuration'
    ).order_by('-execution__started_at')[:20]
    
    data = []
    for result in results:
        # Lire le contenu du fichier log s'il existe
        log_contenu = ""
        if result.log_fichier and os.path.exists(result.log_fichier.path):
            try:
                with open(result.log_fichier.path, 'r', encoding='utf-8') as f:
                    log_contenu = f.read()
            except:
                log_contenu = "Impossible de lire le fichier log"
        
        execution_date = None
        if result.execution:
            execution_date = result.execution.started_at or result.execution.ended_at

        data.append({
            'script_nom': result.script.nom if result.script else 'Script inconnu',
            'configuration_nom': (
                result.execution.configuration.nom 
                if result.execution and result.execution.configuration 
                else 'Configuration inconnue'
            ),
            'statut': result.statut,
            'log_contenu': log_contenu,
            'commentaire': result.commentaire,
            'date_execution': (
                execution_date.strftime('%Y-%m-%d %H:%M') 
                if execution_date else 'Date inconnue'
            )
        })
    
    return Response(data)


# Vue de secours si vous n'utilisez pas DRF
def execution_results_json(request):
    results = ExecutionResult.objects.select_related(
        'script', 
        'execution', 
        'execution__configuration'
    ).order_by('-execution__started_at')[:20]
    
    data = []
    for result in results:
        log_contenu = ""
        if result.log_fichier and os.path.exists(result.log_fichier.path):
            try:
                with open(result.log_fichier.path, 'r', encoding='utf-8') as f:
                    log_contenu = f.read()
            except:
                log_contenu = "Impossible de lire le fichier log"
        
        execution_date = None
        if result.execution:
            execution_date = result.execution.started_at or result.execution.ended_at

        data.append({
            'script_nom': result.script.nom if result.script else 'Script inconnu',
            'configuration_nom': (
                result.execution.configuration.nom 
                if result.execution and result.execution.configuration 
                else 'Configuration inconnue'
            ),
            'statut': result.statut,
            'log_contenu': log_contenu,
            'commentaire': result.commentaire,
            'date_execution': (
                execution_date.strftime('%Y-%m-%d %H:%M') 
                if execution_date else 'Date inconnue'
            )
        })
    
    return JsonResponse(data, safe=False)


@login_required
def api_admin_menu(request):
    """Expose la structure du menu admin en JSON pour React"""
    app_list = admin.site.get_app_list(request)
    return JsonResponse(app_list, safe=False)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def scripts_par_projet(request):
    projet_id = request.GET.get("projet_id")
    if not projet_id:
        return Response({"error": "Le paramètre projet_id est requis"}, status=400)

    # Filtrer les scripts associés à ce projet
    scripts = Script.objects.filter(projet_id=projet_id)
    
    # Sérialiser simplement
    result = [
        {
            "id": s.id,
            "nom": s.nom,
            "axe": s.axe.nom if s.axe else None,
            "sous_axe": s.sous_axe.nom if s.sous_axe else None,
            "priorite": s.get_priorite_display(),
            "fichier_url": s.fichier.url if s.fichier else None,
        }
        for s in scripts
    ]

    return Response(result)

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse

@login_required
def api_user_permissions (request):
    """
    Retourne les permissions de l'utilisateur courant
    """
    user = request.user

    # Permissions sous forme 'app_label.codename'
    perms = list(user.get_all_permissions())

    # Ou en dictionnaire plus détaillé
    perms_dict = {}
    for perm in perms:
        app_label, codename = perm.split('.')
        perms_dict.setdefault(app_label, []).append(codename)

    return JsonResponse({
        'username': user.username,
        'permissions': perms,          # liste simple
        'permissions_dict': perms_dict # regroupé par app
    })
