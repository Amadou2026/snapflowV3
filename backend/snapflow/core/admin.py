from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    CustomUser, Axe, Dashboard, SousAxe, Script, Projet,Societe, SecteurActivite,
    ConfigurationTest, ExecutionTest, EmailNotification, VueGlobale, GroupePersonnalise, Configuration
)
from django.contrib.auth.models import Group, Permission
from django.contrib.auth.admin import GroupAdmin
from .models import *
from django.utils.html import format_html
from io import BytesIO
from django import forms
import openpyxl
from django.http import HttpResponse, HttpResponseForbidden
import logging
from core.utils.redmine import get_last_redmine_tickets
from django.contrib.admin.views.decorators import staff_member_required
from django.utils.timezone import make_aware, now, localtime
from django.contrib.auth.models import Group as AuthGroup

from django.urls import path
from django.http import HttpResponseRedirect
from django.utils.html import format_html

from django.conf import settings
import requests

from django.utils.html import format_html


# admin.site.site_header = "Snapflow Software Monitoring"
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
        # 'redmine_slug',
        'url',
        'logo',
        'contrat',
        'charge_de_compte',
    )
    list_display = ('nom', 'id_redmine','id_redmine_charge_de_compte', 'url', 'lien_tickets_redmine')

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

    
    # def lien_tickets_redmine(self, obj):
    #     url = reverse('admin:core_projet_redmine-tickets')
    #     return format_html('<a href="{}">Voir Tickets Redmine</a>', url)
    # lien_tickets_redmine.short_description = "Tickets Redmine"


# On désenregistre Projet si déjà enregistré avec un autre admin
try:
    admin.site.unregister(Projet)
except admin.sites.NotRegistered:
    pass

# === Admin classique pour Projet ===
@admin.register(Projet)
class ProjetAdmin(admin.ModelAdmin):
    list_display = ('nom', 'id_redmine', 'url', 'charge_de_compte')
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

        from datetime import timedelta
        from django.utils import timezone

        # Gestion de la période sélectionnée
        periode_selectionnee = request.GET.get("periode", "jour")
        now = timezone.now()

        if periode_selectionnee == "semaine":
            date_debut = now - timedelta(days=7)
        elif periode_selectionnee == "mois":
            date_debut = now - timedelta(days=30)
        elif periode_selectionnee == "annee":
            date_debut = now - timedelta(days=365)
        else:  # par défaut : jour
            date_debut = now - timedelta(days=1)

        periode_range = (date_debut, now)

        # Récupérer les projets accessibles par l'utilisateur
        if request.user.is_superuser:
            projets_accessibles = Projet.objects.all()
        else:
            projets_accessibles = Projet.objects.filter(charge_de_compte=request.user)

        projet_id = request.GET.get("projet")
        if projet_id:
            projets = projets_accessibles.filter(id=projet_id)
        else:
            projets = projets_accessibles

        # Filtrage commun des tests par projet et période
        tests_filter = ExecutionTest.objects.filter(configuration__projet__in=projets)
        if periode_range:
            tests_filter = tests_filter.filter(started_at__range=periode_range)

        # Calcul des statistiques
        total_tests = tests_filter.count()

        tests_reussis = tests_filter.filter(statut='done').count()
        tests_echoues = tests_filter.filter(statut='error').count()
        non_fonctionnels = tests_filter.filter(statut__in=['error', 'running']).count()

        # ⚠️ Correction ici : filtre sur les scripts en attente respectant la période
        tests_en_attente = ExecutionResult.objects.filter(
            statut='pending',
            execution__in=tests_filter
        ).count()

        # Statistiques par projet
        execution_tests_by_projet = {}
        for projet in projets:
            tests_par_projet = ExecutionTest.objects.filter(configuration__projet=projet)
            if periode_range:
                tests_par_projet = tests_par_projet.filter(started_at__range=periode_range)

            total_projet = tests_par_projet.count()
            success_projet = tests_par_projet.filter(statut='done').count()
            fail_projet = tests_par_projet.filter(statut='error').count()

            execution_tests_by_projet[projet.id] = {
                'total': total_projet,
                'success': success_projet,
                'fail': fail_projet,
            }

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
            title="Vue Globale - Statistiques des Batteéries de Tests",
            total_tests=total_tests,
            tests_reussis=tests_reussis,
            tests_en_attente=tests_en_attente,
            tests_echoues=tests_echoues,
            non_fonctionnels=non_fonctionnels,
            taux_reussite_global=round((tests_reussis / total_tests * 100) if total_tests > 0 else 0, 2),
            stats_par_projet=stats_par_projet,
            projets_utilisateur=projets_accessibles,
            execution_tests_by_projet=execution_tests_by_projet,
            projets_count=projets_accessibles.count(),
            selected_projet_id=int(projet_id) if projet_id else None,
            periode=periode_selectionnee,  # important pour réafficher dans le select
        )
        
        

        return TemplateResponse(request, "admin/vue-globale.html", context)



    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(charge_de_compte=request.user)

  


# Groupe personnalisé
class GroupePersonnaliseForm(forms.ModelForm):
    class Meta:
        model = GroupePersonnalise
        fields = '__all__'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Organiser les permissions par app/model
        self.fields['permissions'].queryset = Permission.objects.all()
        self.fields['permissions'].widget.attrs['class'] = 'permission-selector'



# Désenregistrer si déjà enregistré
try:
    admin.site.unregister(GroupePersonnalise)
except admin.sites.NotRegistered:
    pass

# Admin personnalisé
class GroupePersonnaliseAdmin(admin.ModelAdmin):
    list_display = ("nom", "type_groupe", "role_predefini", "est_protege", "afficher_permissions")
    list_filter = ("type_groupe", "role_predefini")
    filter_horizontal = ("permissions",)
    ordering = ('nom',)

    fieldsets = (
        ("Infos générales", {
            "fields": ("nom", "type_groupe", "role_predefini", "description")
        }),
        ("Permissions", {
            "fields": ("permissions",)
        }),
        ("Infos système", {
            "fields": ("groupe_django", "est_protege"),
            "classes": ("collapse",)
        }),
    )
    def afficher_permissions(self, obj):
        return ", ".join([p.name for p in obj.permissions.all()])
    afficher_permissions.short_description = "Permissions"

    def has_delete_permission(self, request, obj=None):
        if obj and obj.est_protege:
            return False
        return super().has_delete_permission(request, obj)

    def has_change_permission(self, request, obj=None):
        if obj and obj.est_protege:
            return False
        return super().has_change_permission(request, obj)
    
    # Dans votre serializer ou vue
    def create(self, validated_data):
        # est_protege est False par défaut pour les groupes créés via l'API
        validated_data['est_protege'] = False
        return super().create(validated_data)

admin.site.register(GroupePersonnalise, GroupePersonnaliseAdmin)



# core/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group
from django.apps import apps
from .models import CustomUser

@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    model = CustomUser
    list_display = ('email', 'first_name', 'last_name', 'societe', 'is_staff')
    list_filter = ('is_staff', 'is_superuser', 'societe')
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('email',)
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ("Informations personnelles", {'fields': ('first_name', 'last_name', 'societe')}),
        ("Permissions", {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ("Dates importantes", {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2', 'societe')}
        ),
    )

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        if request.user.is_superuser:
            return queryset
        if request.user.is_staff and request.user.societe:
            return queryset.filter(societe=request.user.societe)
        return queryset.none()

    def save_model(self, request, obj, form, change):
        if not obj.pk:  # création uniquement
            if not request.user.is_superuser and request.user.societe:
                obj.societe = request.user.societe
        super().save_model(request, obj, form, change)
        # Ajouter aussi en employé
        if obj.societe:
            obj.societe.employes.add(obj)

    def get_fieldsets(self, request, obj=None):
        fieldsets = super().get_fieldsets(request, obj)
        if not request.user.is_superuser:
            new_fieldsets = []
            for name, options in fieldsets:
                fields = list(options.get('fields', []))
                if 'user_permissions' in fields:
                    fields.remove('user_permissions')
                new_fieldsets.append((name, {**options, 'fields': fields}))
            return new_fieldsets
        return fieldsets

    def has_delete_permission(self, request, obj=None):
        if obj and obj.is_superuser:
            return False
        return super().has_delete_permission(request, obj)

    def get_readonly_fields(self, request, obj=None):
        readonly = super().get_readonly_fields(request, obj)

        # 🔒 Superadmin → seul prénom et nom modifiables
        if obj and obj.is_superuser:
            return readonly + (
                'email', 'password', 'societe', 'is_active', 'is_staff',
                'is_superuser', 'groups', 'user_permissions', 'last_login', 'date_joined'
            )

        # 🔹 Pour les autres (cas classiques)
        if not request.user.is_superuser:
            readonly = readonly + ('is_superuser', 'groups', 'user_permissions')

        return readonly




# 🔹 2. Override de la méthode get_app_list pour réorganiser le menu
original_get_app_list = admin.AdminSite.get_app_list

def custom_get_app_list(self, request, app_label=None):
    app_list = original_get_app_list(self, request, app_label)
    
    # Nouvelle organisation du menu
    reordered_app_list = []
    
    # Debut    
     # 1. Gestion du Profil (section personnalisée)
    reporting_section = {
        'name': 'Dashboard & Vue Globale',
        'app_label': 'reporting_section',
        'models': []
    }
    
    reporting_models_custom = {
        'VueGlobale': 'Vue Globale',
        'Dashboard': 'Suivi des Campagnes de Test',
        
        
    }
    for model_name, custom_name in reporting_models_custom.items():
        model = next((m for m in app_list if m['app_label'] == 'core' for model in m['models'] if model['object_name'] == model_name), None)
        if model:
            reporting_section['models'].append({
                'name': custom_name,
                'object_name': model_name,
                'admin_url': f'/admin/core/{model_name.lower()}/',
                'view_only': False
            })
    
    if reporting_section['models']:
        reordered_app_list.append(reporting_section)
            
    # Fin
    
    # Debut
    
    # 2. Gestion du Patrimoine
        gestion_patrimoine = {
            'name': 'Gestion du Patrimoine',
            'app_label': 'gestion_patrimoine',
            'models': []
        }
        
        gestion_patrimoine_custom = {
            'Configuration': 'Paramètres Globaux',
            'Projet': 'Gestion des Projets',
            'EmailNotification': 'Mailing & Notifications',
            'Axe': 'Gestion des Axes',
            'SousAxe': 'Gestion des Sous-Axes'
            
        }
        for model_name, custom_name in gestion_patrimoine_custom.items():
            model = next((m for m in app_list if m['app_label'] == 'core' for model in m['models'] if model['object_name'] == model_name), None)
            if model:
                gestion_patrimoine['models'].append({
                    'name': custom_name,
                    'object_name': model_name,
                    'admin_url': f'/admin/core/{model_name.lower()}/',
                    'view_only': False
                })
        
        if gestion_patrimoine['models']:
            reordered_app_list.append(gestion_patrimoine)
        
    # Fin
    
    # Debut
    
    # 3. Testing & Monitoring
        testing_monitoring = {
            'name': 'Testing & Monitoring',
            'app_label': 'testing_monitoring',
            'models': []
        }
        
        testing_monitoring_custom = {
            'Script': 'Gestion des Scripts',
            'ConfigurationTest': 'Configuration des Tests',
            'ExecutionTest': 'Exécution des Tests',
            'ExecutionResult': 'Résultats des Tests',            
        }
        for model_name, custom_name in testing_monitoring_custom.items():
            model = next((m for m in app_list if m['app_label'] == 'core' for model in m['models'] if model['object_name'] == model_name), None)
            if model:
                testing_monitoring['models'].append({
                    'name': custom_name,
                    'object_name': model_name,
                    'admin_url': f'/admin/core/{model_name.lower()}/',
                    'view_only': False
                })
        
        if testing_monitoring['models']:
            reordered_app_list.append(testing_monitoring)
    
    
    # Fin
    
    # Debut
    
    # 🔑 Nouvelle section : Gestion Société
    societe_section = {
        'name': 'Gestion Société',
        'app_label': 'gestion_societe',
        'models': []
    }

    # Ajouter Societe
    societe_model = next(
        (m for m in app_list if m['app_label'] == 'core' for model in m['models'] if model['object_name'] == 'Societe'),
        None
    )
    if societe_model:
        societe_section['models'].append({
            'name': 'Sociétés',
            'object_name': 'Societe',
            'admin_url': '/admin/core/societe/',
            'view_only': False
        })

    # Ajouter SecteurActivite
    secteur_model = next(
        (m for m in app_list if m['app_label'] == 'core' for model in m['models'] if model['object_name'] == 'SecteurActivite'),
        None
    )
    if secteur_model:
        societe_section['models'].append({
            'name': "Secteurs d'activité",
            'object_name': 'SecteurActivite',
            'admin_url': '/admin/core/secteuractivite/',
            'view_only': False
        })

    # Ajouter la section si elle contient des modèles
    if societe_section['models']:
        reordered_app_list.append(societe_section)

        
    # Fin
    
     # Debut
    
    # 🔑 4. Administration & Autorisation
    auth_section = {
        'name': 'Administration & Autorisation',
        'app_label': 'auth_section',
        'models': []
    }
    
    
    
    # Ajouter Group
    group_model = next((m for m in app_list if m['app_label'] == 'auth' for model in m['models'] if model['object_name'] == 'Group'), None)
    if group_model:
        auth_section['models'].append({
            'name': 'Groupes',
            'object_name': 'Group',
            'admin_url': '/admin/core/groupepersonnalise/',
            'view_only': False
        })
        
    
    
    # Ajouter CustomUser
    custom_user_model = next((m for m in app_list if m['app_label'] == 'core' for model in m['models'] if model['object_name'] == 'CustomUser'), None)
    if custom_user_model:
        auth_section['models'].append({
            'name': 'Utilisateurs',
            'object_name': 'CustomUser',
            'admin_url': '/admin/core/customuser/',
            'view_only': False
        })
    
    if auth_section['models']:
        reordered_app_list.append(auth_section)
        
    # Fin
        
    # 👤 6. Gestion du Profil (section personnalisée)
    # profile_section = {
    #     'name': 'Gestion du Profil',
    #     'app_label': 'profile_section',
    #     'models': [
    #         {
    #             'name': 'Gérer mon compte',
    #             'object_name': 'CustomUser',
    #             'admin_url': f'/admin/core/customuser/{request.user.id}/change/',
    #             'view_only': False,
    #         },
    #         {
    #             'name': 'Modifier mot de passe',
    #             'object_name': 'PasswordChange',
    #             'admin_url': '/admin/password_change/',
    #             'view_only': False,
    #         }
    #     ]
    # }
    
    # reordered_app_list.append(profile_section)
    
    # Ajouter les autres apps (comme auth, etc.)
    for app in app_list:
        if app['app_label'] not in ['auth', 'core']:
            reordered_app_list.append(app)
    
    return reordered_app_list

# 🔹 3. Appliquer le monkey patch
admin.AdminSite.get_app_list = custom_get_app_list

# 🔹 4. Enregistrement des modèles Group (optionnel)

# Group form
from django import forms
from django.contrib.auth.models import Permission

class GroupForm(forms.ModelForm):
    class Meta:
        model = AuthGroup
        fields = '__all__'
        


# Si vous voulez customiser l'admin des Groupes


admin.site.unregister(AuthGroup)
@admin.register(AuthGroup)
class GroupAdmin(admin.ModelAdmin):
    form = GroupForm
    list_display = ['name', 'afficher_type','afficher_permissions']
    search_fields = ['name']
    
    def afficher_type(self, obj):
        if hasattr(obj, 'groupe_personnalise'):
            return obj.groupe_personnalise.type_groupe
        return "—"
    afficher_type.short_description = "Type de groupe"

    def afficher_permissions(self, obj):
        return ", ".join([p.name for p in obj.permissions.all()])
    afficher_permissions.short_description = "Permissions"

@admin.register(Axe)
class AxeAdmin(admin.ModelAdmin):
    list_display = ('nom', 'description')
    search_fields = ('nom',)


@admin.register(SousAxe)
class SousAxeAdmin(admin.ModelAdmin):
    list_display = ('nom', 'description', 'axe')
    list_filter = ('axe',)
    search_fields = ('nom', 'description')
# 
from django.contrib import admin

class SocieteProjetFilter(admin.SimpleListFilter):
    """Filtre personnalisé pour n'afficher que les projets de la société de l'utilisateur"""
    title = 'Projet'
    parameter_name = 'projet'

    def lookups(self, request, model_admin):
        user = request.user
        
        # Superadmin voit tous les projets
        if user.is_superuser:
            projets = Projet.objects.all()
        else:
            # Les autres utilisateurs ne voient que les projets de leur société
            projets = Projet.objects.filter(societes=user.societe)
        
        return [(projet.id, projet.nom) for projet in projets.order_by('nom')]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(projet_id=self.value())
        return queryset

# 


@admin.register(Script)
class ScriptAdmin(admin.ModelAdmin):
    # Affichage des colonnes dans la liste
    list_display = ('projet', 'axe', 'sous_axe', 'nom', 'afficher_fichier', 'priorite')
    
    # Filtres dans la sidebar - REMPLACER par le filtre personnalisé
    list_filter = (SocieteProjetFilter, 'axe', 'sous_axe', 'priorite')
    
    # Champs recherchables
    search_fields = ('nom', 'axe__nom', 'sous_axe__nom', 'projet__nom')
    
    # Champs affichés dans le formulaire d'édition
    fields = ('projet', 'axe', 'sous_axe', 'nom', 'fichier', 'priorite')

    # Affichage du lien pour télécharger le fichier
    def afficher_fichier(self, obj):
        if obj.fichier:
            return format_html('<a href="{}" download>Télécharger</a>', obj.fichier.url)
        return '-'
    afficher_fichier.short_description = 'Fichier'

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        user = request.user

        # Superadmin voit tout
        if user.is_superuser:
            return queryset

        # Les autres utilisateurs ne voient que les scripts de leurs projets
        return queryset.filter(projet__societes=user.societe)

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        user = request.user

        # Limiter les choix de projets selon la société de l'utilisateur
        if not user.is_superuser:
            form.base_fields['projet'].queryset = Projet.objects.filter(societes=user.societe)

        return form

    def has_view_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if obj:
            return obj.projet.societes.filter(id=request.user.societe.id).exists()
        return request.user.has_perm('core.view_script')

    def has_change_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if obj:
            return obj.projet.societes.filter(id=request.user.societe.id).exists()
        return request.user.has_perm('core.change_script')

    def has_delete_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if obj:
            return obj.projet.societes.filter(id=request.user.societe.id).exists()
        return request.user.has_perm('core.delete_script')

    def has_add_permission(self, request):
        if request.user.is_superuser:
            return True
        return request.user.has_perm('core.add_script')


from django.utils.html import format_html
from django.contrib import admin
from .models import ConfigurationTest, Projet

@admin.register(ConfigurationTest)
class ConfigurationTestAdmin(admin.ModelAdmin):
    change_list_template = "admin/ConfigurationTestAdmin.html" 
    list_display = ('nom', 'societe', 'projet', 'periodicite', 'is_active', 'scripts_count', 'emails_count', 'date_activation', 'date_desactivation')
    list_filter = ('societe', 'projet', 'is_active', 'periodicite', 'date_activation', 'date_desactivation')
    search_fields = ('nom', 'societe__nom', 'projet__nom')
    filter_horizontal = ('scripts', 'emails_notification')
    actions = ['activer_configurations', 'desactiver_configurations']
    actions_on_top = True
    autocomplete_fields = ['projet', 'societe']
    readonly_fields = ['date_creation', 'date_modification']

    fieldsets = (
        ("Informations générales", {
            'fields': ('societe', 'nom', 'projet', 'is_active', 'periodicite', 'date_activation', 'date_desactivation')
        }),
        ("Sélection des scripts", {
            'fields': ('scripts',)
        }),
        ("Notification", {
            'fields': ('emails_notification',),
        }),
        ("Dates", {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )

    def scripts_count(self, obj):
        return obj.scripts.count()
    scripts_count.short_description = "Nb Scripts"

    def emails_count(self, obj):
        return obj.emails_notification.count()
    emails_count.short_description = "Nb Emails"

    def afficher_scripts_lies(self, obj):
        scripts = obj.scripts.all()
        return format_html("<br>".join(
            f"{s.axe.nom if s.axe else '-'} / {s.sous_axe.nom if s.sous_axe else '-'} / <strong>{s.nom}</strong>"
            for s in scripts
        )) or "-"
    afficher_scripts_lies.short_description = "Scripts liés"

    def activer_configurations(self, request, queryset):
        updated = queryset.update(is_active=True, date_activation=timezone.now())
        self.message_user(request, f"{updated} configuration(s) activée(s).")
    activer_configurations.short_description = "✅ Activer les configurations sélectionnées"

    def desactiver_configurations(self, request, queryset):
        updated = queryset.update(is_active=False, date_desactivation=timezone.now())
        self.message_user(request, f"{updated} configuration(s) désactivée(s).")
    desactiver_configurations.short_description = "❌ Désactiver les configurations sélectionnées"
    
    def changelist_view(self, request, extra_context=None):
        extra_context = extra_context or {}
        user = request.user

        if user.is_superuser:
            projets = Projet.objects.all()
            societes = Societe.objects.all()
        else:
            # CORRECTION : Pas besoin de hasattr puisque societe est obligatoire
            societes = Societe.objects.filter(id=user.societe.id)
            projets = Projet.objects.filter(societes=user.societe)

        extra_context['projets'] = projets
        extra_context['societes'] = societes
        return super().changelist_view(request, extra_context=extra_context)

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        user = request.user

        if not user.is_superuser:
            # CORRECTION : Pas besoin de hasattr puisque societe est obligatoire
            queryset = queryset.filter(societe=user.societe)

        societe_id = request.GET.get("societe")
        if societe_id:
            queryset = queryset.filter(societe_id=societe_id)

        projet_id = request.GET.get("projet")
        if projet_id:
            queryset = queryset.filter(projet_id=projet_id)

        return queryset

    def has_module_permission(self, request):
        return request.user.has_perm('core.view_configurationtest')

    def has_view_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if obj:
            return obj.societe == request.user.societe  # CORRECTION : Pas de hasattr
        return request.user.has_perm('core.view_configurationtest')

    def has_change_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if obj:
            return obj.societe == request.user.societe  # CORRECTION : Pas de hasattr
        return request.user.has_perm('core.change_configurationtest')

    def has_add_permission(self, request):
        if request.user.is_superuser:
            return True
        return request.user.has_perm('core.add_configurationtest')  # CORRECTION : Pas de hasattr

    def has_delete_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if obj:
            return obj.societe == request.user.societe  # CORRECTION : Pas de hasattr
        return request.user.has_perm('core.delete_configurationtest')



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
    list_display = ('configuration','projet', 'statut', 'started_at', 'ended_at', 'lien_log_excel')
    list_filter = (ProjetFilter, 'statut', StartedAtListFilter)
    readonly_fields = ('rapport', 'log_fichier')
    actions = ['exporter_excel']

    def get_queryset(self, request):
        queryset = super().get_queryset(request)

        user = request.user
        if not user.is_superuser:
            queryset = queryset.filter(configuration__projet__charge_de_compte=user)

        projet_id = request.GET.get('configuration__projet')
        if projet_id:
            queryset = queryset.filter(configuration__projet__id=projet_id)

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

# Début

from django.utils.translation import gettext_lazy as _
from django.contrib.admin import SimpleListFilter
from django.utils import timezone
from datetime import timedelta

class ExecutionStartedAtPeriodFilter(SimpleListFilter):
    title = _('Période de début d’exécution')
    parameter_name = 'periode_execution'

    def lookups(self, request, model_admin):
        return [
            ('jour', _('Dernier jour')),
            ('semaine', _('Dernière semaine')),
            ('mois', _('Dernier mois')),
            ('annee', _('Dernière année')),
        ]

    def queryset(self, request, queryset):
        now = timezone.now()

        if self.value() == 'jour':
            date_limite = now - timedelta(days=1)
            return queryset.filter(execution__started_at__gte=date_limite)

        if self.value() == 'semaine':
            date_limite = now - timedelta(days=7)
            return queryset.filter(execution__started_at__gte=date_limite)

        if self.value() == 'mois':
            date_limite = now - timedelta(days=30)
            return queryset.filter(execution__started_at__gte=date_limite)

        if self.value() == 'annee':
            date_limite = now - timedelta(days=365)
            return queryset.filter(execution__started_at__gte=date_limite)

        return queryset




# Fin 
from django.contrib import admin
from django.utils.html import format_html
from .models import ExecutionResult

@admin.register(ExecutionResult)
class ExecutionResultAdmin(admin.ModelAdmin):
    list_display = (
        'script',
        'configuration',
        'started_at',
        'statut',
        'resultat_interprete',
        'voir_log',
    )
    list_filter = ('statut', 'script', 'execution__configuration__projet',ExecutionStartedAtPeriodFilter)
    search_fields = ('script__nom', 'execution__configuration__nom')

    def resultat_interprete(self, obj):
        return obj.resultat_interprete
    resultat_interprete.short_description = "Résultat"

    def configuration(self, obj):
        return obj.execution.configuration.nom
    configuration.short_description = "Configuration"

    def started_at(self, obj):
        return obj.execution.started_at
    started_at.short_description = "Début"

    def voir_log(self, obj):
        if obj.log_fichier:
            return format_html('<a href="{}" target="_blank">📄 Voir</a>', obj.log_fichier.url)
        return "Aucun"
    
    voir_log.short_description = "Log"


@admin.register(EmailNotification)
class EmailNotificationAdmin(admin.ModelAdmin):
    list_display = ('email', 'societe', 'created_by', 'est_actif', 'date_creation')
    list_filter = ('societe', 'created_by', 'est_actif', 'date_creation')
    search_fields = ('email', 'societe__nom')
    list_editable = ('est_actif',)
    readonly_fields = ('created_by', 'date_creation')
    
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        # Pour les admins de société, ne montrer que les emails de leurs sociétés
        return qs.filter(societe__admin=request.user)
    
    def save_model(self, request, obj, form, change):
        if not obj.pk:  # Si c'est une création
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "societe" and not request.user.is_superuser:
            # Limiter les sociétés à celles dont l'utilisateur est admin
            kwargs["queryset"] = Societe.objects.filter(admin=request.user)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

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


# Debut Dashboard avec période pour les blocs
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
        total_echec = 0
        taux_reussite = 0
        taux_echec = 0
        projets_resumes = []

        # Filtrer les projets accessibles à l'utilisateur
        projets = Projet.objects.all() if user.is_superuser else Projet.objects.filter(charge_de_compte=user)
        projet_ids = projets.values_list("id", flat=True)

        if not projets.exists():
            return HttpResponseForbidden("Vous n'avez accès à aucun projet.")

        # Récupérer le projet sélectionné
        projet_id = request.GET.get("projet_id")
        selected_projet = None
        selected_projet_id = projet_id if projet_id else ""

        if projet_id:
            try:
                selected_projet = projets.get(id=projet_id)
            except Projet.DoesNotExist:
                selected_projet = None

        # Récupérer les ExecutionTest selon le projet sélectionné ou tous les projets accessibles
        if selected_projet:
            execution_tests = ExecutionTest.objects.filter(configuration__projet=selected_projet)
        else:
            execution_tests = ExecutionTest.objects.filter(configuration__projet_id__in=projet_ids)

        # S'il y a des tests, on les traite
        if execution_tests.exists():
            # Tests par jour
            tests_par_jour = (
                execution_tests.annotate(date=TruncDate("started_at"))
                .values("date")
                .annotate(total=Count("id"))
                .order_by("date")
            )
            labels = [str(entry["date"]) for entry in tests_par_jour]
            values = [entry["total"] for entry in tests_par_jour]

            # Succès / échec par jour
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

            # Répartition par projet
            projets_data = (
                execution_tests.values("configuration__projet__nom")
                .annotate(total=Count("id"))
                .order_by("-total")
            )
            projet_labels = [row["configuration__projet__nom"] for row in projets_data]
            projet_counts = [row["total"] for row in projets_data]

            # Totaux
            total_tests = execution_tests.count()
            total_success = execution_tests.filter(statut__in=["done", "succès", "success"]).count()
            total_echec = execution_tests.filter(statut__in=["error", "échec", "fail", "failure"]).count()

            taux_reussite = round((total_success / total_tests) * 100, 2) if total_tests > 0 else 0
            taux_echec = round((total_echec / total_tests) * 100, 2) if total_tests > 0 else 0

            # Erreurs par script
            erreurs_data = (
                execution_tests.values("configuration__scripts__nom")
                .annotate(
                    total=Count("id"),
                    erreurs=Count("id", filter=Q(statut__in=["error", "échec", "fail", "failure"])),
                )
                .order_by("-erreurs")
            )
            erreurs_labels = [d["configuration__scripts__nom"] or "Sans script" for d in erreurs_data]
            erreurs_counts = [d["erreurs"] for d in erreurs_data]

            # Résumé par projet
            projets_map = {
                p.id: {"id": p.id, "nom": p.nom, "total": 0, "fonctionnels": 0, "non_fonctionnels": 0}
                for p in projets
            }
            for e in execution_tests.select_related("configuration__projet"):
                pid = e.configuration.projet_id
                if pid not in projets_map:
                    continue
                projets_map[pid]["total"] += 1
                if e.statut in ["done", "succès", "success"]:
                    projets_map[pid]["fonctionnels"] += 1
                else:
                    projets_map[pid]["non_fonctionnels"] += 1
            projets_resumes = list(projets_map.values())

        # Construire les URLs cliquables pour admin
        base_url = "/admin/core/executiontest/?"
        total_tests_url = f"{base_url}"
        success_url = f"{base_url}statut__exact=done"
        echec_url = f"{base_url}statut__exact=error"

        if selected_projet:
            total_tests_url += f"&configuration__projet={selected_projet.id}"
            success_url += f"&configuration__projet={selected_projet.id}"
            echec_url += f"&configuration__projet={selected_projet.id}"

        context = dict(
            self.admin_site.each_context(request),
            title="Suivi des Campagnes de Test",
            projets=projets,
            selected_projet=selected_projet,
            selected_projet_id=selected_projet_id,
            labels=labels,
            values=values,
            sf_labels=sf_labels,
            sf_success=sf_success,
            sf_fail=sf_fail,
            projet_labels=projet_labels,
            projet_counts=projet_counts,
            taux_reussite=taux_reussite,
            taux_echec=taux_echec,
            erreurs_labels=erreurs_labels,
            erreurs_counts=erreurs_counts,
            total_tests=total_tests,
            total_success=total_success,
            total_echec=total_echec,
            non_fonctionnels=total_tests - total_success,
            projets_resumes=projets_resumes,
            total_tests_url=total_tests_url,
            success_url=success_url,
            echec_url=echec_url,
            **extra_context
        )
        return TemplateResponse(request, "admin/dashboard.html", context)



    def has_module_permission(self, request):
        return True

    def has_view_permission(self, request, obj=None):
        return False

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if obj is None:
            return True
        return obj.charge_de_compte == request.user

    def has_delete_permission(self, request, obj=None):
        return False


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
    
    # debut
    def vue_globale_view(self, request):
        periode = request.GET.get('periode', 'jour')

        if request.user.is_superuser:
            projets = Projet.objects.all()
        else:
            projets = Projet.objects.filter(charge_de_compte=request.user)

        date_limite = None
        if periode == 'jour':
            date_limite = now() - timedelta(days=1)
        elif periode == 'semaine':
            date_limite = now() - timedelta(weeks=1)
        elif periode == 'mois':
            date_limite = now() - timedelta(days=30)
        elif periode == 'annee':
            date_limite = now() - timedelta(days=365)

        # === Filtrage des ExecutionTest ===
        tests_filter = ExecutionTest.objects.filter(configuration__projet__in=projets)
        if date_limite:
            tests_filter = tests_filter.filter(started_at__gte=date_limite)

        total_tests = tests_filter.count()
        tests_echoues = tests_filter.filter(statut='error').count()
        tests_reussis = tests_filter.filter(statut='done').count()
        non_fonctionnels = tests_filter.filter(statut__in=['error', 'running', 'pending']).count()

        # === Filtrage des ExecutionResult ===
        resultats_filter = ExecutionResult.objects.filter(execution__in=tests_filter)

        total_resultats = resultats_filter.count()
        resultats_done = resultats_filter.filter(statut='done').count()
        resultats_error = resultats_filter.filter(statut='error').count()
        resultats_pending = resultats_filter.filter(statut='pending').count()
        resultats_running = resultats_filter.filter(statut='running').count()

        # Pour les projets : stats par projet
        execution_tests_by_projet = {}
        for projet in projets:
            tests_projet = tests_filter.filter(configuration__projet=projet)
            execution_tests_by_projet[projet.id] = {
                'total': tests_projet.count(),
                'success': tests_projet.filter(statut='done').count(),
                'fail': tests_projet.filter(statut='error').count(),
            }

        context = dict(
            self.admin_site.each_context(request),
            title="Vue Globale - Statistiques des Tests",
            total_tests=total_tests,
            tests_reussis=tests_reussis,
            tests_echoues=tests_echoues,
            non_fonctionnels=non_fonctionnels,
            taux_reussite_global=round((tests_reussis / total_tests * 100) if total_tests > 0 else 0, 2),
            projets_utilisateur=projets,
            execution_tests_by_projet=execution_tests_by_projet,
            periode=periode,

            # === Ajout des résultats ExecutionResult ===
            total_resultats=total_resultats,
            resultats_done=resultats_done,
            resultats_error=resultats_error,
            resultats_pending=resultats_pending,
            resultats_running=resultats_running,
        )

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
    

#  config
# core/admin.py

from django.contrib import admin, messages
from django.http import HttpResponseRedirect
from django.urls import path, reverse
from .models import Configuration, RedmineProject
from django.utils.html import format_html, mark_safe

@admin.register(Configuration)
class ConfigurationAdmin(admin.ModelAdmin):
    list_display = ['societe', 'redmine_url', 'email_host_user', 'last_sync']
    list_filter = ['societe']
    readonly_fields = ['sync_button_display', 'get_projects_table_html', 'last_sync', 'date_creation', 'date_modification']
    fieldsets = (
        ('Informations Société', {
            'fields': ('societe',)
        }),
        ('Configuration Redmine', {
            'fields': ('redmine_url', 'redmine_api_key', 'sync_button_display', 'last_sync'),
            'classes': ('collapse',)
        }),
        ('Configuration Email', {
            'fields': ('email_host_user', 'email_host_password'),
            'classes': ('collapse',)
        }),
        ('Projets Redmine', {
            'fields': ('get_projects_table_html',),
            'classes': ('collapse', 'full-width')
        }),
        ('Dates', {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )

    def sync_button_display(self, obj):
        if self.has_sync_permission(self.request, obj):
            url = reverse('admin:configuration_sync', args=[obj.id])
            return format_html(
                '<a class="button" href="{}" style="padding: 6px 12px; background-color: #417690; color: white; text-decoration: none; border-radius: 4px;">🔄 Synchroniser les projets Redmine</a>',
                url
            )
        return "Non autorisé"
    sync_button_display.short_description = "Action"

    def get_projects_table_html(self, obj):
        # Filtrer les projets par société
        projects = RedmineProject.objects.filter(societe=obj.societe).order_by('name')
        if not projects.exists():
            return "<p>Aucun projet synchronisé</p>"

        html = """
        <table style="width:100%; border-collapse: collapse; font-size: 14px;">
            <thead>
                <tr style="background:#f0f0f0;">
                    <th>ID</th>
                    <th>Nom</th>
                    <th>Identifier</th>
                    <th>Description</th>
                    <th>Homepage</th>
                    <th>Parent</th>
                    <th>Statut</th>
                    <th>Public</th>
                    <th>Créé le</th>
                    <th>Mis à jour le</th>
                </tr>
            </thead>
            <tbody>
        """

        for p in projects:
            homepage = p.homepage
            if homepage:
                if not homepage.startswith(('http://', 'https://')):
                    homepage = 'https://' + homepage
            else:
                homepage = "#"
            
            html += f"""
            <tr>
                <td>{p.project_id}</td>
                <td>{p.name}</td>
                <td>{p.identifier}</td>
                <td>{p.description or 'Aucune description'}</td>
                <td><a href="{homepage}" target="_blank" class="project-url">{p.homepage or 'N/A'}</a></td>
                <td>{p.parent_name or 'N/A'}</td>
                <td>{p.status}</td>
                <td>{'Oui' if p.is_public else 'Non'}</td>
                <td>{p.created_on.strftime('%d/%m/%Y') if p.created_on else 'N/A'}</td>
                <td>{p.updated_on.strftime('%d/%m/%Y') if p.updated_on else 'N/A'}</td>
            </tr>
            """

        html += "</tbody></table>"
        return mark_safe(html)
    get_projects_table_html.short_description = "Projets synchronisés"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                '<path:object_id>/sync/',
                self.admin_site.admin_view(self.sync_view),
                name='configuration_sync',
            ),
        ]
        return custom_urls + urls

    def sync_view(self, request, object_id):
        config = Configuration.objects.get(id=object_id)
        
        # Vérifier les permissions
        if not self.has_sync_permission(request, config):
            self.message_user(request, "Vous n'avez pas la permission de synchroniser cette configuration.", messages.ERROR)
            return HttpResponseRedirect('../')
        
        success, message = config.sync_redmine_projects()
        if success:
            self.message_user(request, message, messages.SUCCESS)
        else:
            self.message_user(request, message, messages.ERROR)
        return HttpResponseRedirect('../')

    # ---- Permissions révisées ----
    def has_module_permission(self, request):
        # Autoriser tous les utilisateurs avec la permission view_configuration
        return request.user.has_perm('core.view_configuration')

    def has_view_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if obj:
            # Vérifier si l'utilisateur a accès à la société de cette configuration
            return hasattr(request.user, 'societe') and obj.societe == request.user.societe
        return request.user.has_perm('core.view_configuration')

    def has_change_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if obj:
            return hasattr(request.user, 'societe') and obj.societe == request.user.societe
        return request.user.has_perm('core.change_configuration')

    def has_add_permission(self, request):
        if request.user.is_superuser:
            return True
        # Les administrateurs ne peuvent créer qu'une configuration pour leur société
        if hasattr(request.user, 'societe'):
            # Vérifier si une configuration existe déjà pour leur société
            return not Configuration.objects.filter(societe=request.user.societe).exists()
        return False

    def has_delete_permission(self, request, obj=None):
        # Seuls les superadmins peuvent supprimer
        return request.user.is_superuser

    def has_sync_permission(self, request, obj=None):
        if request.user.is_superuser:
            return True
        if obj:
            return hasattr(request.user, 'societe') and obj.societe == request.user.societe
        return False

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        # Filtrer par société de l'utilisateur
        if hasattr(request.user, 'societe') and request.user.societe:
            return qs.filter(societe=request.user.societe)
        return qs.none()

    def save_model(self, request, obj, form, change):
        # Pour les administrateurs, assigner automatiquement leur société
        if not change and not obj.societe and hasattr(request.user, 'societe'):
            obj.societe = request.user.societe
        super().save_model(request, obj, form, change)
    
    
@admin.register(SecteurActivite)
class SecteurActiviteAdmin(admin.ModelAdmin):
    list_display = ('nom',) 
    
@admin.register(Societe)
class SocieteAdmin(admin.ModelAdmin):
    list_display = ('nom', 'num_siret', 'secteur_activite', 'admin', 'display_projets', 'nombre_projets')
    filter_horizontal = ('employes', 'projets')  # Ajoutez 'projets' ici
    list_filter = ('secteur_activite', 'projets')  # Optionnel: ajoutez aux filtres
    search_fields = ('nom', 'num_siret', 'admin__email', 'projets__nom')  # Corrigez 'projet__nom' en 'projets__nom'
    
    def display_projets(self, obj):
        """Affiche la liste des projets dans l'admin"""
        return ", ".join([projet.nom for projet in obj.projets.all()])
    display_projets.short_description = 'Projets'  # Nom de la colonne dans l'admin
    
    def nombre_projets(self, obj):
        """Affiche le nombre de projets"""
        return obj.projets.count()
    nombre_projets.short_description = 'Nb. Projets'

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(admin=request.user)

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        if db_field.name == "admin" and not request.user.is_superuser:
            kwargs["queryset"] = db_field.remote_field.model.objects.filter(pk=request.user.pk)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def formfield_for_manytomany(self, db_field, request, **kwargs):
        """
        Limite les champs manytomany selon les permissions
        """
        if db_field.name == "employes" and not request.user.is_superuser:
            # Logique existante pour les employés
            if request.resolver_match.url_name.endswith('change'):
                obj_id = request.resolver_match.kwargs.get('object_id')
                if obj_id:
                    try:
                        societe = Societe.objects.get(pk=obj_id)
                        kwargs["queryset"] = societe.users.all()
                    except Societe.DoesNotExist:
                        kwargs["queryset"] = CustomUser.objects.none()
            else:
                kwargs["queryset"] = CustomUser.objects.filter(societe=request.user.societe)
        
        elif db_field.name == "projets" and not request.user.is_superuser:
            # Limiter les projets selon les permissions de l'utilisateur
            # Adaptez cette logique selon vos besoins
            if hasattr(request.user, 'projets_access'):
                kwargs["queryset"] = request.user.projets_access.all()
            else:
                # Par défaut, montrer tous les projets ou limiter selon votre logique métier
                kwargs["queryset"] = Projet.objects.all()
                
        return super().formfield_for_manytomany(db_field, request, **kwargs)



