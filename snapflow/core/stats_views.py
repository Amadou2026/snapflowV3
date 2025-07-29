# core/stats_views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.db.models import Count, Q
from django.db.models.functions import TruncDate
from .models import *

@api_view(['GET'])
def tests_par_jour(request):
    projet_id = request.GET.get('projet_id')
    qs = ExecutionTest.objects.all()
    if projet_id:
        qs = qs.filter(configuration__projet__id=projet_id)

    data = (
        qs.annotate(date=TruncDate('started_at'))
        .values('date')
        .annotate(total=Count('id'))
        .order_by('date')
    )
    return Response(list(data))


@api_view(['GET'])
def success_vs_failed_par_jour(request):
    projet_id = request.GET.get('projet_id')
    qs = ExecutionTest.objects.all()
    if projet_id:
        qs = qs.filter(configuration__projet__id=projet_id)

    data = (
        qs.annotate(date=TruncDate('started_at'))
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
            pass

    response = [
        {"date": date, "succès": counts["succès"], "échec": counts["échec"]}
        for date, counts in sorted(result.items())
    ]

    return Response(response)


@api_view(['GET'])
def tests_par_projet(request):
    # Pas besoin de filtre projet ici, on liste tous
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
    projet_id = request.GET.get('projet_id')
    qs = ExecutionTest.objects.all()
    if projet_id:
        qs = qs.filter(configuration__projet__id=projet_id)

    data = (
        qs.values('configuration__scripts__nom')
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
    projet_id = request.GET.get('projet_id')
    qs = ExecutionTest.objects.all()
    if projet_id:
        qs = qs.filter(configuration__projet__id=projet_id)

    total = qs.count()
    success = qs.filter(statut__in=["done", "succès", "success"]).count()  # succès possibles multiples
    echec = qs.filter(statut__in=["error", "échec", "fail", "failure"]).count()

    taux = (success / total * 100) if total > 0 else 0

    return Response({
        "total": total,
        "succès": success,
        "échec": echec,
        "taux_reussite": round(taux, 2)
    })


@api_view(['GET'])
def repartition_par_projet(request):
    projet_id = request.GET.get('projet_id')
    qs = ExecutionTest.objects.all()
    if projet_id:
        qs = qs.filter(configuration__projet__id=projet_id)

    projets = (
        qs.values('configuration__projet__nom')
        .annotate(total=Count('id'))
        .order_by('-total')
    )
    projet_labels = [row['configuration__projet__nom'] for row in projets]
    projet_counts = [row['total'] for row in projets]

    return Response({
        "projet_labels": projet_labels,
        "projet_counts": projet_counts
    })
