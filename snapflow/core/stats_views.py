# core/stats_views.py
from django.http import JsonResponse
from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from .models import *
from core.models import ExecutionTest  # adapte le nom selon ton app


from collections import defaultdict


@api_view(["GET"])
def tests_par_jour(request):
    projet_id = request.GET.get("projet_id")
    qs = ExecutionTest.objects.all()

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
    qs = ExecutionTest.objects.all()
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
        date_str = row["date"].strftime("%d-%m-%Y")  # format string pour JSON
        statut = row["statut"] or "inconnu"
        count = row["total"]
        if date_str not in result:
            result[date_str] = {"succès": 0, "échec": 0}
        # On mappe le statut en "succès" ou "échec"
        if statut.lower() in ["done", "succès", "success"]:
            result[date_str]["succès"] = count
        elif statut.lower() in ["error", "échec", "fail", "failure"]:
            result[date_str]["échec"] = count
        else:
            pass

    response = [
        {"date": date, "succès": counts["succès"], "échec": counts["échec"]}
        for date, counts in sorted(result.items())
    ]

    return Response(response)


@api_view(["GET"])
def tests_par_projet(request):
    # Pas besoin de filtre projet ici, on liste tous
    data = (
        ExecutionTest.objects.values("configuration__projet__nom")
        .annotate(total=Count("id"))
        .order_by("-total")
    )

    result = [
        {"projet": row["configuration__projet__nom"], "total": row["total"]}
        for row in data
    ]
    return Response(result)


@api_view(["GET"])
def taux_erreur_par_script(request):
    projet_id = request.GET.get("projet_id")
    qs = ExecutionTest.objects.all()
    if projet_id:
        qs = qs.filter(configuration__projet__id=projet_id)

    data = (
        qs.values("configuration__scripts__nom")
        .annotate(total=Count("id"), erreurs=Count("id", filter=Q(statut="error")))
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
    qs = ExecutionTest.objects.all()
    if projet_id:
        qs = qs.filter(configuration__projet__id=projet_id)

    total = qs.count()
    success = qs.filter(
        statut__in=["done", "succès", "success"]
    ).count()  # succès possibles multiples
    echec = qs.filter(statut__in=["error", "échec", "fail", "failure"]).count()

    taux = (success / total * 100) if total > 0 else 0

    return Response(
        {
            "total": total,
            "succès": success,
            "échec": echec,
            "taux_reussite": round(taux, 2),
        }
    )


# Debut
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count
from .models import ExecutionTest

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def repartition_par_projet(request):
    projet_id = request.GET.get("projet_id")
    qs = ExecutionTest.objects.all()
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

from django.http import JsonResponse
from django.utils import timezone
from datetime import datetime, timedelta
from django.db.models import Count, Q
import logging

from .models import Projet

logger = logging.getLogger(__name__)


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


def apply_period_filter(queryset, periode):
    """Fonction helper pour appliquer le filtre de période"""
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
        date_debut = aujourd_hui - timedelta(days=30)  # défaut mois
    
    return queryset.filter(started_at__gte=date_debut)



# ✅ Nouvelle API pour debug
@api_view(["GET"])
def debug_filters(request):
    """API de debug pour vérifier les filtres"""
    projet_id = request.GET.get("projet_id")
    periode = request.GET.get("periode", "mois")
    
    qs = ExecutionTest.objects.all()
    
    total_avant_filtre = qs.count()
    
    if projet_id:
        qs = qs.filter(configuration__projet__id=projet_id)
    
    total_apres_projet = qs.count()
    
    qs = apply_period_filter(qs, periode)
    
    total_apres_periode = qs.count()
    
    return Response({
        "debug": {
            "projet_id": projet_id,
            "periode": periode,
            "total_avant_filtre": total_avant_filtre,
            "total_apres_projet": total_apres_projet,
            "total_apres_periode": total_apres_periode,
        }
    })
    


# //Tests non exécutés et non concluants
from django.http import JsonResponse
from django.db.models import Count, Q
from datetime import datetime, timedelta

def nombre_test_non_execute(request):
    projet_id = request.GET.get('projet_id')
    periodicite = request.GET.get('periodicite')
    axe_id = request.GET.get('axe_id')

    from core.models import ExecutionTest, Script

    queryset = ExecutionTest.objects.all()

    if projet_id:
        queryset = queryset.filter(configuration__projet_id=projet_id)

    if periodicite:
        queryset = queryset.filter(configuration__periodicite=periodicite)

    if axe_id:
        # On filtre sur les ExecutionTest dont au moins un script lié a l'axe donné
        queryset = queryset.filter(
            configuration__scripts__axe_id=axe_id
        ).distinct()

    # Filtre sur 30 derniers jours (à ajuster ou rendre paramétrable)
    today = datetime.now().date()
    start_date = today - timedelta(days=30)
    queryset = queryset.filter(started_at__date__gte=start_date)

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
            'date': r['started_at__date'].isoformat(),
            'non_execute': r['non_execute_count'],
            'non_concluant': r['non_concluant_count'],
        })

    return JsonResponse(data, safe=False)

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
from django.db.models import Count
from datetime import datetime
from core.models import ExecutionResult

@staff_member_required
def stats_execution_concluant_nonconcluant(request):
    start_date = request.GET.get("start_date")
    end_date = request.GET.get("end_date")

    resultats = ExecutionResult.objects.select_related(
        "execution__configuration", "script"
    ).all()

    if start_date and end_date:
        try:
            # Inclure toute la journée de end_date jusqu'à 23h59
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            end_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            resultats = resultats.filter(execution__started_at__range=(start_dt, end_dt))
        except ValueError:
            return JsonResponse({"error": "Format de date invalide. Format attendu : YYYY-MM-DD"}, status=400)

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
from .models import ExecutionTest

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

