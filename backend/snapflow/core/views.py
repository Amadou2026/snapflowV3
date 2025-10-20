from warnings import filters
from rest_framework import viewsets, status, generics, permissions
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.decorators import login_required
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from rest_framework.filters import OrderingFilter
from django.db.models import Q
from rest_framework.exceptions import ValidationError, PermissionDenied
from django.db.models import Prefetch


from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse, FileResponse, Http404
from django.contrib import messages, admin
from django.views.decorators.http import require_POST, require_http_methods
from django.views.generic import ListView, TemplateView
from django.utils.decorators import method_decorator
from django.contrib.admin.views.decorators import staff_member_required  # CORRECTION ICI
from django.contrib.auth.models import Group, Permission
from django.contrib.auth import get_user_model, update_session_auth_hash
from django.contrib.auth.forms import PasswordChangeForm

from django.db import transaction
from django.db.models import Count, Q
from django.db.models.functions import TruncDate

from datetime import datetime, timedelta
from django.utils import timezone
from io import BytesIO
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
import os

# Import des modèles
from .models import (
    Configuration, CustomUser, Societe, SecteurActivite, GroupePersonnalise,
    Axe, SousAxe, Script, Projet, EmailNotification, 
    ConfigurationTest, ExecutionTest, ExecutionResult
)

# Import des serializers (sélectifs pour éviter les circularités)
from .serializers import (
    AxeSerializer, ConfigurationSerializer, ProblemeScriptSerializer, ProjetDetailSerializer, SousAxeSerializer, ScriptSerializer, ProjetSerializer,
    ConfigurationTestSerializer, ExecutionTestSerializer, ExecutionTestExportSerializer,
    EmailNotificationSerializer, GroupePersonnaliseSerializer, SecteurActiviteSerializer,
    CustomUserSerializer, SocieteSerializer, SocieteListSerializer, SocieteDetailSerializer,
    SocieteCreateSerializer, SocieteUpdateSerializer
)

CustomUser = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["email"] = user.email
        token["first_name"] = user.first_name
        token["last_name"] = user.last_name
        token["groupes"] = list(user.groups.values_list('name', flat=True))
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
    serializer_class = ScriptSerializer
    permission_classes = [IsAuthenticated]
    
    # Garder l'attribut queryset pour le router
    queryset = Script.objects.all()

    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user

        # Superadmin voit tout
        if user.is_superuser:
            return queryset

        # Les autres utilisateurs ne voient que les scripts de leurs projets
        return queryset.filter(projet__societes=user.societe)



from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import ProblemeScript, Projet
from .serializers import ProblemeScriptSerializer
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def scripts_problemes(request):
    """
    API pour récupérer les scripts présentant des problèmes d'exécution
    """
    try:
        user = request.user
        
        # Récupérer les problèmes de scripts existants
        probleme_scripts = ProblemeScript.objects.select_related(
            'script', 'script__projet', 'script__projet__societes'
        ).filter(statut__in=['critique', 'en_attente_resolution', 'surveille'])
        
        # Si l'utilisateur n'est pas superadmin, filtrer selon ses permissions
        if not user.is_superuser:
            if hasattr(user, 'societe') and user.societe:
                probleme_scripts = probleme_scripts.filter(
                    script__projet__societes=user.societe
                )
            else:
                # Filtrer selon les projets de l'utilisateur
                projets_acces = Projet.objects.filter(
                    Q(charge_de_compte=user) |
                    Q(societe__admin=user) |
                    Q(societe__employes=user)
                ).distinct()
                probleme_scripts = probleme_scripts.filter(
                    script__projet__in=projets_acces
                )
        
        # Serializer les données
        serializer = ProblemeScriptSerializer(probleme_scripts, many=True)
        
        logger.info(f"📊 Récupération de {len(serializer.data)} scripts avec problèmes pour l'utilisateur {user.username}")
        
        return Response(serializer.data)
    
    except Exception as e:
        logger.error(f"❌ Erreur lors de la récupération des scripts avec problèmes: {str(e)}")
        return Response(
            {'error': f'Erreur lors de la récupération des scripts avec problèmes: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def forcer_detection_problemes(request):
    """
    API pour forcer la détection des problèmes (manuellement)
    """
    try:
        from .jobs import detecter_scripts_problemes
        
        # Exécuter la détection
        success = detecter_scripts_problemes()
        
        if success:
            return Response({
                'message': 'Détection des problèmes terminée avec succès',
                'status': 'success'
            })
        else:
            return Response({
                'message': 'Erreur lors de la détection des problèmes',
                'status': 'error'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    except Exception as e:
        logger.error(f"❌ Erreur lors de la détection forcée: {str(e)}")
        return Response(
            {'error': f'Erreur lors de la détection forcée: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )



# class ProjetViewSet(viewsets.ModelViewSet):
#     queryset = Projet.objects.all()
#     serializer_class = ProjetSerializer
#     permission_classes = [IsAuthenticated]

#     def get_queryset(self):
#         user = self.request.user
#         if user.is_superuser:
#             queryset = Projet.objects.all()
#         else:
#             queryset = Projet.objects.filter(charge_de_compte=user)

#         projet_id = self.request.GET.get("projet_id")
#         if projet_id:
#             queryset = queryset.filter(id=projet_id)

#         return queryset


class ConfigurationTestViewSet(viewsets.ModelViewSet):
    queryset = ConfigurationTest.objects.all()
    serializer_class = ConfigurationTestSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['societe', 'projet', 'is_active', 'periodicite']
    search_fields = ['nom', 'projet__nom', 'societe__nom']
    ordering_fields = ['nom', 'date_creation', 'date_activation', 'is_active']
    ordering = ['-date_creation']

    def get_queryset(self):
        user = self.request.user
        queryset = ConfigurationTest.objects.all().select_related(
            'societe', 'projet'
        ).prefetch_related('scripts', 'emails_notification')
        
        if user.is_superuser:
            return queryset
        
        if hasattr(user, 'societe') and user.societe:
            return queryset.filter(societe=user.societe)
        
        projets_acces = Projet.objects.filter(
            Q(charge_de_compte=user) |
            Q(societe__admin=user) |
            Q(societe__employes=user)
        ).distinct()
        
        return queryset.filter(projet__in=projets_acces)

    def get_serializer_context(self):
        """IMPORTANT: Ajouter le user dans le context AVANT tout"""
        context = super().get_serializer_context()
        context['request'] = self.request
        context['user'] = self.request.user
        return context

    def perform_create(self, serializer):
        """Méthode corrigée pour la création"""
        user = self.request.user
        
        print("🎯 PERFORM_CREATE VIEWSET")
        print(f"👤 User: {user.username}")
        print(f"🔐 Is superuser: {user.is_superuser}")
        print(f"📝 Serializer validated_data: {serializer.validated_data}")
        
        try:
            # IMPORTANT: Le serializer a déjà validé et ajouté la société dans validate()
            # On sauvegarde simplement avec les données validées
            instance = serializer.save()
            
            print(f"✅ Instance sauvegardée avec ID: {instance.id}")
            print(f"📋 Nom: {instance.nom}")
            print(f"🏢 Société: {instance.societe}")
            print(f"📁 Projet: {instance.projet}")
            print(f"🔄 Active: {instance.is_active}")
            
            # Vérification supplémentaire
            exists = ConfigurationTest.objects.filter(id=instance.id).exists()
            print(f"🔍 Vérification existence en BDD: {exists}")
            
            if not exists:
                print("❌ ALERTE: L'instance n'existe pas en BDD après save!")
            
            return instance
            
        except Exception as e:
            print(f"❌ ERREUR dans perform_create: {str(e)}")
            import traceback
            print(f"📋 STACK TRACE: {traceback.format_exc()}")
            raise

    def create(self, request, *args, **kwargs):
        """Override pour ajouter des logs détaillés"""
        print("=" * 80)
        print("🚀 CREATE ENDPOINT APPELÉ")
        print(f"📍 URL: {request.path}")
        print(f"📝 Data reçue: {request.data}")
        print(f"👤 User: {request.user.username}")
        print("=" * 80)
        
        try:
            response = super().create(request, *args, **kwargs)
            
            print("=" * 80)
            print("✅ CREATE ENDPOINT TERMINÉ")
            print(f"📊 Status: {response.status_code}")
            print(f"📋 Response data: {response.data}")
            print("=" * 80)
            
            # Vérification finale critique
            if response.status_code == 201:
                config_id = response.data.get('id')
                if config_id:
                    exists = ConfigurationTest.objects.filter(id=config_id).exists()
                    count = ConfigurationTest.objects.count()
                    print(f"🔍 VÉRIFICATION FINALE:")
                    print(f"   - Config {config_id} existe: {exists}")
                    print(f"   - Total configs en BDD: {count}")
                    
                    if exists:
                        config = ConfigurationTest.objects.get(id=config_id)
                        print(f"   - Scripts: {config.scripts.count()}")
                        print(f"   - Emails: {config.emails_notification.count()}")
            
            return response
            
        except Exception as e:
            print("=" * 80)
            print(f"❌ ERREUR CREATE ENDPOINT: {str(e)}")
            import traceback
            print(f"📋 STACK TRACE:\n{traceback.format_exc()}")
            print("=" * 80)
            raise

    @action(detail=True, methods=["post"], url_path="activate")
    def activate(self, request, pk=None):
        config = self.get_object()
        self.check_object_permissions(request, config)
        
        config.is_active = True
        config.date_activation = timezone.now()
        config.save()
        
        return Response({"status": "activated", "date_activation": config.date_activation}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="deactivate")
    def deactivate(self, request, pk=None):
        config = self.get_object()
        self.check_object_permissions(request, config)
        
        config.is_active = False
        config.date_desactivation = timezone.now()
        config.save()
        
        return Response({"status": "deactivated", "date_desactivation": config.date_desactivation}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="execute-now")
    def execute_now(self, request, pk=None):
        """Exécuter la configuration immédiatement"""
        config = self.get_object()
        self.check_object_permissions(request, config)
        
        config.last_execution = timezone.now()
        config.save()
        
        return Response({
            "status": "executed", 
            "last_execution": config.last_execution
        }, status=status.HTTP_200_OK)


class ExecutionTestViewSet(viewsets.ModelViewSet):
    queryset = ExecutionTest.objects.all()
    serializer_class = ExecutionTestSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # CORRECTION: Logique de filtrage améliorée
        queryset = ExecutionTest.objects.select_related(
            'configuration', 
            'configuration__projet',
            'configuration__societe'
        )
        
        # Superadmin voit tout
        if user.is_superuser:
            return queryset.all()
        
        # Administrateur de société voit les exécutions de sa société
        if hasattr(user, 'societe') and user.societe:
            return queryset.filter(configuration__societe=user.societe)
        
        # Chargé de projet voit les exécutions de ses projets
        if hasattr(user, 'projets_charges'):
            return queryset.filter(configuration__projet__in=user.projets_charges.all())
        
        # Par défaut: utilisateur normal voit les exécutions où il est charge_de_compte
        return queryset.filter(configuration__projet__charge_de_compte=user)


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
            p.drawString(30, y, line[:110])
            y -= 15

        p.save()
        buffer.seek(0)
        return FileResponse(
            buffer, as_attachment=True, filename=f"rapport_{execution.id}.pdf"
        )


# Dashboard
def dashboard_view(request):
    projet_id = request.GET.get("projet_id")
    periode = request.GET.get("periode", "mois")
    selected_periode = periode if periode in ["jour", "semaine", "mois", "annee"] else "mois"
       
    if not selected_periode or selected_periode.strip() == "":
        selected_periode = "mois"
    
    if not projet_id or projet_id.strip() == "":
        projet_id = None
    
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
        except (Projet.DoesNotExist, ValueError):
            projet_selectionne = None

    # Filtrage de base
    if projet_selectionne:
        execution_tests = ExecutionTest.objects.filter(configuration__projet=projet_selectionne)
    else:
        execution_tests = ExecutionTest.objects.filter(configuration__projet__in=projets_utilisateur)

    # Application du filtre temporel
    aujourd_hui = datetime.now()

    if selected_periode == "jour":
        date_debut = aujourd_hui.replace(hour=0, minute=0, second=0, microsecond=0)
    elif selected_periode == "semaine":
        date_debut = aujourd_hui - timedelta(days=7)
    elif selected_periode == "mois":
        date_debut = aujourd_hui - timedelta(days=30)
    elif selected_periode == "annee":
        date_debut = aujourd_hui - timedelta(days=365)
    else:
        date_debut = aujourd_hui - timedelta(days=30)

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

        "debug_info": {
            "url_complete": request.get_full_path(),
            "get_params": dict(request.GET),
            "tests_avant_filtre": execution_tests_avant_filtre,
            "tests_apres_filtre": execution_tests_apres_filtre,
            "date_debut": date_debut,
        }
    }
 
    return render(request, "admin/dashboard.html", context)


class ScriptsTestsStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        projet_id = request.GET.get("projet_id")
        periode = request.GET.get("periode", "mois")
        user = request.user

        if user.is_superuser:
            projets = Projet.objects.all()
        else:
            projets = Projet.objects.filter(charge_de_compte=user)

        if projet_id:
            projets = projets.filter(id=projet_id)

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

        tests = ExecutionTest.objects.filter(configuration__projet__in=projets, started_at__gte=date_debut)
        test_ids = tests.values_list('id', flat=True)

        total_scripts = Script.objects.filter(configurationtest__executiontest__in=test_ids).distinct().count()
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


@staff_member_required
def execution_resultats_view(request):
    resultats = ExecutionResult.objects.select_related('execution', 'script', 'execution__configuration').order_by('-execution__started_at')
    return render(request, 'admin/execution_resultats.html', {'resultats': resultats})

# views.py
from rest_framework import generics
from .models import ExecutionResult
from .serializers import ExecutionResultSerializer

class ExecutionResultatList(generics.ListAPIView):
    queryset = ExecutionResult.objects.select_related(
        'execution', 
        'script', 
        'execution__configuration',
        'execution__configuration__projet'
    ).order_by('-execution__started_at')
    serializer_class = ExecutionResultSerializer




# API Scripts
@require_http_methods(["GET"])
def api_next_scheduled_scripts(request):
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


@login_required
def dashboard_scheduled_scripts(request):
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
        
        for config in context['configurations']:
            config.next_execution = config.get_next_execution_time()
            config.is_overdue = False
            if config.last_execution:
                expected_next = config.last_execution + config.get_periodicite_timedelta()
                config.is_overdue = timezone.now() > expected_next
        
        return context


@login_required
def configuration_detail_scheduled(request, config_id):
    configuration = get_object_or_404(ConfigurationTest, id=config_id)
    
    context = {
        'configuration': configuration,
        'next_execution': configuration.get_next_execution_time(),
        'is_due': configuration.is_due_for_execution(),
        'scripts': configuration.scripts.all(),
        'periodicite_display': configuration.get_periodicite_display(),
    }
    
    if configuration.last_execution:
        expected_next = configuration.last_execution + configuration.get_periodicite_timedelta()
        if timezone.now() > expected_next:
            context['is_overdue'] = True
            context['delay'] = timezone.now() - expected_next
    
    return render(request, 'configurations/detail_scheduled.html', context)


def get_dashboard_data():
    return {
        'configurations_to_execute_now': ConfigurationTest.get_configurations_to_execute(),
        'next_24h_schedule': ConfigurationTest.get_next_scheduled_configurations(24),
        'overdue_configurations': ConfigurationTest.get_overdue_configurations(),
        'active_configurations_count': ConfigurationTest.objects.filter(is_active=True).count(),
    }


def get_next_scripts_for_project(project_id, hours_ahead=24):
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
    
    next_scripts.sort(key=lambda x: x['execution_time'])
    return next_scripts


# Vue page d'accueil
class HomeView(TemplateView):
    template_name = 'home/index.html'

def home_view(request):
    return render(request, 'home/index.html')


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
        config = ConfigurationTest.objects.first()
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


@api_view(['GET'])
def execution_results_api(request):
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
    
    return Response(data)


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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_admin_menu(request):
    if not request.user.is_staff:
        return JsonResponse({
            'error': 'Access denied',
            'message': 'Vous n\'avez pas les permissions pour accéder à l\'administration'
        }, status=403)
    
    try:
        app_list = admin.site.get_app_list(request)
        return JsonResponse(app_list, safe=False)
    except Exception as e:
        return JsonResponse({
            'error': 'Server error',
            'message': f'Erreur lors de la récupération du menu: {str(e)}'
        }, status=500)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def scripts_par_projet(request):
    projet_id = request.GET.get("projet_id")
    if not projet_id:
        return Response({"error": "Le paramètre projet_id est requis"}, status=400)

    scripts = Script.objects.filter(projet_id=projet_id)
    
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_user_permissions(request):
    user = request.user

    perms = list(user.get_all_permissions())

    perms_dict = {}
    for perm in perms:
        app_label, codename = perm.split('.')
        perms_dict.setdefault(app_label, []).append(codename)

    return Response({
        'username': user.username,
        'permissions': perms,
        'permissions_dict': perms_dict
    })


# CRUD SOCIETE
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_societe(request):
    try:
        if not request.user.is_superuser:
            return Response(
                {"detail": "Vous n'avez pas la permission de créer une société"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = SocieteCreateSerializer(data=request.data, context={'request': request})
        
        if serializer.is_valid():
            societe = serializer.save()
            societe_data = SocieteDetailSerializer(societe).data
            return Response(societe_data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_societes(request):
    try:
        qs = Societe.objects.all().prefetch_related('projets', 'employes')
        if not request.user.is_superuser:
            qs = qs.filter(admin=request.user)
        serializer = SocieteDetailSerializer(qs, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def detail_societe(request, pk):
    try:
        societe = Societe.objects.prefetch_related('projets', 'employes').get(pk=pk)
        if not request.user.is_superuser and societe.admin != request.user:
            return Response({"detail": "Accès refusé"}, status=status.HTTP_403_FORBIDDEN)
    except Societe.DoesNotExist:
        return Response({"detail": "Non trouvé"}, status=status.HTTP_404_NOT_FOUND)
    
    # CORRECTION : Utiliser SocieteDetailSerializer au lieu de SocieteSerializer
    serializer = SocieteDetailSerializer(societe)
    return Response(serializer.data)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def update_societe(request, pk):
    try:
        societe = Societe.objects.get(pk=pk)
        
        if not request.user.is_superuser and societe.admin != request.user:
            return Response({"detail": "Accès refusé"}, status=status.HTTP_403_FORBIDDEN)
            
    except Societe.DoesNotExist:
        return Response({"detail": "Non trouvé"}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'PUT':
        serializer = SocieteUpdateSerializer(societe, data=request.data)
    else:
        serializer = SocieteUpdateSerializer(societe, data=request.data, partial=True)
        
    if serializer.is_valid():
        serializer.save()
        societe_data = SocieteDetailSerializer(societe).data
        return Response(societe_data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_societe(request, pk):
    try:
        societe = Societe.objects.get(pk=pk)
        
        if not request.user.is_superuser:
            return Response(
                {"detail": "Vous n'avez pas la permission de supprimer une société"}, 
                status=status.HTTP_403_FORBIDDEN
            )
            
    except Societe.DoesNotExist:
        return Response({"detail": "Non trouvé"}, status=status.HTTP_404_NOT_FOUND)

    societe.delete()
    return Response({"detail": "Société supprimée avec succès"}, status=status.HTTP_204_NO_CONTENT)

# Email Notification
class EmailNotificationViewSet(viewsets.ModelViewSet):
    serializer_class = EmailNotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['societe', 'est_actif']

    def get_queryset(self):
        user = self.request.user
        queryset = EmailNotification.objects.all().select_related('societe', 'created_by')
        
        if user.is_superuser:
            return queryset
        
        # Pour les admins de société, ne retourner que les emails de leurs sociétés
        return queryset.filter(societe__admin=user)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def by_societe(self, request):
        """Récupérer tous les emails d'une société spécifique"""
        societe_id = request.query_params.get('societe_id')
        if not societe_id:
            return Response(
                {"detail": "Le paramètre societe_id est requis"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            societe = Societe.objects.get(id=societe_id)
            
            # Vérifier les permissions
            if not request.user.is_superuser and societe.admin != request.user:
                return Response({"detail": "Accès refusé"}, status=status.HTTP_403_FORBIDDEN)
                
            emails = EmailNotification.objects.filter(societe=societe, est_actif=True)
            serializer = self.get_serializer(emails, many=True)
            return Response(serializer.data)
            
        except Societe.DoesNotExist:
            return Response({"detail": "Société non trouvée"}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['post'])
    def toggle_activation(self, request, pk=None):
        """Activer/désactiver un email de notification"""
        email_notification = self.get_object()
        email_notification.est_actif = not email_notification.est_actif
        email_notification.save()
        
        serializer = self.get_serializer(email_notification)
        return Response(serializer.data)

# Secteur d'activité
class SecteurActiviteListAPIView(APIView):
    def get(self, request):
        secteurs = SecteurActivite.objects.all()
        serializer = SecteurActiviteSerializer(secteurs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request):
        serializer = SecteurActiviteSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SecteurActiviteListCreateAPIView(generics.ListCreateAPIView):
    queryset = SecteurActivite.objects.all()
    serializer_class = SecteurActiviteSerializer


class SecteurActiviteDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SecteurActivite.objects.all()
    serializer_class = SecteurActiviteSerializer


# User profil
class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        societes_data = SocieteSerializer(user.societes_employes.all(), many=True).data
        data = {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "societe": societes_data,            
            "permissions": list(user.get_all_permissions()),
            "groups": list(user.groups.values_list('name', flat=True)),
            "is_superuser": user.is_superuser,  
            "is_staff": user.is_staff,
             "is_active": user.is_active
        }
        return Response(data)


# Gestion utilisateur
class IsSuperUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_superuser)


class IsAdminOfSameSociete(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and (
            request.user.is_superuser or 
            (request.user.is_staff and request.user.societe)
        ))


class UserListCreateView(generics.ListCreateAPIView):
    serializer_class = CustomUserSerializer
    permission_classes = [IsAdminOfSameSociete]
    
    def get_queryset(self):
        user = self.request.user
        
        if user.is_superuser:
            return CustomUser.objects.all()
        
        if user.is_staff and user.societe:
            return CustomUser.objects.filter(societe=user.societe)
        
        return CustomUser.objects.none()
    
    def perform_create(self, serializer):
        if not self.request.user.is_superuser and self.request.user.societe:
            serializer.save(societe=self.request.user.societe)
        else:
            serializer.save()


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = CustomUser.objects.all()
    serializer_class = CustomUserSerializer
    permission_classes = [permissions.IsAdminUser]


# CRUD User
@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def update_user_profile(request, pk):
    try:
        user = CustomUser.objects.get(pk=pk)
        
        if request.user != user and not request.user.is_superuser:
            return Response(
                {'error': 'Vous ne pouvez modifier que votre propre profil'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = CustomUserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except CustomUser.DoesNotExist:
        return Response(
            {'error': 'Utilisateur non trouvé'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    form = PasswordChangeForm(user=request.user, data=request.data)
    if form.is_valid():
        form.save()
        update_session_auth_hash(request, form.user)
        return Response({'success': 'Mot de passe modifié avec succès'})
    return Response(form.errors, status=status.HTTP_400_BAD_REQUEST)


# Gestion Group / role
class GroupePersonnaliseViewSet(viewsets.ModelViewSet):
    queryset = GroupePersonnalise.objects.all()
    serializer_class = GroupePersonnaliseSerializer
    permission_classes = [IsAuthenticated]  # Ajout de permissions de base

    def get_permissions(self):
        # Seuls les super-admin peuvent créer/modifier/supprimer des groupes
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated, IsSuperAdmin]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def list(self, request, *args, **kwargs):
        groupes_data = []

        for groupe_perso in self.get_queryset():
            auth_group = None
            try:
                auth_group = Group.objects.get(name=groupe_perso.nom)
            except Group.DoesNotExist:
                auth_group = None

            auth_group_id = auth_group.id if auth_group else None

            if auth_group:
                permissions = list(auth_group.permissions.values_list("codename", flat=True))
            else:
                permissions = list(groupe_perso.permissions.values_list("codename", flat=True))

            groupes_data.append({
                'id': auth_group_id,
                'auth_group_id': auth_group_id,
                'groupe_perso_id': groupe_perso.id,
                'nom': groupe_perso.nom,
                'type_groupe': groupe_perso.type_groupe,
                'role_predefini': groupe_perso.role_predefini,
                'role_display': groupe_perso.get_role_predefini_display() if groupe_perso.role_predefini else None,
                'description': groupe_perso.description,
                'permissions': permissions,
                'est_protege': groupe_perso.est_protege
            })

        return Response(groupes_data)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        perms = data.pop('permissions', [])

        groupe_django, created = Group.objects.get_or_create(name=data['nom'])

        permission_objs = []
        for p in perms:
            try:
                app_label, codename = p.split('.')
                perm = Permission.objects.get(content_type__app_label=app_label, codename=codename)
                permission_objs.append(perm)
            except ValueError:
                print(f"Permission malformée ignorée: {p}")
            except Permission.DoesNotExist:
                print(f"Permission introuvable ignorée: {p}")

        data['permissions'] = [perm.id for perm in permission_objs]

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        groupe_perso = serializer.save(groupe_django=groupe_django)

        groupe_django.permissions.set(permission_objs)
        groupe_perso.permissions.set(permission_objs)

        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @transaction.atomic
    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Vérifier si le groupe est protégé
        if instance.est_protege:
            return Response(
                {"detail": "Ce groupe est protégé et ne peut pas être modifié."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().update(request, *args, **kwargs)
    
    @transaction.atomic
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Vérifier si le groupe est protégé
        if instance.est_protege:
            return Response(
                {"detail": "Ce groupe est protégé et ne peut pas être supprimé."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        return super().destroy(request, *args, **kwargs)


@api_view(['GET'])
def list_all_permissions(request):
    permissions = Permission.objects.select_related('content_type').values(
        'id',
        'codename',
        'content_type__app_label'
    )
    return Response(list(permissions))


# Changer MDP pour l'admin
@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_change_password(request, user_id):
    try:
        target_user = get_user_model().objects.get(id=user_id)
        
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        if not new_password:
            return Response(
                {"new_password": "Le nouveau mot de passe est requis"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not confirm_password:
            return Response(
                {"confirm_password": "La confirmation du mot de passe est requise"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if new_password != confirm_password:
            return Response(
                {"confirm_password": "Les mots de passe ne correspondent pas"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(new_password) < 8:
            return Response(
                {"new_password": "Le mot de passe doit contenir au moins 8 caractères"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        target_user.set_password(new_password)
        target_user.save()
        
        return Response({
            "success": f"Mot de passe de {target_user.email} modifié avec succès"
        })
        
    except get_user_model().DoesNotExist:
        return Response(
            {"detail": "Utilisateur non trouvé"}, 
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"detail": "Erreur lors du changement de mot de passe"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
# Paramètre
class ConfigurationViewSet(viewsets.ModelViewSet):
    serializer_class = ConfigurationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['societe']
    search_fields = ['societe__nom']

    def get_queryset(self):
        user = self.request.user
        queryset = Configuration.objects.all().select_related('societe')
        
        if user.is_superuser:
            return queryset
        
        # Pour les administrateurs, retourner les configurations de leurs sociétés
        # Vérifier d'abord si l'utilisateur a une société assignée
        if hasattr(user, 'societe') and user.societe:
            return queryset.filter(societe=user.societe)
        
        # Fallback : si pas de société assignée, retourner vide
        return queryset.none()

    def perform_create(self, serializer):
        # Pour les administrateurs, assigner automatiquement leur société
        if not self.request.user.is_superuser and hasattr(self.request.user, 'societe'):
            serializer.save(societe=self.request.user.societe)
        else:
            serializer.save()

    @action(detail=True, methods=['post'])
    def sync_redmine(self, request, pk=None):
        """Synchroniser les projets Redmine pour cette configuration"""
        configuration = self.get_object()
        
        # Vérifier les permissions
        if not request.user.is_superuser and configuration.societe != request.user.societe:
            return Response(
                {"detail": "Vous n'avez pas accès à cette configuration."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        success, message = configuration.sync_redmine_projects()
        
        if success:
            return Response({"detail": message}, status=status.HTTP_200_OK)
        else:
            return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def my_configuration(self, request):
        """Récupérer la configuration de la société de l'utilisateur connecté"""
        if request.user.is_superuser:
            return Response(
                {"detail": "Les superadmins n'ont pas de configuration spécifique."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not hasattr(request.user, 'societe') or not request.user.societe:
            return Response(
                {"detail": "Aucune société assignée à votre compte."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            configuration = Configuration.objects.get(societe=request.user.societe)
            serializer = self.get_serializer(configuration)
            return Response(serializer.data)
        except Configuration.DoesNotExist:
            return Response(
                {"detail": "Aucune configuration trouvée pour votre société."},
                status=status.HTTP_404_NOT_FOUND
            )
            
from django.shortcuts import get_object_or_404
from rest_framework.decorators import action
from rest_framework.response import Response

class ProjetViewSet(viewsets.ModelViewSet):
    queryset = Projet.objects.all()
    serializer_class = ProjetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            queryset = Projet.objects.all()
        else:
            # Récupérer les projets où l'utilisateur est charge_de_compte
            # OU les projets de sa société
            queryset = Projet.objects.filter(
                Q(charge_de_compte=user) | 
                Q(societes=user.societe)
            ).distinct()

        projet_id = self.request.GET.get("projet_id")
        if projet_id:
            queryset = queryset.filter(id=projet_id)

        return queryset

    @action(detail=True, methods=['get'], url_path='detail-complet')
    def detail_complet(self, request, pk=None):
        """
        Endpoint pour récupérer tous les détails d'un projet
        """
        try:
            projet = self.get_object()
            
            # Vérifier les permissions
            if not request.user.is_superuser:
                if not projet.societes.filter(id=request.user.societe.id).exists():
                    return Response(
                        {"detail": "Vous n'avez pas accès à ce projet"}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            serializer = ProjetDetailSerializer(projet, context={'request': request})
            return Response(serializer.data)
            
        except Projet.DoesNotExist:
            return Response(
                {"detail": "Projet non trouvé"}, 
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['get'])
    def configurations(self, request, pk=None):
        """Récupérer toutes les configurations d'un projet"""
        projet = self.get_object()
        # CORRECTION: Utiliser ConfigurationTest avec filtre sur projet
        configurations = ConfigurationTest.objects.filter(projet=projet).select_related('societe')
        serializer = ConfigurationTestSerializer(configurations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def scripts(self, request, pk=None):
        """Récupérer tous les scripts d'un projet"""
        projet = self.get_object()
        scripts = projet.scripts.all().select_related('axe', 'sous_axe')
        serializer = ScriptSerializer(scripts, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def executions(self, request, pk=None):
        """Récupérer les exécutions d'un projet"""
        projet = self.get_object()
        executions = ExecutionTest.objects.filter(
            configuration__projet=projet
        ).select_related('configuration').order_by('-started_at')[:50]
        
        serializer = ExecutionTestSerializer(executions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def statistiques(self, request, pk=None):
        """Récupérer les statistiques d'un projet"""
        projet = self.get_object()
        
        # CORRECTION: Utiliser ConfigurationTest avec filtre sur projet
        configurations = ConfigurationTest.objects.filter(projet=projet)
        executions = ExecutionTest.objects.filter(configuration__projet=projet)
        
        # Statistiques par statut
        stats_par_statut = executions.values('statut').annotate(
            count=Count('id')
        ).order_by('statut')
        
        # Évolutions temporelles (30 derniers jours)
        date_limite = timezone.now() - timedelta(days=30)
        executions_recentes = executions.filter(started_at__gte=date_limite)
        
        evolutions = executions_recentes.annotate(
            date=TruncDate('started_at')
        ).values('date').annotate(
            total=Count('id'),
            reussis=Count('id', filter=Q(statut='done')),
            echecs=Count('id', filter=Q(statut='error'))
        ).order_by('date')
        
        data = {
            'basics': {
                'total_configurations': configurations.count(),
                'configurations_actives': configurations.filter(is_active=True).count(),
                'total_scripts': projet.scripts.count(),
                'total_executions': executions.count(),
                'societes_associees': projet.societes.count(),
            },
            'par_statut': list(stats_par_statut),
            'evolutions': list(evolutions),
            'taux_reussite': round(
                (executions.filter(statut='done').count() / executions.count() * 100) 
                if executions.count() > 0 else 0, 
                2
            )
        }
        
        return Response(data)

# Vue API dédiée pour la page projet détaillée
class ProjetDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, projet_id):
        """
        Vue principale pour la page détaillée d'un projet
        Retourne toutes les données nécessaires pour l'affichage
        """
        try:
            # Optimisation des requêtes avec prefetch_related et select_related
            projet = Projet.objects.select_related('charge_de_compte').prefetch_related(
                'societes',
                'scripts',
                'scripts__axe',
                'scripts__sous_axe',
                'configurations_test',
                'configurations_test__societe',
                'configurations_test__scripts',
                'configurations_test__emails_notification',
                Prefetch(
                    'configurations_test__executiontest_set',
                    queryset=ExecutionTest.objects.select_related('configuration').order_by('-started_at'),
                    to_attr='executions_recentes'
                )
            ).get(id=projet_id)
            
            # Vérification des permissions
            if not request.user.is_superuser:
                if not projet.societes.filter(id=request.user.societe.id).exists():
                    return Response(
                        {"detail": "Accès non autorisé à ce projet"}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            # Ajout du contexte pour les calculs optimisés
            context = {
                'request': request,
                'projet_id': projet_id
            }
            
            serializer = ProjetDetailSerializer(projet, context=context)
            return Response(serializer.data)
            
        except Projet.DoesNotExist:
            return Response(
                {"detail": "Projet non trouvé"}, 
                status=status.HTTP_404_NOT_FOUND
            )
            
            
            
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def set_projet_actif(request):
    """Définir le projet actif dans la session"""
    projet_id = request.data.get('projet_id')
    
    if projet_id:
        try:
            projet = Projet.objects.get(id=projet_id)
            
            # Vérifier les permissions
            if not request.user.is_superuser:
                if not projet.societes.filter(id=request.user.societe.id).exists():
                    return Response(
                        {"detail": "Vous n'avez pas accès à ce projet"}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            # Stocker l'ID du projet dans la session
            request.session['projet_actif'] = projet_id
            request.session.save()
            
            return Response({
                "success": True,
                "message": f"Projet '{projet.nom}' défini comme actif",
                "projet_id": projet_id,
                "projet_nom": projet.nom
            })
            
        except Projet.DoesNotExist:
            return Response(
                {"detail": "Projet non trouvé"}, 
                status=status.HTTP_404_NOT_FOUND
            )
    
    return Response(
        {"detail": "ID de projet requis"}, 
        status=status.HTTP_400_BAD_REQUEST
    )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_projet_actif(request):
    """Récupérer le projet actif de la session"""
    projet_id = request.session.get('projet_actif')
    
    if projet_id:
        try:
            projet = Projet.objects.get(id=projet_id)
            
            # Vérifier que l'utilisateur a toujours accès à ce projet
            if not request.user.is_superuser:
                if not projet.societes.filter(id=request.user.societe.id).exists():
                    # Supprimer le projet de la session si plus d'accès
                    del request.session['projet_actif']
                    return Response({"projet_actif": None})
            
            return Response({
                "projet_actif": {
                    "id": projet.id,
                    "nom": projet.nom,
                    "url": projet.url
                }
            })
            
        except Projet.DoesNotExist:
            # Supprimer le projet de la session s'il n'existe plus
            del request.session['projet_actif']
            return Response({"projet_actif": None})
    
    return Response({"projet_actif": None})

# core/views.py RedmineProject

# core/views.py

import requests
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

class FetchRedmineProjectView(APIView):
    """
    API pour récupérer en direct les détails d'un projet depuis Redmine.
    L'URL est : /api/redmine/fetch-project/<project_id>/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, project_id):
        try:
            # 1. Récupérer la configuration Redmine de la société de l'utilisateur connecté
            configuration = request.user.societe.configuration

            if not configuration.redmine_url or not configuration.redmine_api_key:
                return Response(
                    {"error": "La configuration Redmine pour votre société est manquante (URL ou clé API)."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # 2. Préparer l'appel à l'API Redmine
            redmine_url = configuration.redmine_url.rstrip('/')
            redmine_project_url = f"{redmine_url}/projects/{project_id}.json"
            
            headers = {
                'X-Redmine-API-Key': configuration.redmine_api_key,
                'Content-Type': 'application/json'
            }

            # 3. Faire l'appel à l'API Redmine
            response = requests.get(redmine_project_url, headers=headers, timeout=10)

            # 4. Gérer les réponses d'erreur de Redmine
            if response.status_code == 404:
                return Response(
                    {"error": f"Le projet avec l'ID {project_id} n'existe pas sur le serveur Redmine."},
                    status=status.HTTP_404_NOT_FOUND
                )
            if response.status_code == 401:
                return Response(
                    {"error": "La clé API Redmine configurée pour votre société est invalide."},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            
            response.raise_for_status()  # Lève une exception pour les autres erreurs serveur

            # 5. Si succès, extraire et formater les données
            project_data = response.json().get('project', {})

            formatted_data = {
                "id_redmine": project_data.get('id'),
                "nom": project_data.get('name'),
                "identifier": project_data.get('identifier'),
                "description": project_data.get('description'),
                "url": project_data.get('homepage'),
            }

            return Response(formatted_data, status=status.HTTP_200_OK)

        except requests.exceptions.RequestException as e:
            # Gérer les erreurs de connexion (timeout, Redmine injoignable, etc.)
            return Response(
                {"error": f"Impossible de contacter le serveur Redmine : {str(e)}"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except AttributeError:
            # Gérer le cas où l'utilisateur ou sa société n'a pas de configuration
            return Response(
                {"error": "Votre utilisateur n'est pas lié à une société avec une configuration Redmine valide."},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": f"Une erreur inattendue est survenue : {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
