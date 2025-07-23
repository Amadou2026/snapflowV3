from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import *
from .serializers import *

from django.db.models.functions import TruncDate
from django.db.models import Count, Q
from django.shortcuts import render

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
        token['email'] = user.email
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
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


class ConfigurationTestViewSet(viewsets.ModelViewSet):
    queryset = ConfigurationTest.objects.all()
    serializer_class = ConfigurationTestSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'], url_path='activate')
    def activate(self, request, pk=None):
        config = self.get_object()
        config.is_active = True
        config.save()
        return Response({'status': 'activated'}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='deactivate')
    def deactivate(self, request, pk=None):
        config = self.get_object()
        config.is_active = False
        config.save()
        return Response({'status': 'deactivated'}, status=status.HTTP_200_OK)


class ExecutionTestViewSet(viewsets.ModelViewSet):
    queryset = ExecutionTest.objects.all()
    serializer_class = ExecutionTestSerializer
    permission_classes = [IsAuthenticated]

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
        p.drawString(30, height - 30, f"Rapport d'exécution: {execution.configuration.nom}")
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
        return FileResponse(buffer, as_attachment=True, filename=f"rapport_{execution.id}.pdf")
    
def dashboard_view(request):
    # Graphe 1 - Tests par jour
    tests_par_jour = (
        ExecutionTest.objects
        .annotate(date=TruncDate('started_at'))
        .values('date')
        .annotate(total=Count('id'))
        .order_by('date')
    )
    labels = [str(entry["date"]) for entry in tests_par_jour]
    values = [entry["total"] for entry in tests_par_jour]

    # Graphe 2 - Succès vs Échec par jour
    success_fail = (
        ExecutionTest.objects
        .annotate(date=TruncDate('started_at'))
        .values('date', 'statut')
        .annotate(total=Count('id'))
        .order_by('date')
    )
    sf_result = {}
    for row in success_fail:
        date = str(row['date'])
        statut = row['statut'] or "inconnu"
        count = row['total']
        if date not in sf_result:
            sf_result[date] = {"succès": 0, "échec": 0}
        sf_result[date][statut] = count

    sf_labels = list(sf_result.keys())
    sf_success = [sf_result[d].get("succès", 0) for d in sf_labels]
    sf_fail = [sf_result[d].get("échec", 0) for d in sf_labels]

    # Graphe 3 - Répartition par projet
    projets = (
        ExecutionTest.objects
        .values('configuration__projet__nom')
        .annotate(total=Count('id'))
        .order_by('-total')
    )
    projet_labels = [row['configuration__projet__nom'] for row in projets]
    projet_counts = [row['total'] for row in projets]

    # KPI taux de réussite
    total = ExecutionTest.objects.count()
    success = ExecutionTest.objects.filter(statut="succès").count()
    taux_reussite = round((success / total * 100), 2) if total > 0 else 0

    # Graphe 4 - Taux d'erreur par script
    erreurs_data = (
        ExecutionTest.objects
        .values('configuration__scripts__nom')
        .annotate(
            total=Count('id'),
            erreurs=Count('id', filter=Q(statut='error'))
        )
        .order_by('-erreurs')
    )
    erreurs_labels = []
    erreurs_counts = []
    for d in erreurs_data:
        erreurs_labels.append(d['configuration__scripts__nom'] or 'Sans script')
        erreurs_counts.append(d['erreurs'])

    # Total test
    total_tests = ExecutionTest.objects.count()
    return render(request, 'admin/dashboard.html', {
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
    })