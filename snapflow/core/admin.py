from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    CustomUser, Axe, Dashboard, SousAxe, Script, Projet,
    ConfigurationTest, ExecutionTest, EmailNotification, VueGlobale
)
from .models import *
from django.utils.html import format_html
from io import BytesIO

import openpyxl
from django.http import HttpResponse
import logging
from core.utils.redmine import get_last_redmine_tickets
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.timezone import make_aware, now, localtime


from django.conf import settings
import requests


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
            path(
                'vue-globale/',
                self.admin_site.admin_view(self.vue_globale_view),
                name='core_vue_globale'
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
    
    # Vue Globale
    @staff_member_required     
    def vue_globale_view(self, request):
        """Vue globale avec toutes les statistiques"""
        
        # Récupérer les projets accessibles
        if request.user.is_superuser:
            projets = Projet.objects.all()
        else:
            projets = Projet.objects.filter(charge_de_compte=request.user)
        
        # Debug: afficher le nombre de projets
        print(f"DEBUG: Nombre de projets trouvés: {projets.count()}")
        for p in projets:
            print(f"DEBUG: Projet - ID: {p.id}, Nom: {p.nom}")
        
        # Calculer les statistiques globales
        total_tests = ExecutionTest.objects.filter(
            configuration__projet__in=projets
        ).count()
        
        tests_echoues = ExecutionTest.objects.filter(
            configuration__projet__in=projets,
            statut='error'  # Utilisez 'error' selon votre models.py
        ).count()
        
        tests_reussis = ExecutionTest.objects.filter(
            configuration__projet__in=projets,
            statut='done'  # Utilisez 'done' selon votre models.py
        ).count()
        
        # Calculer les tests non fonctionnels
        non_fonctionnels = ExecutionTest.objects.filter(
            configuration__projet__in=projets,
            statut__in=['error', 'running', 'pending']
        ).count()
        
        # Calculer les stats par projet pour le tableau "Projets affectés"
        execution_tests_by_projet = {}
        for projet in projets:
            total_projet = ExecutionTest.objects.filter(configuration__projet=projet).count()
            success_projet = ExecutionTest.objects.filter(configuration__projet=projet, statut='done').count()
            fail_projet = ExecutionTest.objects.filter(configuration__projet=projet, statut='error').count()
            
            execution_tests_by_projet[projet.id] = {
                'total': total_projet,
                'success': success_projet,
                'fail': fail_projet,
            }
            
            # Debug pour chaque projet
            print(f"DEBUG: Projet {projet.nom} - Total: {total_projet}, Success: {success_projet}, Fail: {fail_projet}")
        
        # Statistiques pour affichage secondaire (optionnel)
        stats_par_projet = []
        for projet in projets:
            total_projet = execution_tests_by_projet[projet.id]['total']
            reussis_projet = execution_tests_by_projet[projet.id]['success']
            echoues_projet = execution_tests_by_projet[projet.id]['fail']
            
            stats_par_projet.append({
                'projet': projet,
                'total': total_projet,
                'reussis': reussis_projet,
                'echoues': echoues_projet,
                'taux_reussite': round((reussis_projet / total_projet * 100) if total_projet > 0 else 0, 2)
            })
        
        # Contexte pour le template
        context = dict(
            self.admin_site.each_context(request),
            title="Vue Globale - Statistiques des Tests",
            total_tests=total_tests,
            tests_reussis=tests_reussis,
            tests_echoues=tests_echoues,
            non_fonctionnels=non_fonctionnels,
            taux_reussite_global=round((tests_reussis / total_tests * 100) if total_tests > 0 else 0, 2),
            stats_par_projet=stats_par_projet,
            projets_utilisateur=projets,
            execution_tests_by_projet=execution_tests_by_projet,
            projets_count=projets.count(),
            # debug=True,  # Activez le debug temporairement
        )
        
        print(f"DEBUG: Contexte - projets_utilisateur count: {len(context['projets_utilisateur'])}")
        
        return TemplateResponse(request, "admin/vue-globale.html", context)


    
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

class ProjetFilter(admin.SimpleListFilter):
    title = 'Projet'
    parameter_name = 'configuration__projet'  # ✅ IMPORTANT : doit refléter le lookup réel

    def lookups(self, request, model_admin):
        projets = Projet.objects.all()
        return [(p.id, p.nom) for p in projets]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(configuration__projet__id=self.value())
        return queryset


from datetime import datetime, timedelta
from django.utils.timezone import make_aware
from django.utils.translation import gettext_lazy as _
from django.contrib.admin import SimpleListFilter

class StartedAtListFilter(SimpleListFilter):
    title = _('Date de début')
    parameter_name = 'started_at_range'

    def lookups(self, request, model_admin):
        return [
            ('today', _("Aujourd'hui")),
            ('last_7_days', _("7 derniers jours")),
            ('this_month', _("Ce mois-ci")),
            ('this_year', _("Cette année")),
            ('none', _("Aucune date")),
            ('has', _("Possède une date")),
        ]

    def queryset(self, request, queryset):
        value = self.value()
        now = datetime.now()

        if value == 'today':
            start = make_aware(datetime(now.year, now.month, now.day))
            end = make_aware(datetime(now.year, now.month, now.day, 23, 59, 59))
            return queryset.filter(started_at__range=(start, end))

        elif value == 'last_7_days':
            start = make_aware(now - timedelta(days=7))
            return queryset.filter(started_at__gte=start)

        elif value == 'this_month':
            start = make_aware(datetime(now.year, now.month, 1))
            return queryset.filter(started_at__gte=start)

        elif value == 'this_year':
            start = make_aware(datetime(now.year, 1, 1))
            return queryset.filter(started_at__gte=start)

        elif value == 'none':
            return queryset.filter(started_at__isnull=True)

        elif value == 'has':
            return queryset.exclude(started_at__isnull=True)

        return queryset


@admin.register(ExecutionTest)
class ExecutionTestAdmin(admin.ModelAdmin):
    change_list_template = "admin/executiontestadmin.html"
    list_display = ('configuration', 'projet', 'statut', 'started_at', 'ended_at', 'lien_log_excel')
    list_filter = (ProjetFilter, 'statut', StartedAtListFilter)
    readonly_fields = ('rapport', 'log_fichier')
    actions = ['exporter_excel']

    def get_queryset(self, request):
        queryset = super().get_queryset(request)

        projet_id = request.GET.get('configuration__projet')  # ✔️ Correspond au ProjetFilter
        if projet_id:
            queryset = queryset.filter(configuration__projet__id=projet_id)

        # Ce bloc reste utile uniquement si tu passes des dates via l'URL (filtrage JS par ex.)
        started_at_gte = request.GET.get('started_at__gte')
        started_at_lt = request.GET.get('started_at__lt')
        if started_at_gte and started_at_lt:
            try:
                dt_gte = make_aware(datetime.fromisoformat(started_at_gte))
                dt_lt = make_aware(datetime.fromisoformat(started_at_lt))
                queryset = queryset.filter(started_at__gte=dt_gte, started_at__lt=dt_lt)
            except Exception as e:
                print(f"[DEBUG] Erreur de parsing des dates : {e}")

        print(f"[DEBUG] Total tests filtrés : {queryset.count()}")
        return queryset

    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        extra_context['projets'] = Projet.objects.all()

        today = now().date()
        tomorrow = today + timedelta(days=1)
        extra_context['today_iso'] = today.isoformat()
        extra_context['tomorrow_iso'] = tomorrow.isoformat()

        queryset = self.get_queryset(request)
        extra_context['total_tests'] = queryset.count()

        return super().changelist_view(request, extra_context=extra_context)

    def projet(self, obj):
        return obj.configuration.projet.nom if obj.configuration and obj.configuration.projet else '-'
    projet.short_description = 'Projet'

    def lien_log_excel(self, obj):
        if obj.log_fichier:
            label = "Télécharger log"
            if obj.log_fichier.url.endswith('.xlsx'):
                label += " (Excel)"
            elif obj.log_fichier.url.endswith('.txt'):
                label += " (TXT)"
            return format_html('<a href="{}" download>{}</a>', obj.log_fichier.url, label)
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
            ticket_url = execution.ticket_redmine_id or ''

            for script in scripts:
                ws.append([
                    projet.id if projet else '',
                    projet.nom if projet else '',
                    script.nom,
                    localtime(execution.started_at).strftime('%d-%m-%Y %H:%M'),
                    execution.statut,
                    ticket_url,
                ])

        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = 'attachment; filename="export_execution_tests.xlsx"'

        buffer = BytesIO()
        wb.save(buffer)
        response.write(buffer.getvalue())
        return response

    exporter_excel.short_description = "📤 Exporter les logs en Excel"




@admin.register(EmailNotification)
class EmailNotificationAdmin(admin.ModelAdmin):
    list_display = ('email',)
    search_fields = ('email',)

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

from django.db.models import Count, Q
from django.db.models.functions import TruncDate

class DashboardAdmin(admin.ModelAdmin):
    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        user = request.user

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

        # Filtrer les projets accessibles à l'utilisateur
        projets = Projet.objects.all() if user.is_superuser else Projet.objects.filter(charge_de_compte=user)

        # Récupérer le projet sélectionné depuis la requête GET
        projet_id = request.GET.get("projet_id")  # Changé de "projet" à "projet_id"
        selected_projet_id = projet_id if projet_id else ""
        selected_projet = None
        
        if projet_id:
            try:
                selected_projet = projets.get(id=projet_id)
            except Projet.DoesNotExist:
                selected_projet = None

        # Récupérer les execution_tests
        if selected_projet:
            execution_tests = ExecutionTest.objects.filter(
                configuration__projet=selected_projet
            )
        else:
            if user.is_superuser:
                execution_tests = ExecutionTest.objects.all()
            else:
                execution_tests = ExecutionTest.objects.filter(
                    configuration__projet__charge_de_compte=user
                )

        # Calculer les données seulement si on a des tests
        if execution_tests.exists():
            # Graphe 1 : Tests par jour
            tests_par_jour = (
                execution_tests.annotate(date=TruncDate("started_at"))
                .values("date")
                .annotate(total=Count("id"))
                .order_by("date")
            )
            labels = [str(entry["date"]) for entry in tests_par_jour]
            values = [entry["total"] for entry in tests_par_jour]

            # Graphe 2 : Succès vs Échec
            success_fail = (
                execution_tests.annotate(date=TruncDate("started_at"))
                .values("date", "statut")
                .annotate(total=Count("id"))
                .order_by("date")
            )
            sf_result = {}
            for row in success_fail:
                date = str(row["date"])
                statut = (row["statut"] or "").lower()
                count = row["total"]
                if date not in sf_result:
                    sf_result[date] = {"succès": 0, "échec": 0}
                if statut in ["done", "succès", "success"]:
                    sf_result[date]["succès"] += count
                elif statut in ["error", "échec", "fail", "failure"]:
                    sf_result[date]["échec"] += count

            sf_labels = list(sf_result.keys())
            sf_success = [sf_result[d]["succès"] for d in sf_labels]
            sf_fail = [sf_result[d]["échec"] for d in sf_labels]

            # Graphe 3 : Répartition par projet
            projets_data = (
                execution_tests.values("configuration__projet__nom")
                .annotate(total=Count("id"))
                .order_by("-total")
            )
            projet_labels = [row["configuration__projet__nom"] for row in projets_data]
            projet_counts = [row["total"] for row in projets_data]

            # KPI
            total_tests = execution_tests.count()
            total_success = execution_tests.filter(
                statut__in=["done", "succès", "success"]
            ).count()
            taux_reussite = (
                round((total_success / total_tests) * 100, 2) if total_tests > 0 else 0
            )

            # Graphe 4 : Taux d'erreur par script
            erreurs_data = (
                execution_tests.values("configuration__scripts__nom")
                .annotate(
                    total=Count("id"),
                    erreurs=Count(
                        "id", filter=Q(statut__in=["error", "échec", "fail", "failure"])
                    ),
                )
                .order_by("-erreurs")
            )
            erreurs_labels = [
                d["configuration__scripts__nom"] or "Sans script" for d in erreurs_data
            ]
            erreurs_counts = [d["erreurs"] for d in erreurs_data]

            # Résumé par projet
            for p in projets:
                executions = ExecutionTest.objects.filter(configuration__projet=p)
                total = executions.count()
                fonctionnels = executions.filter(
                    statut__in=["done", "succès", "success"]
                ).count()
                non_fonctionnels = total - fonctionnels
                projets_resumes.append(
                    {
                        "id": p.id,
                        "nom": p.nom,
                        "total": total,
                        "fonctionnels": fonctionnels,
                        "non_fonctionnels": non_fonctionnels,
                    }
                )

        context = dict(
            self.admin_site.each_context(request),
            title="Dashboard",
            projets=projets,
            selected_projet=selected_projet,
            selected_projet_id=selected_projet_id,
            # Toutes les variables nécessaires au template
            labels=labels,
            values=values,
            sf_labels=sf_labels,
            sf_success=sf_success,
            sf_fail=sf_fail,
            projet_labels=projet_labels,
            projet_counts=projet_counts,
            taux_reussite=taux_reussite,
            erreurs_labels=erreurs_labels,
            erreurs_counts=erreurs_counts,
            total_tests=total_tests,
            non_fonctionnels=total_tests - total_success,
            projets_resumes=projets_resumes,
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

# Vue Globale Admin pour la sidebar

@admin.register(VueGlobale)
class VueGlobaleAdmin(admin.ModelAdmin):
    """
    Admin personnalisé pour afficher la Vue Globale dans la sidebar
    """
    
    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                '',
                self.admin_site.admin_view(self.vue_globale_view),
                name='core_vueglobale_changelist'
            ),
        ]
        return custom_urls + urls
    
    def vue_globale_view(self, request):
        """Vue globale avec toutes les statistiques"""
        # Récupérer les données selon les permissions de l'utilisateur
        if request.user.is_superuser:
            projets = Projet.objects.all()
        else:
            projets = Projet.objects.filter(charge_de_compte=request.user)
        
        # Debug
        print(f"DEBUG: Nombre de projets trouvés: {projets.count()}")
        for p in projets:
            print(f"DEBUG: Projet - ID: {p.id}, Nom: {p.nom}")
            
        # Calculer les statistiques globales
        total_tests = ExecutionTest.objects.filter(
            configuration__projet__in=projets
        ).count()
        
        
        # CORRECTION: Utiliser les bons statuts selon votre models.py
        tests_echoues = ExecutionTest.objects.filter(
            configuration__projet__in=projets,
            statut='error'  # Changé de 'FAILED' à 'error'
        ).count()
        
        tests_reussis = ExecutionTest.objects.filter(
            configuration__projet__in=projets,
            statut='done'  # Changé de 'SUCCESS' à 'done'
        ).count()
        
        # Calculer les tests non fonctionnels
        non_fonctionnels = ExecutionTest.objects.filter(
            configuration__projet__in=projets,
            statut__in=['error', 'running', 'pending']
        ).count()
        
        # AJOUT: Créer le dictionnaire execution_tests_by_projet que le template attend
        execution_tests_by_projet = {}
        for projet in projets:
            total_projet = ExecutionTest.objects.filter(configuration__projet=projet).count()
            success_projet = ExecutionTest.objects.filter(configuration__projet=projet, statut='done').count()
            fail_projet = ExecutionTest.objects.filter(configuration__projet=projet, statut='error').count()
            
            execution_tests_by_projet[projet.id] = {
                'total': total_projet,
                'success': success_projet,
                'fail': fail_projet,
            }
            
            # Debug pour chaque projet
            print(f"DEBUG: Projet {projet.nom} - Total: {total_projet}, Success: {success_projet}, Fail: {fail_projet}")
        
        # Statistiques détaillées par projet
        stats_par_projet = []
        for projet in projets:
            total_projet = execution_tests_by_projet[projet.id]['total']
            reussis_projet = execution_tests_by_projet[projet.id]['success']
            echoues_projet = execution_tests_by_projet[projet.id]['fail']
            
            stats_par_projet.append({
                'projet': projet,
                'total': total_projet,
                'reussis': reussis_projet,
                'echoues': echoues_projet,
                'taux_reussite': round((reussis_projet / total_projet * 100) if total_projet > 0 else 0, 2)
            })
        
        context = dict(
            self.admin_site.each_context(request),
            title="Vue Globale - Statistiques des Tests",
            total_tests=total_tests,
            tests_reussis=tests_reussis,
            tests_echoues=tests_echoues,
            non_fonctionnels=non_fonctionnels,  # AJOUT: Variable manquante
            taux_reussite_global=round((tests_reussis / total_tests * 100) if total_tests > 0 else 0, 2),
            stats_par_projet=stats_par_projet,
            projets_utilisateur=projets,  # AJOUT: Variable que le template attend
            execution_tests_by_projet=execution_tests_by_projet,  # AJOUT: Dictionnaire attendu par le template
            projets_count=projets.count(),
            debug=True,  # TEMPORAIRE: Pour le debugging
        )
        
        print(f"DEBUG: Contexte - projets_utilisateur count: {len(context['projets_utilisateur'])}")
        print(f"DEBUG: execution_tests_by_projet: {execution_tests_by_projet}")
        
        return TemplateResponse(request, "admin/vue-globale.html", context)
    
    def has_module_permission(self, request):
        """Permet d'afficher le module dans la sidebar"""
        return True
        
    def has_view_permission(self, request, obj=None):
        """Contrôle l'accès à la vue"""
        return request.user.is_staff
        
    def has_add_permission(self, request):
        """Pas de permission d'ajout (c'est juste une vue)"""
        return False
        
    def has_change_permission(self, request, obj=None):
        """Pas de permission de modification"""
        return False
        
    def has_delete_permission(self, request, obj=None):
        """Pas de permission de suppression"""
        return False