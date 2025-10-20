# core/models.py
from django.contrib.auth.models import Group, Permission
from django.db import models
from django.contrib.auth.models import AbstractUser
from users.managers import CustomUserManager
from django.utils.timezone import now
from django.utils import timezone
import requests
import json
from django.core.exceptions import ImproperlyConfigured
from dateutil.parser import parse as parse_datetime
from datetime import datetime, timedelta
from rest_framework.exceptions import ValidationError, PermissionDenied


# AJOUTER CET IMPORT
from django.conf import settings


class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    username = None
    first_name = models.CharField(max_length=30)
    last_name = models.CharField(max_length=30)
    societe = models.ForeignKey(
        "Societe",
        on_delete=models.PROTECT,
        null=False,
        blank=False,
        related_name="users",
        verbose_name="Société",
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["societe"]
    objects = CustomUserManager()

    def __str__(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.email

    class Meta:
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"


class GroupePersonnalise(models.Model):
    TYPE_CHOICES = [
        ("predéfini", "Prédéfini"),
        ("personnalisé", "Personnalisé"),
    ]

    ROLE_PREDEFINIS = [
        ("super-admin", "Super-admin"),
        ("admin-societe", "admin-societe"),
        ("manager", "Manager"),
        ("chef_projet", "Chef de projet"),
        ("qa", "QA"),
    ]

    nom = models.CharField(max_length=100, unique=True)
    type_groupe = models.CharField(
        max_length=20, choices=TYPE_CHOICES, default="personnalisé"
    )
    role_predefini = models.CharField(
        max_length=20, choices=ROLE_PREDEFINIS, null=True, blank=True
    )
    description = models.TextField(blank=True)
    permissions = models.ManyToManyField(Permission, blank=True)
    groupe_django = models.OneToOneField(
        Group, on_delete=models.CASCADE, related_name="groupe_personnalise"
    )
    est_protege = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Groupe personnalisé"
        verbose_name_plural = "Groupes personnalisés"

    def __str__(self):
        return f"{self.nom} ({self.get_type_groupe_display()})"


class Axe(models.Model):
    nom = models.CharField(max_length=255)
    description = models.TextField()

    def __str__(self):
        return self.nom


class SousAxe(models.Model):
    nom = models.CharField(max_length=255)
    description = models.TextField()
    axe = models.ForeignKey(Axe, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.nom} ({self.axe.nom})"


class Projet(models.Model):
    id_redmine = models.IntegerField(null=True, blank=True)
    nom = models.CharField(max_length=255)
    url = models.URLField()
    logo = models.ImageField(upload_to="logos/", null=True, blank=True)
    contrat = models.TextField()
    charge_de_compte = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="projets_charge_de_compte",
    )
    id_redmine_charge_de_compte = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return self.nom

    def get_societes(self):
        return self.societes.all()

    @property
    def nombre_societes(self):
        return self.societes.count()


class SecteurActivite(models.Model):
    nom = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.nom


# models.py

class Societe(models.Model):
    nom = models.CharField(max_length=255)
    
    # --- CHAMPS SUPPRIMÉS ---
    # num_siret = models.CharField(max_length=14, blank=True, null=True)
    # url = models.URLField(
    #     blank=True, null=True, help_text="URL du site web de la société"
    # )
    # --- FIN DES CHAMPS SUPPRIMÉS ---

    secteur_activite = models.ForeignKey(
        "SecteurActivite", on_delete=models.SET_NULL, null=True, blank=True
    )
    admin = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={"is_superuser": False},
        related_name="societes_admin",
    )
    projets = models.ManyToManyField("Projet", blank=True, related_name="societes")
    employes = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name="societes_employes",
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nom

    def get_projets_display(self):
        return ", ".join([projet.nom for projet in self.projets.all()])

    @property
    def nombre_projets(self):
        return self.projets.count()

    @property
    def date_creation_formatee(self):
        return (
            self.date_creation.strftime("%d/%m/%Y à %H:%M")
            if self.date_creation
            else "Non spécifiée"
        )

    @property
    def date_modification_formatee(self):
        return (
            self.date_modification.strftime("%d/%m/%Y à %H:%M")
            if self.date_modification
            else "Non spécifiée"
        )


class Script(models.Model):
    PRIORITY_CHOICES = [
        (1, "Basse"),
        (2, "Normale"),
        (3, "Haute"),
        (4, "Urgente"),
        (5, "Immédiate"),
    ]

    nom = models.CharField(max_length=255)
    fichier = models.FileField(upload_to="scripts/")
    axe = models.ForeignKey("Axe", on_delete=models.SET_NULL, null=True)
    sous_axe = models.ForeignKey("SousAxe", on_delete=models.SET_NULL, null=True)
    projet = models.ForeignKey(
        Projet, on_delete=models.CASCADE, related_name="scripts", null=True
    )
    priorite = models.PositiveSmallIntegerField(choices=PRIORITY_CHOICES, default=2)

    def __str__(self):
        return f"{self.axe.nom}/{self.sous_axe.nom}/{self.nom}"




class EmailNotification(models.Model):
    email = models.EmailField()
    
    # NOUVEAUX CHAMPS
    prenom = models.CharField(
        max_length=100, 
        null=True, 
        blank=True, 
        verbose_name="Prénom"
    )
    nom = models.CharField(
        max_length=100, 
        null=True, 
        blank=True, 
        verbose_name="Nom"
    )
    
    societe = models.ForeignKey(
        "Societe",
        on_delete=models.CASCADE,
        related_name="emails_notification",
        null=True,
        blank=True,
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="emails_crees",
        null=True,
        blank=True,
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    est_actif = models.BooleanField(
        default=True, 
        help_text="Indique si cet email reçoit des notifications"
    )

    class Meta:
        verbose_name = "Email de notification"
        verbose_name_plural = "Emails de notification"
        ordering = ["-date_creation"]

    def __str__(self):
        status = "✓" if self.est_actif else "✗"
        societe_nom = self.societe.nom if self.societe else "Aucune société"
        
        # On affiche le nom complet s'il existe, sinon juste l'email
        if self.prenom or self.nom:
            nom_complet = f"{self.prenom or ''} {self.nom or ''}".strip()
            return f"{nom_complet} ({self.email}) ({societe_nom}) {status}"
        
        return f"{self.email} ({societe_nom}) {status}"


    # Alternative plus simple si vous préférez :
    # def __str__(self):
    #     return self.email


class ConfigurationTest(models.Model):
    PERIODICITE_CHOICES = [
        ("2min", "Toutes les 2 minutes"),
        ("2h", "Toutes les 2 heures"),
        ("6h", "Toutes les 6 heures"),
        ("1j", "Une fois par jour"),
        ("1s", "Une fois par semaine"),
        ("1m", "Une fois par mois"),
    ]

    societe = models.ForeignKey(
        "Societe",
        on_delete=models.CASCADE,
        related_name="configurations_test",
        verbose_name="Société"
    )
    nom = models.CharField(max_length=255)
    projet = models.ForeignKey("Projet", on_delete=models.CASCADE)
    scripts = models.ManyToManyField("Script")
    emails_notification = models.ManyToManyField(
        "EmailNotification",
        blank=True,
        limit_choices_to={"est_actif": True},
    )

    periodicite = models.CharField(max_length=10, choices=PERIODICITE_CHOICES)
    last_execution = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    date_activation = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date et heure de lancement de la configuration",
    )
    date_desactivation = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date et heure de désactivation de la configuration",
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nom} - {self.societe.nom}"

    def save(self, *args, **kwargs):
        # CORRECTION: Meilleure gestion des erreurs
        try:
            # Vérifier via la relation ManyToMany societes
            if self.projet and self.societe:
                if not self.projet.societes.filter(id=self.societe.id).exists():
                    raise ValidationError("Le projet doit appartenir à la même société")
            
            # CORRECTION: Log pour débogage
            print(f"💾 Sauvegarde ConfigurationTest: {self.nom}")
            print(f"   is_active: {self.is_active}")
            print(f"   date_activation: {self.date_activation}")
            print(f"   date_desactivation: {self.date_desactivation}")
            
            super().save(*args, **kwargs)
            print(f"✅ ConfigurationTest sauvegardé avec ID: {self.id}")
            
        except Exception as e:
            print(f"❌ Erreur sauvegarde ConfigurationTest: {str(e)}")
            raise

    def get_emails_for_notification(self):
        """Retourne la liste des emails actifs pour les notifications"""
        return list(
            self.emails_notification.filter(est_actif=True).values_list(
                "email", flat=True
            )
        )

    def get_periodicite_timedelta(self):
        periodicite_map = {
            "2min": timedelta(minutes=2),
            "2h": timedelta(hours=2),
            "6h": timedelta(hours=6),
            "1j": timedelta(days=1),
            "1s": timedelta(weeks=1),
            "1m": timedelta(days=30),
        }
        return periodicite_map.get(self.periodicite, timedelta(days=1))

    def get_next_execution_time(self):
        now = timezone.now()
        if not self.is_active:
            return None
        if self.date_activation and now < self.date_activation:
            return self.date_activation
        base_time = self.last_execution or self.date_activation or now
        next_time = base_time + self.get_periodicite_timedelta()
        while next_time < now:
            next_time += self.get_periodicite_timedelta()
        if self.date_desactivation and next_time > self.date_desactivation:
            return None
        return next_time

    def get_next_executions_within(self, hours_ahead=24):
        now = timezone.now()
        limit_time = now + timedelta(hours=hours_ahead)
        if not self.is_active:
            return []
        base_time = self.last_execution or self.date_activation or now
        executions = []
        next_time = base_time
        while next_time <= now:
            next_time += self.get_periodicite_timedelta()
        while next_time <= limit_time:
            if self.date_desactivation and next_time > self.date_desactivation:
                break
            executions.append(next_time)
            next_time += self.get_periodicite_timedelta()
        return executions

    def is_due_for_execution(self):
        next_time = self.get_next_execution_time()
        if not next_time:
            return False
        return timezone.now() >= next_time

    @classmethod
    def get_configurations_to_execute(cls):
        return [
            config
            for config in cls.objects.filter(is_active=True)
            if config.is_due_for_execution()
        ]

    @classmethod
    def get_next_scheduled_configurations(cls, limit_hours=24):
        now = timezone.now()
        limit_time = now + timedelta(hours=limit_hours)
        scheduled_configs = []
        for config in cls.objects.filter(is_active=True):
            next_time = config.get_next_execution_time()
            if next_time and now <= next_time <= limit_time:
                scheduled_configs.append(
                    {
                        "configuration": config,
                        "next_execution": next_time,
                        "scripts": list(config.scripts.all()),
                        "time_until_execution": next_time - now,
                    }
                )
        scheduled_configs.sort(key=lambda x: x["next_execution"])
        return scheduled_configs

    @classmethod
    def get_overdue_configurations(cls):
        overdue_configs = []
        for config in cls.objects.filter(is_active=True):
            if config.last_execution:
                expected_next = (
                    config.last_execution + config.get_periodicite_timedelta()
                )
                if timezone.now() > expected_next:
                    overdue_configs.append(
                        {
                            "configuration": config,
                            "expected_time": expected_next,
                            "delay": timezone.now() - expected_next,
                            "scripts": list(config.scripts.all()),
                        }
                    )
        return overdue_configs

    class Meta:
        verbose_name = "Configuration Test"
        verbose_name_plural = "Configurations Test"
        ordering = ["nom"]
        permissions = [
            ("view_societe_configurationtest", "Peut voir les configurations test de sa société"),
            ("change_societe_configurationtest", "Peut modifier les configurations test de sa société"),
            ("delete_societe_configurationtest", "Peut supprimer les configurations test de sa société"),
        ]


class ExecutionTest(models.Model):
    STATUS_CHOICES = [
        ("pending", "En attente"),
        ("running", "En cours"),
        ("done", "Concluant"),
        ("error", "Non concluant"),
        ("non_executed", "Non exécuté"),
    ]
    configuration = models.ForeignKey(ConfigurationTest, on_delete=models.CASCADE)
    statut = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    log_fichier = models.FileField(upload_to="logs/", null=True, blank=True)
    rapport = models.TextField(blank=True)
    ticket_redmine_id = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.configuration.nom} - {self.statut}"

    @property
    def resultat_interprete(self):
        if self.statut == "done":
            return "Concluant"
        elif self.statut == "error":
            return "Non concluant"
        elif self.statut == "pending":
            return "En attente d'exécution"
        elif self.statut == "running":
            return "En cours d'exécution"
        elif self.statut == "non_executed":
            return "Non exécuté"
        return "Statut inconnu"


class ExecutionResult(models.Model):
    execution = models.ForeignKey(
        ExecutionTest, on_delete=models.CASCADE, related_name="resultats"
    )
    script = models.ForeignKey(Script, on_delete=models.CASCADE)
    statut = models.CharField(max_length=20, choices=ExecutionTest.STATUS_CHOICES)
    log_fichier = models.FileField(upload_to="logs/", null=True, blank=True)
    commentaire = models.TextField(blank=True)

    def __str__(self):
        return f"{self.script.nom} - {self.get_statut_display()}"

    @property
    def resultat_interprete(self):
        if self.statut == "done":
            return "Concluant"
        elif self.statut == "error":
            return "Non concluant"
        elif self.statut == "pending":
            return "En attente"
        elif self.statut == "running":
            return "En cours"
        return "Statut inconnu"

    class Meta:
        verbose_name = "Résultat d'exécution de script"
        verbose_name_plural = "Résultats des scripts"


class TicketRedmine:
    def __init__(self, id, sujet, url, projet_nom):
        self.id = id
        self.sujet = sujet
        self.url = url
        self.projet_nom = projet_nom


class Dashboard(models.Model):
    class Meta:
        verbose_name_plural = "Dashboards"
        verbose_name = "Dashboard"
        managed = False
        default_permissions = ()


class VueGlobale(models.Model):
    class Meta:
        verbose_name = "Vue Globale"
        verbose_name_plural = "Vue Globale"
        managed = False


class Configuration(models.Model):
    societe = models.OneToOneField(
        "Societe",
        on_delete=models.CASCADE,
        related_name="configuration",
        verbose_name="Société",
        null=True,
        blank=True,
    )
    redmine_url = models.URLField("URL Redmine", blank=True, null=True)
    redmine_api_key = models.CharField(
        "Clé API Redmine", max_length=255, blank=True, null=True
    )
    email_host_user = models.EmailField("Email Host User", blank=True, null=True)
    email_host_password = models.CharField(
        "Mot de passe Email", max_length=255, blank=True, null=True
    )
    last_sync = models.DateTimeField(
        "Dernière synchronisation", null=True, blank=True, default=timezone.now
    )
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Configuration"
        verbose_name_plural = "Configurations"

    def __str__(self):
        return f"Configuration - {self.societe.nom}"

    def sync_redmine_projects(self):
        if not self.redmine_url or not self.redmine_api_key:
            return False, "URL Redmine ou clé API manquante"

        base_url = self.redmine_url.rstrip("/")
        endpoint = f"{base_url}/projects.json"
        headers = {"X-Redmine-API-Key": self.redmine_api_key}
        params = {"limit": 100, "offset": 0}

        total_count = 0
        now_naive = timezone.now().replace(tzinfo=None)

        try:
            while True:
                response = requests.get(endpoint, headers=headers, params=params)
                response.raise_for_status()
                data = response.json()
                projects = data.get("projects", [])
                if not projects:
                    break

                for project in projects:
                    parent_name = (
                        project.get("parent", {}).get("name", "")
                        if project.get("parent")
                        else ""
                    )
                    created_on = (
                        parse_datetime(project["created_on"]).replace(tzinfo=None)
                        if project.get("created_on")
                        else None
                    )
                    updated_on = (
                        parse_datetime(project["updated_on"]).replace(tzinfo=None)
                        if project.get("updated_on")
                        else None
                    )

                    homepage = project.get("homepage", "")
                    if homepage and not homepage.startswith(("http://", "https://")):
                        homepage = "https://" + homepage

                    obj, created = RedmineProject.objects.update_or_create(
                        project_id=project["id"],
                        societe=self.societe,  # Lier le projet Redmine à la société
                        defaults={
                            "name": project.get("name", ""),
                            "identifier": project.get("identifier", ""),
                            "description": project.get("description", ""),
                            "homepage": homepage,
                            "parent_name": parent_name,
                            "status": project.get("status", 0),
                            "is_public": project.get("is_public", False),
                            "created_on": created_on,
                            "updated_on": updated_on,
                            "last_sync": now_naive,
                        },
                    )
                    total_count += 1

                if len(projects) < params["limit"]:
                    break
                params["offset"] += params["limit"]

            # Mettre à jour la date de dernière synchronisation
            self.last_sync = timezone.now()
            self.save()

            return (
                True,
                f"{total_count} projets synchronisés avec succès pour {self.societe.nom}",
            )

        except Exception as e:
            return False, f"Erreur lors de la synchronisation : {e}"


class RedmineProject(models.Model):
    societe = models.ForeignKey(
        "Societe",
        on_delete=models.CASCADE,
        related_name="redmine_projects",
        null=True,  # Temporairement nullable pour la migration
        blank=True,
    )
    project_id = models.IntegerField("ID Redmine", unique=True)
    name = models.CharField("Nom", max_length=255)
    identifier = models.CharField("Identifiant", max_length=255)
    description = models.TextField("Description", blank=True)
    homepage = models.URLField("Homepage", blank=True)
    parent_name = models.CharField("Parent", max_length=255, blank=True)
    status = models.IntegerField("Statut")
    is_public = models.BooleanField("Public", default=False)
    created_on = models.DateTimeField("Créé le", null=True, blank=True)
    updated_on = models.DateTimeField("Mis à jour le", null=True, blank=True)
    manager = models.CharField("Manager", max_length=255, blank=True)
    last_sync = models.DateTimeField(
        "Dernière synchronisation", null=True, blank=True, default=timezone.now
    )

    def __str__(self):
        return f"{self.name} ({self.identifier})"

    class Meta:
        verbose_name = "Projet Redmine"
        verbose_name_plural = "Projets Redmine"



# Script à problème
class ProblemeScript(models.Model):
    TYPE_PROBLEME_CHOICES = [
        ('timeout', 'Timeout'),
        ('configuration_invalide', 'Configuration invalide'),
        ('element_non_trouve', 'Élément non trouvé'),
        ('erreur_reseau', 'Erreur réseau'),
        ('resource_non_disponible', 'Resource non disponible'),
        ('autre', 'Autre'),
    ]
    
    STATUT_CHOICES = [
        ('critique', 'Critique'),
        ('en_attente_resolution', 'En attente de résolution'),
        ('surveille', 'Surveillé'),
        ('resolu', 'Résolu'),
    ]
    
    script = models.ForeignKey('Script', on_delete=models.CASCADE, related_name='problemes')
    type_probleme = models.CharField(max_length=30, choices=TYPE_PROBLEME_CHOICES)
    description = models.TextField()
    frequence_probleme = models.CharField(max_length=100, help_text="Description de la fréquence du problème")
    derniere_execution = models.DateTimeField(null=True, blank=True)
    statut = models.CharField(max_length=30, choices=STATUT_CHOICES, default='en_attente_resolution')
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Problème de script"
        verbose_name_plural = "Problèmes de scripts"
        ordering = ['-date_creation']
    
    def __str__(self):
        return f"{self.script.nom} - {self.get_type_probleme_display()}"