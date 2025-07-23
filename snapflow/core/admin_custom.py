# from venv import logger
# from django.urls import path
# from django.template.response import TemplateResponse
# from django.conf import settings
# import requests

# from core.admin import admin
# from .models import Projet
# import logging

# class MonAdminSite(admin.AdminSite):
#     def get_urls(self):
#         urls = super().get_urls()
#         custom_urls = [
#             path("redmine-tickets/", self.admin_view(self.redmine_tickets_view), name="redmine-tickets"),
#         ]
#         return custom_urls + urls

#     def redmine_tickets_view(self, request):
#         projets = Projet.objects.filter(id_redmine__isnull=False).exclude(id_redmine__in=[""])
#         tickets = []

#         for projet in projets:
#             try:
#                 id_redmine = int(projet.id_redmine)
#             except (ValueError, TypeError):
#                 logger.warning(f"Projet {projet.nom} a un id_redmine invalide : {projet.id_redmine}")
#                 continue

#             try:
#                 url = f"{settings.REDMINE_URL}/projects/{id_redmine}/issues.json?limit=10&sort=updated_on:desc"
#                 headers = {"X-Redmine-API-Key": settings.REDMINE_API_KEY}
#                 response = requests.get(url, headers=headers)
#                 response.raise_for_status()
#                 issues = response.json().get("issues", [])
#                 for issue in issues:
#                     issue['url'] = f"{settings.REDMINE_URL}/issues/{issue['id']}"
#                     issue['projet_nom'] = projet.nom
#                     tickets.append(issue)
#             except Exception as e:
#                 logger.error(f"Erreur lors de la récupération des tickets pour {projet.nom} : {str(e)}")

#         context = dict(
#             self.each_context(request),
#             title="Derniers tickets Redmine",
#             tickets=tickets,
#         )
#         return TemplateResponse(request, "admin/redmine_tickets.html", context)