from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    CustomUser, Axe, SousAxe, Script, Projet,
    ConfigurationTest, ExecutionTest, EmailNotification
)
from django.utils.html import format_html
from io import BytesIO
from django.utils.timezone import localtime
import openpyxl
from django.http import HttpResponse
import logging
from core.utils.redmine import get_last_redmine_tickets

admin.site.site_header = "Snapflow Software Monitoring"
admin.site.site_title = "Snapflow Admin"
admin.site.index_title = "Tableau de bord"

logger = logging.getLogger(__name__)

from django.urls import path, reverse
from django.template.response import TemplateResponse

class ProjetAdminWithRedmine(admin.ModelAdmin):

    fields = (
        'nom',
        'id_redmine',
        'id_redmine_charge_de_compte',
        'redmine_slug',
        'url',
        'logo',
        'contrat',
        'charge_de_compte',
    )
    list_display = ('nom', 'id_redmine','id_redmine_charge_de_compte', 'redmine_slug', 'url', 'lien_tickets_redmine')

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                'tickets-redmine/',
                self.admin_site.admin_view(self.redmine_tickets_view),
                name='tickets-redmine'
            ),
        ]
        return custom_urls + urls

    def redmine_tickets_view(self, request):
        # Récupérer le paramètre GET projet_id s'il existe
        projet_id = request.GET.get('projet_id')

        # Récupérer tous les projets Redmine avec id_redmine non nul
        projets = Projet.objects.filter(id_redmine__isnull=False).exclude(id_redmine__exact='')

        # Si l'utilisateur n'est pas superuser, on filtre par charge_de_compte
        if not request.user.is_superuser:
            projets = projets.filter(charge_de_compte=request.user)

        # Si projet_id est donné, on filtre encore plus précisément
        if projet_id:
            projets = projets.filter(id=projet_id)

        tickets = []
        for projet in projets:
            try:
                project_id = int(projet.id_redmine)
                projet_tickets = get_last_redmine_tickets(project_id)
                for ticket in projet_tickets:
                    ticket['projet_nom'] = projet.nom
                tickets.extend(projet_tickets)
            except Exception as e:
                logger.error(f"Erreur pour le projet {projet.nom}: {str(e)}")
                continue

        context = dict(
            self.admin_site.each_context(request),
            title="Derniers tickets Redmine",
            tickets=tickets,
            projets=projets,
            selected_projet_id=projet_id or "",
        )
        return TemplateResponse(request, "admin/redmine_tickets.html", context)

    
    def lien_tickets_redmine(self, obj):
        url = reverse('admin:core_projet_redmine-tickets')
        return format_html('<a href="{}">Voir Tickets Redmine</a>', url)
    lien_tickets_redmine.short_description = "Tickets Redmine"


# On désenregistre Projet si déjà enregistré avec un autre admin
try:
    admin.site.unregister(Projet)
except admin.sites.NotRegistered:
    pass

# On enregistre Projet avec ce ModelAdmin custom
# admin.site.register(Projet, ProjetAdminWithRedmine)


# === Admin classique pour Projet ===
@admin.register(Projet)
class ProjetAdmin(admin.ModelAdmin):
    list_display = ('nom', 'id_redmine', 'redmine_slug', 'url', 'charge_de_compte', 'lien_tickets_redmine')
    search_fields = ('nom', 'id_redmine')
    list_filter = ('charge_de_compte',)
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                'tickets-redmine/',
                self.admin_site.admin_view(self.redmine_tickets_view),
                name='tickets-redmine'
            ),
        ]
        return custom_urls + urls

    def redmine_tickets_view(self, request):
        projets = Projet.objects.filter(id_redmine__isnull=False)

        tickets = []
        for projet in projets:
            try:
                project_id = int(projet.id_redmine)
                projet_tickets = get_last_redmine_tickets(project_id)
                for ticket in projet_tickets:
                    ticket['projet_nom'] = projet.nom
                tickets.extend(projet_tickets)
            except Exception as e:
                logger.error(f"Erreur pour le projet {projet.nom}: {str(e)}")
                continue

        context = dict(
            self.admin_site.each_context(request),
            title="Derniers tickets Redmine",
            tickets=tickets,
        )
        return TemplateResponse(request, "admin/redmine_tickets.html", context)
    
    def lien_tickets_redmine(self, obj):
        url = reverse('admin:tickets-redmine')
        return format_html('<a href="{}">Voir Tickets Redmine</a>', url)
    lien_tickets_redmine.short_description = "Tickets Redmine"
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs  # le superadmin voit tout
        return qs.filter(charge_de_compte=request.user)
    
    
    


@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    model = CustomUser
    list_display = ('email', 'first_name', 'last_name', 'is_staff')
    list_filter = ('is_staff', 'is_superuser')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ("Informations personnelles", {'fields': ('first_name', 'last_name')}),
        ("Permissions", {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ("Dates importantes", {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2')}
        ),
    )


@admin.register(Axe)
class AxeAdmin(admin.ModelAdmin):
    list_display = ('nom', 'description')
    search_fields = ('nom',)


@admin.register(SousAxe)
class SousAxeAdmin(admin.ModelAdmin):
    list_display = ('nom', 'description', 'axe')
    list_filter = ('axe',)
    search_fields = ('nom', 'description')


@admin.register(Script)
class ScriptAdmin(admin.ModelAdmin):
    list_display = ('axe', 'sous_axe', 'nom', 'afficher_fichier')
    list_filter = ('axe', 'sous_axe')
    search_fields = ('nom',)
    fields = ('axe', 'sous_axe', 'nom', 'fichier')

    def afficher_fichier(self, obj):
        return format_html('<a href="{}" download>Télécharger</a>', obj.fichier.url) if obj.fichier else '-'
    afficher_fichier.short_description = 'Fichier'


@admin.register(ConfigurationTest)
class ConfigurationTestAdmin(admin.ModelAdmin):
    change_list_template = "admin/ConfigurationTestAdmin.html" 
    list_display = ('nom', 'projet', 'periodicite', 'is_active', 'afficher_scripts_lies')
    list_filter = ('projet','is_active', 'periodicite')
    search_fields = ('nom',)
    filter_horizontal = ('scripts',)
    actions = ['activer_configurations', 'desactiver_configurations']
    actions_on_top = True
    autocomplete_fields = ['projet']

    fieldsets = (
        ("Informations générales", {
            'fields': ('nom', 'projet', 'is_active', 'periodicite')
        }),
        ("Sélection des scripts", {
            'fields': ('scripts',)
        }),
        ("Notification", {
            'fields': ('emails_notification',),
        }),
    )
    filter_horizontal = ('scripts',)

    def afficher_scripts_lies(self, obj):
        scripts = obj.scripts.all()
        return format_html("<br>".join(
            f"{s.axe.nom if s.axe else '-'} / {s.sous_axe.nom if s.sous_axe else '-'} / <strong>{s.nom}</strong>"
            for s in scripts
        )) or "-"
    afficher_scripts_lies.short_description = "Scripts liés"

    def activer_configurations(self, request, queryset):
        updated = queryset.update(is_active=True)
        self.message_user(request, f"{updated} configuration(s) activée(s).")
    activer_configurations.short_description = "✅ Activer les configurations sélectionnées"

    def desactiver_configurations(self, request, queryset):
        updated = queryset.update(is_active=False)
        self.message_user(request, f"{updated} configuration(s) désactivée(s).")
    desactiver_configurations.short_description = "❌ Désactiver les configurations sélectionnées"
    
    # ✅ Injecter les projets dans le contexte du template
    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        from .models import Projet  # ou adapter l'import
        extra_context['projets'] = Projet.objects.all()
        return super().changelist_view(request, extra_context=extra_context)

    # ✅ Filtrer par projet si présent dans l'URL
    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        projet_id = request.GET.get("projet")
        if projet_id:
            queryset = queryset.filter(projet_id=projet_id)
        return queryset

# Filtrer par projet 
from django.contrib.admin import SimpleListFilter
from .models import Projet  

class ProjetFilter(SimpleListFilter):
    title = 'Projet'
    parameter_name = 'projet'

    def lookups(self, request, model_admin):
        projets = Projet.objects.all()
        return [(p.id, p.nom) for p in projets]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(configuration__projet__id=self.value())
        return queryset


@admin.register(ExecutionTest)
class ExecutionTestAdmin(admin.ModelAdmin):
    change_list_template = "admin/executiontestadmin.html"  # 👈 important
    list_display = ('configuration','projet', 'statut', 'started_at', 'ended_at', 'lien_log_excel')
    list_filter = (ProjetFilter,'statut', 'started_at')
    readonly_fields = ('rapport', 'log_fichier')
    actions = ['exporter_excel']

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['projets'] = Projet.objects.all()

        projet_id = request.GET.get('projet')
        if projet_id:
            self.queryset = lambda req: super().get_queryset(req).filter(configuration__projet__id=projet_id)
        else:
            self.queryset = lambda req: super().get_queryset(req)

        return super().changelist_view(request, extra_context=extra_context)
    
    def projet(self, obj):
        return obj.configuration.projet.nom if obj.configuration and obj.configuration.projet else '-'
    projet.short_description = 'Projet' 

    def lien_log_excel(self, obj):
        if obj.log_fichier and obj.log_fichier.url.endswith('.xlsx'):
            return format_html('<a href="{}" download>Télécharger log</a>', obj.log_fichier.url)
        elif obj.log_fichier:
            return format_html('<a href="{}" download>Télécharger log (TXT)</a>', obj.log_fichier.url)
        return '-'
    lien_log_excel.short_description = 'Télécharger log'

    def exporter_excel(self, request, queryset):
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Logs de test"

        headers = ['ID Projet', 'Nom Projet', 'Nom Script', 'Date du jour', 'État du test', 'Ticket Redmine']
        ws.append(headers)

        for execution in queryset:
            configuration = execution.configuration
            projet = configuration.projet
            scripts = configuration.scripts.all()

            ticket_url = execution.ticket_redmine_id or ''  # Récupération du ticket Redmine

            for script in scripts:
                ws.append([
                    projet.id if projet else '',
                    projet.nom if projet else '',
                    script.nom,
                    localtime(execution.started_at).strftime('%d-%m-%Y %H:%M'),
                    execution.statut,
                    ticket_url,  # Ticket Redmine ID affiché ici
                ])

        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        filename = "export_execution_tests.xlsx"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        buffer = BytesIO()
        wb.save(buffer)
        response.write(buffer.getvalue())
        return response

    exporter_excel.short_description = "📤 Exporter les logs en Excel"


@admin.register(EmailNotification)
class EmailNotificationAdmin(admin.ModelAdmin):
    list_display = ('email',)
    search_fields = ('email',)




from django.urls import path
from django.template.response import TemplateResponse
from django.conf import settings
import requests
import logging

logger = logging.getLogger(__name__)

class TicketRedmine:
    def __init__(self, id, sujet, url, projet_nom):
        self.id = id
        self.sujet = sujet
        self.url = url
        self.projet_nom = projet_nom

class TicketRedmineAdminView:
    def get_urls(self):
        return [
            path("tickets-redmine/", self.admin_site.admin_view(self.ticket_redmine_view), name="tickets-redmine"),
        ]

    def __init__(self, admin_site):
        self.admin_site = admin_site
        admin_site.get_urls = self.get_urls_wrapper(admin_site.get_urls)

    def get_urls_wrapper(self, original_get_urls):
        def wrapped():
            return self.get_urls() + original_get_urls()
        return wrapped

    def ticket_redmine_view(self, request):
        projets = Projet.objects.filter(id_redmine__isnull=False)
        tickets = []

        for projet in projets:
            try:
                id_redmine = int(projet.id_redmine)
                url = f"{settings.REDMINE_URL}/projects/{id_redmine}/issues.json?limit=10&sort=updated_on:desc"
                headers = {"X-Redmine-API-Key": settings.REDMINE_API_KEY}
                response = requests.get(url, headers=headers)
                response.raise_for_status()
                issues = response.json().get("issues", [])

                for issue in issues:
                    issue_id = issue.get("id")
                    detail_url = f"{settings.REDMINE_URL}/issues/{issue_id}.json"
                    detail_response = requests.get(detail_url, headers=headers)
                    detail_response.raise_for_status()
                    issue_detail = detail_response.json().get("issue", {})

                    # Chercher le champ personnalisé "ID PROJET"
                    champ_id_projet = None
                    for field in issue_detail.get("custom_fields", []):
                        if field.get("name") == "ID PROJET":
                            champ_id_projet = field.get("value")

                    tickets.append({
                        "sujet": issue.get("subject", "(Pas de sujet)"),
                        "url": f"{settings.REDMINE_URL}/issues/{issue_id}",
                        "projet_nom": projet.nom,
                        "statut": issue.get("status", {}).get("name", "Inconnu"),
                        "priorite": issue.get("priority", {}).get("name", "Inconnue"),
                        "id_redmine": projet.id_redmine,
                        "champ_id_projet": champ_id_projet,
                    })

            except (ValueError, TypeError):
                continue
            except Exception as e:
                logger.error(f"Erreur pour {projet.nom} : {str(e)}")

        context = dict(
            self.admin_site.each_context(request),
            title="Tickets Redmine",
            tickets=tickets
        )
        return TemplateResponse(request, "admin/redmine_tickets.html", context)



TicketRedmineAdminView(admin.site)

# Dashboard

from django.contrib import admin
from django.urls import reverse
from django.shortcuts import redirect
from django.template.response import TemplateResponse
from .models import Dashboard, Projet  # 👈 n'oublie Projet ici !

class DashboardAdmin(admin.ModelAdmin):
    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        user = request.user

        # 🔎 Filtrer les projets accessibles à l'utilisateur
        projets = Projet.objects.all() if user.is_superuser else Projet.objects.filter(charge_de_compte=user)

        # 🔁 Récupérer le projet sélectionné depuis la requête GET
        projet_id = request.GET.get("projet")
        selected_projet = None
        if projet_id:
            try:
                selected_projet = projets.get(id=projet_id)
            except Projet.DoesNotExist:
                selected_projet = None

        context = dict(
            self.admin_site.each_context(request),
            title="Dashboard",
            projets=projets,
            selected_projet=selected_projet,
            **extra_context
        )
        return TemplateResponse(request, "admin/dashboard.html", context)

    def has_module_permission(self, request):
        return True

    def has_view_permission(self, request, obj=None):
        return True

    def has_add_permission(self, request):
        return request.user.is_superuser

    def has_change_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if obj is None:
            return True
        return obj.charge_de_compte == request.user

    def has_delete_permission(self, request, obj=None):
        return self.has_change_permission(request, obj)

admin.site.register(Dashboard, DashboardAdmin)

# Vue globale
from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html
from .models import VueGlobale

class VueGlobaleAdmin(admin.ModelAdmin):
    def changelist_view(self, request, extra_context=None):
        from django.shortcuts import redirect
        return redirect(reverse('vue_globale'))  # <== le nom de ta vue

# Enregistre le fake model
admin.site.register(VueGlobale, VueGlobaleAdmin)

