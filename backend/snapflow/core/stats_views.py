# core/stats_views.py
from django.http import JsonResponse
from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from .models import *
from core.models import ExecutionTest  # adapte le nom selon ton app
# from .serializers import ExecutionResultSerializer

from collections import defaultdict
from django.utils import timezone
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

def apply_period_filter(qs, periode, date_debut=None, date_fin=None):
    """Applique le filtre de période au queryset"""
    if not periode:
        return qs
        
    maintenant = timezone.now()
    
    if periode == "personnalise" and date_debut and date_fin:
        # Période personnalisée avec dates spécifiques
        try:
            start_date = timezone.make_aware(datetime.strptime(date_debut, "%Y-%m-%d"))
            end_date = timezone.make_aware(datetime.strptime(date_fin + " 23:59:59", "%Y-%m-%d %H:%M:%S"))
            return qs.filter(started_at__gte=start_date, started_at__lte=end_date)
        except ValueError:
            return qs
    elif periode == "jour":
        date_debut = maintenant - timedelta(days=1)
    elif periode == "semaine":
        date_debut = maintenant - timedelta(weeks=1)
    elif periode == "mois":
        date_debut = maintenant - timedelta(days=30)
    elif periode == "annee":
        date_debut = maintenant - timedelta(days=365)
    else:
        return qs  # Période non reconnue
    
    return qs.filter(started_at__gte=date_debut)

def filter_by_user_permissions(qs, user):
    """Filtre le queryset selon les permissions de l'utilisateur"""
    if user.is_superuser:
        return qs  # Superadmin voit tout
    else:
        # Utilisateur normal ne voit que ses projets
        projets_ids = Projet.objects.filter(charge_de_compte=user).values_list("id", flat=True)
        return qs.filter(configuration__projet__id__in=projets_ids)

@api_view(["GET"])
def tests_par_jour(request):
    projet_id = request.GET.get("projet_id")
    periode = request.GET.get("periode", "mois")
    date_debut = request.GET.get("date_debut")
    date_fin = request.GET.get("date_fin")
    
    qs = ExecutionTest.objects.all()

    # Appliquer le filtre par permissions utilisateur
    qs = filter_by_user_permissions(qs, request.user)
    
    # Appliquer le filtre période
    qs = apply_period_filter(qs, periode, date_debut, date_fin)
    
    # Appliquer le filtre projet spécifique
    if projet_id:
        qs = qs.filter(configuration__projet__id=projet_id)

    data = (
        qs.annotate(date=TruncDate("started_at"))
        .values("date", "configuration__projet__nom")
        .annotate(total=Count("id"))
        .order_by("date")
    )

    results = defaultdict(list)

    for item in data:
        projet_nom = item["configuration__projet__nom"] or "Projet inconnu"
        results[projet_nom].append({"date": item["date"], "total": item["total"]})

    return Response(results)


@api_view(["GET"])
def success_vs_failed_par_jour(request):
    projet_id = request.GET.get("projet_id")
    periode = request.GET.get("periode", "mois")
    date_debut = request.GET.get("date_debut")
    date_fin = request.GET.get("date_fin")
    
    qs = ExecutionTest.objects.all()

    # Appliquer le filtre par permissions utilisateur
    qs = filter_by_user_permissions(qs, request.user)
    
    # Appliquer le filtre période
    qs = apply_period_filter(qs, periode, date_debut, date_fin)
    
    # Appliquer le filtre projet spécifique
    if projet_id:
        qs = qs.filter(configuration__projet__id=projet_id)

    data = (
        qs.annotate(date=TruncDate("started_at"))
        .values("date", "statut")
        .annotate(total=Count("id"))
        .order_by("date")
    )

    result = {}
    for row in data:
        if row["date"] is None:
            continue  # ⚠️ On saute les lignes sans date

        date_str = row["date"].strftime("%d-%m-%Y")
        statut = row["statut"] or "inconnu"
        count = row["total"]

        if date_str not in result:
            result[date_str] = {"succès": 0, "échec": 0}

        if statut.lower() in ["done", "succès", "success"]:
            result[date_str]["succès"] = count
        elif statut.lower() in ["error", "échec", "fail", "failure"]:
            result[date_str]["échec"] = count
        else:
            pass  # Statut inconnu, on ignore

    response = [
        {"date": date, "succès": counts["succès"], "échec": counts["échec"]}
        for date, counts in sorted(result.items())
    ]

    return Response(response)


@api_view(["GET"])
def tests_par_projet(request):
    projet_id = request.GET.get("projet_id")
    periode = request.GET.get("periode", "mois")
    date_debut = request.GET.get("date_debut")
    date_fin = request.GET.get("date_fin")
    
    qs = ExecutionTest.objects.all()

    # Appliquer le filtre par permissions utilisateur
    qs = filter_by_user_permissions(qs, request.user)
    
    # Appliquer le filtre période
    qs = apply_period_filter(qs, periode, date_debut, date_fin)
    
    # Appliquer le filtre projet spécifique
    if projet_id:
        qs = qs.filter(configuration__projet__id=projet_id)

    data = (
        qs.values("configuration__projet__nom", "configuration__projet__id")
        .annotate(total=Count("id"))
        .order_by("-total")
    )

    result = [
        {
            "projet": row["configuration__projet__nom"], 
            "id": row["configuration__projet__id"],
            "total": row["total"]
        }
        for row in data
    ]
    return Response(result)


@api_view(["GET"])
def taux_erreur_par_script(request):
    projet_id = request.GET.get("projet_id")
    periode = request.GET.get("periode", "mois")
    date_debut = request.GET.get("date_debut")
    date_fin = request.GET.get("date_fin")

    # Base queryset
    qs = ExecutionTest.objects.all()

    # Appliquer le filtre par permissions utilisateur
    qs = filter_by_user_permissions(qs, request.user)
    
    # Appliquer le filtre période
    qs = apply_period_filter(qs, periode, date_debut, date_fin)

    # Filtrer par projet_id si précisé dans l'URL
    if projet_id:
        qs = qs.filter(configuration__projet__id=projet_id)

    data = (
        qs.values("configuration__scripts__nom")
        .annotate(
            total=Count("id"),
            erreurs=Count("id", filter=Q(statut="error"))
        )
        .order_by("-erreurs")
    )

    result = [
        {
            "script": row["configuration__scripts__nom"] or "Sans script",
            "total": row["total"],
            "erreurs": row["erreurs"],
            "taux_erreur": (
                round((row["erreurs"] / row["total"]) * 100, 2) if row["total"] else 0
            ),
        }
        for row in data
    ]

    return Response(result)


@api_view(["GET"])
def taux_reussite(request):
    projet_id = request.GET.get("projet_id")
    periode = request.GET.get("periode", "mois")
    date_debut = request.GET.get("date_debut")
    date_fin = request.GET.get("date_fin")
    
    qs = ExecutionTest.objects.all()

    # Appliquer le filtre par permissions utilisateur
    qs = filter_by_user_permissions(qs, request.user)
    
    # Appliquer le filtre période
    qs = apply_period_filter(qs, periode, date_debut, date_fin)
    
    # Appliquer le filtre projet spécifique
    if projet_id:
        qs = qs.filter(configuration__projet__id=projet_id)

    total = qs.count()
    success = qs.filter(
        statut__in=["done", "succès", "success"]
    ).count()  # succès possibles multiples
    echec = qs.filter(
        statut__in=["error", "échec", "fail", "failure"]
    ).count()

    taux_reussite = (success / total * 100) if total > 0 else 0
    taux_echec = (echec / total * 100) if total > 0 else 0

    return Response(
        {
            "total": total,
            "succès": success,
            "échec": echec,
            "taux_reussite": round(taux_reussite, 2),
            "taux_echec": round(taux_echec, 2),
        }
    )


# Debut
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def repartition_par_projet(request):
    projet_id = request.GET.get("projet_id")
    periode = request.GET.get("periode", "mois")
    date_debut = request.GET.get("date_debut")
    date_fin = request.GET.get("date_fin")

    qs = ExecutionTest.objects.all()

    # Appliquer le filtre par permissions utilisateur
    qs = filter_by_user_permissions(qs, request.user)
    
    # Appliquer le filtre période
    qs = apply_period_filter(qs, periode, date_debut, date_fin)

    if projet_id:
        qs = qs.filter(configuration__projet__id=projet_id)

    projets = (
        qs.values("configuration__projet__nom")
        .annotate(total=Count("id"))
        .order_by("-total")
    )

    projet_labels = [row["configuration__projet__nom"] for row in projets]
    projet_counts = [row["total"] for row in projets]

    return Response({"projet_labels": projet_labels, "projet_counts": projet_counts})


# Fin

# Debut

from .models import Projet

def repartition_par_projet_erreurs(request):
    """
    API pour récupérer les projets avec le plus et le moins d'erreurs,
    avec filtrage par période et par utilisateur (superadmin voit tout).
    """
    try:
        user = request.user
        periode = request.GET.get("periode", "mois")
        date_debut_str = request.GET.get("date_debut")
        date_fin_str = request.GET.get("date_fin")

        maintenant = timezone.now()
        date_debut = None
        date_fin = None

        # Dates personnalisées
        if periode == "personnalise" and date_debut_str and date_fin_str:
            try:
                date_debut = timezone.make_aware(
                    datetime.strptime(date_debut_str, "%Y-%m-%d")
                )
                date_fin = timezone.make_aware(
                    datetime.strptime(date_fin_str + " 23:59:59", "%Y-%m-%d %H:%M:%S")
                )

                if date_debut > date_fin:
                    return JsonResponse(
                        {
                            "error": "La date de début doit être antérieure à la date de fin"
                        },
                        status=400,
                    )
                if date_debut > maintenant or date_fin > maintenant:
                    return JsonResponse(
                        {"error": "Les dates ne peuvent pas être dans le futur"},
                        status=400,
                    )
                if (date_fin - date_debut).days > 730:
                    return JsonResponse(
                        {"error": "La période ne peut pas dépasser 2 ans"}, status=400
                    )

            except ValueError as e:
                return JsonResponse(
                    {"error": f"Format de date invalide: {str(e)}"}, status=400
                )

        # Périodes prédéfinies
        elif periode in ["jour", "semaine", "mois", "annee"]:
            if periode == "jour":
                date_debut = maintenant - timedelta(days=1)
            elif periode == "semaine":
                date_debut = maintenant - timedelta(weeks=1)
            elif periode == "mois":
                date_debut = maintenant - timedelta(days=30)
            elif periode == "annee":
                date_debut = maintenant - timedelta(days=365)

            date_fin = maintenant
        else:
            return JsonResponse({"error": "Période non supportée"}, status=400)

        # Filtre erreurs
        filter_erreurs = Q(
            configurationtest__executiontest__statut__in=[
                "error",
                "échec",
                "fail",
                "failed",
            ]
        )

        if date_debut and date_fin:
            filter_erreurs &= Q(
                configurationtest__executiontest__started_at__gte=date_debut,
                configurationtest__executiontest__started_at__lte=date_fin,
            )

        # 🔐 Si superadmin → tous les projets, sinon filtrer ceux liés à lui
        if user.is_superuser:
            projets = Projet.objects.all()
        else:
            projets = Projet.objects.filter(charge_de_compte=user)

        projets = (
            projets.annotate(
                nombre_erreurs=Count(
                    "configurationtest__executiontest",
                    filter=filter_erreurs,
                    distinct=True,
                )
            )
            .exclude(nombre_erreurs=0)
            .order_by("-nombre_erreurs")
        )

        projets_list = list(projets)

        if not projets_list:
            return JsonResponse(
                {
                    "max": None,
                    "min": None,
                    "message": "Aucune erreur trouvée pour cette période",
                    "periode_info": {
                        "type": periode,
                        "date_debut": date_debut.isoformat() if date_debut else None,
                        "date_fin": date_fin.isoformat() if date_fin else None,
                    },
                }
            )

        projet_max = projets_list[0]
        projet_min = projets_list[-1] if len(projets_list) > 1 else projet_max

        periode_info = {
            "type": periode,
            "date_debut": date_debut.isoformat() if date_debut else None,
            "date_fin": date_fin.isoformat() if date_fin else None,
            "nombre_projets_avec_erreurs": len(projets_list),
            "total_erreurs": sum(p.nombre_erreurs for p in projets_list),
        }

        logger.info(
            f"Stats erreurs - User: {user.username} - Période: {periode} - "
            f"Projets: {len(projets_list)} - Total erreurs: {periode_info['total_erreurs']}"
        )

        return JsonResponse(
            {
                "max": {
                    "nom": projet_max.nom,
                    "valeur": projet_max.nombre_erreurs,
                    "id": projet_max.id,
                },
                "min": {
                    "nom": projet_min.nom,
                    "valeur": projet_min.nombre_erreurs,
                    "id": projet_min.id,
                },
                "periode_info": periode_info,
                "message": f"Données récupérées avec succès pour la période {periode}",
            }
        )

    except Exception as e:
        logger.error(f"Erreur dans repartition_par_projet_erreurs: {str(e)}")
        return JsonResponse({"error": "Erreur interne du serveur"}, status=500)


def get_projets_erreurs_details(request):
    """
    API complémentaire pour récupérer plus de détails sur les erreurs par projet
    """
    try:
        periode = request.GET.get("periode", "mois")
        date_debut_str = request.GET.get("date_debut")
        date_fin_str = request.GET.get("date_fin")
        limit = int(request.GET.get("limit", 10))

        maintenant = timezone.now()
        date_debut = None
        date_fin = None

        if periode == "personnalise" and date_debut_str and date_fin_str:
            try:
                date_debut = timezone.make_aware(
                    datetime.strptime(date_debut_str, "%Y-%m-%d")
                )
                date_fin = timezone.make_aware(
                    datetime.strptime(date_fin_str + " 23:59:59", "%Y-%m-%d %H:%M:%S")
                )
            except ValueError:
                return JsonResponse({"error": "Format de date invalide"}, status=400)

        elif periode in ["jour", "semaine", "mois", "annee"]:
            if periode == "jour":
                date_debut = maintenant - timedelta(days=1)
            elif periode == "semaine":
                date_debut = maintenant - timedelta(weeks=1)
            elif periode == "mois":
                date_debut = maintenant - timedelta(days=30)
            elif periode == "annee":
                date_debut = maintenant - timedelta(days=365)

            date_fin = maintenant

        # Construction du filtre erreurs
        filter_erreurs = Q(
            configurationtest__executiontest__statut__in=[
                "error",
                "échec",
                "fail",
                "failed",
            ]
        )

        if date_debut and date_fin:
            filter_erreurs &= Q(
                configurationtest__executiontest__started_at__gte=date_debut,
                configurationtest__executiontest__started_at__lte=date_fin,
            )

        # Superadmin voit tous les projets, sinon filtrer par utilisateur
        projets_qs = Projet.objects.all()
        if not request.user.is_superuser:
            projets_qs = projets_qs.filter(charge_de_compte=request.user)

        projets = (
            projets_qs.annotate(
                nombre_erreurs=Count(
                    "configurationtest__executiontest",
                    filter=filter_erreurs,
                    distinct=True,
                )
            )
            .exclude(nombre_erreurs=0)
            .order_by("-nombre_erreurs")[:limit]
        )

        projets_data = [
            {
                "id": projet.id,
                "nom": projet.nom,
                "nombre_erreurs": projet.nombre_erreurs,
                "description": getattr(projet, "description", ""),
            }
            for projet in projets
        ]

        return JsonResponse(
            {
                "projets": projets_data,
                "periode_info": {
                    "type": periode,
                    "date_debut": date_debut.isoformat() if date_debut else None,
                    "date_fin": date_fin.isoformat() if date_fin else None,
                },
            }
        )

    except Exception as e:
        logger.error(f"Erreur dans get_projets_erreurs_details: {str(e)}")
        return JsonResponse({"error": "Erreur interne du serveur"}, status=500)


# Fin

# ✅ Nouvelle API pour debug
@api_view(["GET"])
def debug_filters(request):
    """API de debug pour vérifier les filtres"""
    projet_id = request.GET.get("projet_id")
    periode = request.GET.get("periode", "mois")
    date_debut = request.GET.get("date_debut")
    date_fin = request.GET.get("date_fin")
    
    qs = ExecutionTest.objects.all()
    
    # Appliquer le filtre par permissions utilisateur
    qs = filter_by_user_permissions(qs, request.user)
    
    total_avant_filtre = qs.count()
    
    if projet_id:
        qs = qs.filter(configuration__projet__id=projet_id)
    
    total_apres_projet = qs.count()
    
    qs = apply_period_filter(qs, periode, date_debut, date_fin)
    
    total_apres_periode = qs.count()
    
    return Response({
        "debug": {
            "projet_id": projet_id,
            "periode": periode,
            "date_debut": date_debut,
            "date_fin": date_fin,
            "total_avant_filtre": total_avant_filtre,
            "total_apres_projet": total_apres_projet,
            "total_apres_periode": total_apres_periode,
        }
    })


# //Tests non exécutés et non concluants
from django.http import JsonResponse
from core.models import Script

def nombre_test_non_execute(request):
    projet_id = request.GET.get('projet_id')
    periodicite = request.GET.get('periodicite')
    axe_id = request.GET.get('axe_id')
    periode = request.GET.get('periode', 'mois')
    date_debut = request.GET.get('date_debut')
    date_fin = request.GET.get('date_fin')

    queryset = ExecutionTest.objects.all()

    # Appliquer le filtre par permissions utilisateur
    queryset = filter_by_user_permissions(queryset, request.user)
    
    # Appliquer le filtre période
    queryset = apply_period_filter(queryset, periode, date_debut, date_fin)

    if projet_id:
        queryset = queryset.filter(configuration__projet_id=projet_id)

    if periodicite:
        queryset = queryset.filter(configuration__periodicite=periodicite)

    if axe_id:
        # On filtre sur les ExecutionTest dont au moins un script lié a l'axe donné
        queryset = queryset.filter(
            configuration__scripts__axe_id=axe_id
        ).distinct()

    results = (
        queryset
        .values('started_at__date')
        .annotate(
            non_execute_count=Count('id', filter=Q(statut='pending')),
            non_concluant_count=Count('id', filter=Q(statut='error')),
        )
        .order_by('started_at__date')
    )

    data = []
    for r in results:
        data.append({
            'date': r['started_at__date'].isoformat() if r['started_at__date'] else '',
            'non_execute': r['non_execute_count'],
            'non_concluant': r['non_concluant_count'],
        })

    return JsonResponse(data, safe=False)

# Debut Script planifié

# @api_view(["GET"])
# def scripts_planifies(request):
#     """
#     Retourne la liste des scripts planifiés pour exécution
#     """
#     projet_id = request.GET.get("projet_id")

#     # Inclut 'scheduled' et 'Planifié' pour couvrir tous les cas
#     qs = ExecutionResult.objects.filter(
#         statut__in=["scheduled", "Planifié"]
#     ).order_by("execution__started_at")

#     if projet_id:
#         qs = qs.filter(execution__configuration__projet__id=projet_id)

#     serializer = ExecutionResultSerializer(qs, many=True)
#     return Response(serializer.data)

# Fin

#  Execution result
from django.http import JsonResponse
from django.contrib.admin.views.decorators import staff_member_required
from .models import ExecutionResult

@staff_member_required
def stats_scripts_en_attente(request):
    tests_script_en_attente = ExecutionResult.objects.filter(statut='pending').count()

    return JsonResponse({
        "tests_script_en_attente": tests_script_en_attente,
    })

# core/views.py

from django.http import JsonResponse

@staff_member_required
def stats_execution_concluant_nonconcluant(request):
    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")
    periode = request.GET.get("periode", "mois")
    date_debut = request.GET.get("date_debut")
    date_fin = request.GET.get("date_fin")

    resultats = ExecutionResult.objects.select_related(
        "execution__configuration", "script"
    ).all()

    # Appliquer le filtre période sur les executions
    if periode or (date_debut and date_fin):
        execution_qs = ExecutionTest.objects.all()
        execution_qs = filter_by_user_permissions(execution_qs, request.user)
        execution_qs = apply_period_filter(execution_qs, periode, date_debut, date_fin)
        execution_ids = execution_qs.values_list('id', flat=True)
        resultats = resultats.filter(execution__id__in=execution_ids)
    else:
        # Filtrer par permissions utilisateur même sans période
        execution_qs = ExecutionTest.objects.all()
        execution_qs = filter_by_user_permissions(execution_qs, request.user)
        execution_ids = execution_qs.values_list('id', flat=True)
        resultats = resultats.filter(execution__id__in=execution_ids)

    if start_date and end_date:
        try:
            # Inclure toute la journée de end_date jusqu'à 23h59
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            resultats = resultats.filter(execution__started_at__range=(start_dt, end_dt))
        except ValueError:
            return JsonResponse(
                {"error": "Format de date invalide. Format attendu : YYYY-MM-DD"},
                status=400
            )

    data = []
    for resultat in resultats.order_by("execution__configuration__nom", "script__nom"):
        configuration_nom = getattr(resultat.execution.configuration, "nom", "")
        script_nom = getattr(resultat.script, "nom", "")
        statut = resultat.resultat_interprete

        data.append({
            "configuration": configuration_nom,
            "script": script_nom,
            "statut": statut,
        })

    return JsonResponse(data, safe=False)


# 
from django.shortcuts import render

def statistiques_tests_view(request):
    total_tests = ExecutionTest.objects.count()
    total_concluants = ExecutionTest.objects.filter(statut='done').count()
    total_non_concluants = ExecutionTest.objects.filter(statut='error').count()
    total_en_attente = ExecutionTest.objects.filter(statut='pending').count()

    context = {
        'total_tests': total_tests,
        'total_concluants': total_concluants,
        'total_non_concluants': total_non_concluants,
        'total_en_attente': total_en_attente,
    }

    return render(request, 'core/statistiques_tests.html', context)

# Ajoutez cette vue dans core/stats_views.py

@api_view(["GET"])
def configurations_actives(request):
    """
    API pour récupérer les configurations de test actives
    avec filtrage par permissions utilisateur
    """
    try:
        # Récupérer les paramètres de filtrage
        projet_id = request.GET.get("projet_id")
        societe_id = request.GET.get("societe_id")
        periodicite = request.GET.get("periodicite")
        
        # Base queryset - seulement les configurations actives
        qs = ConfigurationTest.objects.filter(is_active=True)
        
        # Appliquer le filtre par permissions utilisateur
        user = request.user
        if not user.is_superuser:
            # Utilisateur normal ne voit que les configurations de ses projets
            projets_ids = Projet.objects.filter(charge_de_compte=user).values_list("id", flat=True)
            qs = qs.filter(projet__id__in=projets_ids)
        
        # Appliquer les filtres supplémentaires
        if projet_id:
            qs = qs.filter(projet__id=projet_id)
            
        if societe_id:
            qs = qs.filter(societe__id=societe_id)
            
        if periodicite:
            qs = qs.filter(periodicite=periodicite)
        
        # Préparer les données de réponse
        configurations_data = []
        for config in qs.select_related('projet', 'societe').prefetch_related('scripts', 'emails_notification'):
            # Calculer la prochaine exécution
            next_execution = config.get_next_execution_time()
            time_until_execution = None
            if next_execution:
                time_until_execution = int((next_execution - timezone.now()).total_seconds())
            
            # Vérifier si en retard
            is_overdue = False
            delay_seconds = 0
            if config.last_execution:
                expected_next = config.last_execution + config.get_periodicite_timedelta()
                if timezone.now() > expected_next:
                    is_overdue = True
                    delay_seconds = int((timezone.now() - expected_next).total_seconds())
            
            # Récupérer les emails actifs
            emails_count = config.emails_notification.filter(est_actif=True).count()
            
            configurations_data.append({
                "id": config.id,
                "nom": config.nom,
                "projet": {
                    "id": config.projet.id,
                    "nom": config.projet.nom
                },
                "societe": {
                    "id": config.societe.id,
                    "nom": config.societe.nom
                },
                "periodicite": config.periodicite,
                "periodicite_display": config.get_periodicite_display(),
                "scripts": [
                    {
                        "id": script.id,
                        "nom": script.nom,
                        # Supprimer la description si elle n'existe pas
                        # "description": getattr(script, 'description', '') or ""
                    } for script in config.scripts.all()
                ],
                "last_execution": config.last_execution.isoformat() if config.last_execution else None,
                "date_activation": config.date_activation.isoformat() if config.date_activation else None,
                "date_desactivation": config.date_desactivation.isoformat() if config.date_desactivation else None,
                "next_execution": next_execution.isoformat() if next_execution else None,
                "time_until_execution_seconds": time_until_execution,
                "is_overdue": is_overdue,
                "delay_seconds": delay_seconds,
                "emails_count": emails_count,
                "date_creation": config.date_creation.isoformat(),
                "date_modification": config.date_modification.isoformat()
            })
        
        # Statistiques globales
        stats = {
            "total_configurations": len(configurations_data),
            "configurations_en_retard": len([c for c in configurations_data if c["is_overdue"]]),
            "repartition_periodicite": dict(qs.values_list('periodicite').annotate(count=Count('id'))),
            "prochaines_executions_24h": len([c for c in configurations_data if c["time_until_execution_seconds"] and c["time_until_execution_seconds"] <= 86400])
        }
        
        return Response({
            "configurations": configurations_data,
            "stats": stats,
            "filters_applied": {
                "projet_id": projet_id,
                "societe_id": societe_id,
                "periodicite": periodicite
            }
        })
        
    except Exception as e:
        logger.error(f"Erreur dans configurations_actives: {str(e)}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        return Response({"error": f"Erreur interne du serveur: {str(e)}"}, status=500)


@api_view(["GET"])
def configurations_statistiques(request):
    """
    API pour récupérer les statistiques des configurations actives
    """
    try:
        user = request.user
        
        # Base queryset - seulement les configurations actives
        qs = ConfigurationTest.objects.filter(is_active=True)
        
        # Appliquer le filtre par permissions utilisateur
        if not user.is_superuser:
            projets_ids = Projet.objects.filter(charge_de_compte=user).values_list("id", flat=True)
            qs = qs.filter(projet__id__in=projets_ids)
        
        # Statistiques par périodicité
        stats_periodicite = []
        for periodicite, label in ConfigurationTest.PERIODICITE_CHOICES:
            count = qs.filter(periodicite=periodicite).count()
            if count > 0:
                stats_periodicite.append({
                    "periodicite": periodicite,
                    "label": label,
                    "count": count
                })
        
        # Configurations en retard
        configurations_en_retard = []
        for config in qs:
            if config.last_execution:
                expected_next = config.last_execution + config.get_periodicite_timedelta()
                if timezone.now() > expected_next:
                    configurations_en_retard.append({
                        "id": config.id,
                        "nom": config.nom,
                        "projet": config.projet.nom,
                        "periodicite": config.periodicite,
                        "last_execution": config.last_execution,
                        "expected_next": expected_next,
                        "delay_hours": int((timezone.now() - expected_next).total_seconds() / 3600)
                    })
        
        # Prochaines exécutions dans les 24h
        prochaines_24h = []
        for config in qs:
            next_execution = config.get_next_execution_time()
            if next_execution:
                time_until = (next_execution - timezone.now()).total_seconds()
                if 0 <= time_until <= 86400:  # Dans les 24h
                    prochaines_24h.append({
                        "id": config.id,
                        "nom": config.nom,
                        "projet": config.projet.nom,
                        "next_execution": next_execution,
                        "time_until_hours": int(time_until / 3600)
                    })
        
        return Response({
            "total_configurations": qs.count(),
            "stats_periodicite": stats_periodicite,
            "configurations_en_retard": {
                "count": len(configurations_en_retard),
                "details": configurations_en_retard[:10]  # Limiter à 10 pour éviter trop de données
            },
            "prochaines_24h": {
                "count": len(prochaines_24h),
                "details": sorted(prochaines_24h, key=lambda x: x["time_until_hours"])[:10]
            },
            "repartition_par_projet": list(
                qs.values('projet__nom')
                .annotate(count=Count('id'))
                .order_by('-count')
            )
        })
        
    except Exception as e:
        logger.error(f"Erreur dans configurations_statistiques: {str(e)}")
        return Response({"error": "Erreur interne du serveur"}, status=500)