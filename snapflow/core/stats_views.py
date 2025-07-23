# core/stats_views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from .models import *

@api_view(['GET'])
def tests_par_jour(request):
    data = (
        ExecutionTest.objects
        .annotate(date=TruncDate('started_at'))
        .values('date')
        .annotate(total=Count('id'))
        .order_by('date')
    )
    return Response(list(data))

@api_view(['GET'])
def success_vs_failed_par_jour(request):
    data = (
        ExecutionTest.objects
        .annotate(date=TruncDate('started_at'))
        .values('date', 'statut')
        .annotate(total=Count('id'))
        .order_by('date')
    )

    result = {}
    for row in data:
        date_str = row['date'].strftime('%d-%m-%Y')  # format string pour JSON
        statut = row['statut'] or "inconnu"
        count = row['total']
        if date_str not in result:
            result[date_str] = {"succès": 0, "échec": 0}
        # On mappe le statut en "succès" ou "échec"
        if statut.lower() in ["done", "succès", "success"]:
            result[date_str]["succès"] = count
        elif statut.lower() in ["error", "échec", "fail", "failure"]:
            result[date_str]["échec"] = count
        else:
            # si statut inconnu, on peut l'ignorer ou gérer séparément
            pass

    # Format réponse : liste triée par date
    response = [
        {"date": date, "succès": counts["succès"], "échec": counts["échec"]}
        for date, counts in sorted(result.items())
    ]

    return Response(response)

@api_view(['GET'])
def tests_par_projet(request):
    data = (
        ExecutionTest.objects
        .values('configuration__projet__nom')
        .annotate(total=Count('id'))
        .order_by('-total')
    )

    result = [
        {"projet": row["configuration__projet__nom"], "total": row["total"]}
        for row in data
    ]
    return Response(result)




@api_view(['GET'])
def taux_erreur_par_script(request):
    data = (
        ExecutionTest.objects
        .values('configuration__scripts__nom')
        .annotate(
            total=Count('id'),
            erreurs=Count('id', filter=Q(statut="error"))
        )
        .order_by('-erreurs')
    )

    result = [
        {
            "script": row["configuration__scripts__nom"] or "Sans script",
            "total": row["total"],
            "erreurs": row["erreurs"],
            "taux_erreur": round((row["erreurs"] / row["total"]) * 100, 2) if row["total"] else 0
        }
        for row in data
    ]

    return Response(result)


@api_view(['GET'])
def taux_reussite(request):
    total = ExecutionTest.objects.count()
    success = ExecutionTest.objects.filter(statut="done").count()  # 'done' = test réussi

    taux = (success / total * 100) if total > 0 else 0
    echec = ExecutionTest.objects.filter(statut="error").count()
    return Response({
    "total": total,
    "succès": success,
    "échec": echec,
    "taux_reussite": round(taux, 2)
    })
    
@api_view(['GET'])
def repartition_par_projet(request):
    projets = (
        ExecutionTest.objects
        .values('configuration__projet__nom')
        .annotate(total=Count('id'))
        .order_by('-total')
    )
    projet_labels = [row['configuration__projet__nom'] for row in projets]
    projet_counts = [row['total'] for row in projets]

    return Response({
        "projet_labels": projet_labels,
        "projet_counts": projet_counts
    })