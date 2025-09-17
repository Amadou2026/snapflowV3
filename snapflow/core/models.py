# core/models.py
from django.contrib.auth.models import Group, Permission
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db import models
from users.managers import CustomUserManager
from django.utils.timezone import now
from django.utils import timezone
import requests
import json
from django.core.exceptions import ImproperlyConfigured
from django.utils import timezone

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    username = None

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()  

    def __str__(self):
        return self.email




class GroupePersonnalise(models.Model):
    TYPE_CHOICES = [
        ('predéfini', 'Prédéfini'),
        ('personnalisé', 'Personnalisé'),
    ]
    
    ROLE_PREDEFINIS = [
        ('administrateur', 'Administrateur'),
        ('qa', 'Quality Assurance'),
        ('developpeur', 'Développeur'),
        ('manager', 'Manager'),
        ('chef_projet', 'Chef de Projet'),
    ]
    
    nom = models.CharField(max_length=100, unique=True)
    type_groupe = models.CharField(max_length=20, choices=TYPE_CHOICES, default='personnalisé')
    role_predefini = models.CharField(max_length=20, choices=ROLE_PREDEFINIS, null=True, blank=True)
    description = models.TextField(blank=True)
    permissions = models.ManyToManyField(Permission, blank=True)
    groupe_django = models.OneToOneField(Group, on_delete=models.CASCADE, related_name='groupe_personnalise')
    est_protege = models.BooleanField(default=False)  # Pour les groupes prédéfinis
    
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
    redmine_slug = models.CharField(max_length=100) 
    url = models.URLField()
    logo = models.ImageField(upload_to="logos/")
    contrat = models.TextField()
    charge_de_compte = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True)
    id_redmine_charge_de_compte = models.IntegerField(null=True, blank=True)  
    

    def __str__(self):
        return self.nom
    
    # class Meta:
    #     verbose_name = "Projet"
    #     verbose_name_plural = "Gestion des Projets"
        
class Script(models.Model):
    PRIORITY_CHOICES = [
        (1, 'Basse'),
        (2, 'Normale'),
        (3, 'Haute'),
        (4, 'Urgente'),
        (5, 'Immédiate'),
    ]

    nom = models.CharField(max_length=255)
    fichier = models.FileField(upload_to="scripts/")
    axe = models.ForeignKey('Axe', on_delete=models.SET_NULL, null=True)
    sous_axe = models.ForeignKey('SousAxe', on_delete=models.SET_NULL, null=True)
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE, related_name='scripts', null=True)
    priorite = models.PositiveSmallIntegerField(choices=PRIORITY_CHOICES, default=2)

    def __str__(self):
        return f"{self.axe.nom}/{self.sous_axe.nom}/{self.nom}"

class EmailNotification(models.Model):
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.email

# Debut

from datetime import datetime, timedelta
from django.utils import timezone
from django.db import models

class ConfigurationTest(models.Model):
    PERIODICITE_CHOICES = [
        ('2min', 'Toutes les 2 minutes'),
        ('2h', 'Toutes les 2 heures'),
        ('6h', 'Toutes les 6 heures'),
        ('1j', 'Une fois par jour'),
        ('1s', 'Une fois par semaine'),
        ('1m', 'Une fois par mois'),
    ]
    
    nom = models.CharField(max_length=255)
    projet = models.ForeignKey('Projet', on_delete=models.CASCADE)
    scripts = models.ManyToManyField('Script')
    emails_notification = models.ManyToManyField('EmailNotification', blank=True)
    periodicite = models.CharField(max_length=10, choices=PERIODICITE_CHOICES)
    last_execution = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    date_activation = models.DateTimeField(null=True, blank=True, help_text="Date et heure de lancement de la configuration")
    date_desactivation = models.DateTimeField(null=True, blank=True, help_text="Date et heure de désactivation de la configuration")

    def __str__(self):
        return self.nom

    def get_periodicite_timedelta(self):
        """Convertit la périodicité en timedelta"""
        periodicite_map = {
            '2min': timedelta(minutes=2),
            '2h': timedelta(hours=2),
            '6h': timedelta(hours=6),
            '1j': timedelta(days=1),
            '1s': timedelta(weeks=1),
            '1m': timedelta(days=30),  # Approximation pour 1 mois
        }
        return periodicite_map.get(self.periodicite, timedelta(days=1))

    def get_next_execution_time(self):
        """Calcule la prochaine heure d'exécution en tenant compte de la périodicité et de la date de désactivation"""
        now = timezone.now()

        # Si la configuration n'est pas active, retourner None
        if not self.is_active:
            return None

        # Vérifier plage d'activation
        if self.date_activation and now < self.date_activation:
            return self.date_activation

        # Déterminer le temps de base
        base_time = self.last_execution or self.date_activation or now

        # Boucler pour trouver la prochaine exécution après maintenant
        next_time = base_time + self.get_periodicite_timedelta()
        while next_time < now:
            next_time += self.get_periodicite_timedelta()

        # Si dépasse date de désactivation
        if self.date_desactivation and next_time > self.date_desactivation:
            return None

        return next_time

    # Debut retourne heure diff / script
   
    def get_next_executions_within(self, hours_ahead=24):
        """Renvoie toutes les heures d'exécution prévues dans les prochaines heures_ahead heures"""
        now = timezone.now()
        limit_time = now + timedelta(hours=hours_ahead)

        if not self.is_active:
            return []

        base_time = self.last_execution or self.date_activation or now
        executions = []

        # Calculer la première exécution après maintenant
        next_time = base_time
        while next_time <= now:
            next_time += self.get_periodicite_timedelta()

        # Générer toutes les exécutions jusqu'à limit_time
        while next_time <= limit_time:
            if self.date_desactivation and next_time > self.date_desactivation:
                break
            executions.append(next_time)
            next_time += self.get_periodicite_timedelta()

        return executions


    # 

    def is_due_for_execution(self):
        """Vérifie si la configuration doit être exécutée maintenant"""
        next_time = self.get_next_execution_time()
        if not next_time:
            return False
        return timezone.now() >= next_time

    @classmethod
    def get_configurations_to_execute(cls):
        """Retourne les configurations qui doivent être exécutées maintenant"""
        return [config for config in cls.objects.filter(is_active=True) 
                if config.is_due_for_execution()]

    @classmethod
    def get_next_scheduled_configurations(cls, limit_hours=24):
        """
        Retourne les configurations planifiées dans les prochaines heures
        avec leur heure d'exécution prévue
        """
        now = timezone.now()
        limit_time = now + timedelta(hours=limit_hours)
        
        scheduled_configs = []
        
        for config in cls.objects.filter(is_active=True):
            next_time = config.get_next_execution_time()
            if next_time and now <= next_time <= limit_time:
                scheduled_configs.append({
                    'configuration': config,
                    'next_execution': next_time,
                    'scripts': list(config.scripts.all()),
                    'time_until_execution': next_time - now
                })
        
        # Trier par heure d'exécution
        scheduled_configs.sort(key=lambda x: x['next_execution'])
        return scheduled_configs

    @classmethod
    def get_overdue_configurations(cls):
        """Retourne les configurations en retard d'exécution"""
        overdue_configs = []
        
        for config in cls.objects.filter(is_active=True):
            if config.last_execution:
                expected_next = config.last_execution + config.get_periodicite_timedelta()
                if timezone.now() > expected_next:
                    overdue_configs.append({
                        'configuration': config,
                        'expected_time': expected_next,
                        'delay': timezone.now() - expected_next,
                        'scripts': list(config.scripts.all())
                    })
        
        return overdue_configs

    class Meta:
        verbose_name = "Configuration Test"
        verbose_name_plural = "Configurations Test"
        ordering = ['nom']


# Fin

class ExecutionTest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('running', 'En cours'),
        ('done', 'Concluant'),
        ('error', 'Non concluant'),
        ('non_executed', 'Non exécuté'),  
    ]
    configuration = models.ForeignKey(ConfigurationTest, on_delete=models.CASCADE)
    statut = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    log_fichier = models.FileField(upload_to="logs/", null=True, blank=True)
    rapport = models.TextField(blank=True)
    ticket_redmine_id = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.configuration.nom} - {self.statut}"

    @property
    def resultat_interprete(self):
        if self.statut == 'done':
            return "Concluant"
        elif self.statut == 'error':
            return "Non concluant"
        elif self.statut == 'pending':
            return "En attente d'exécution"
        elif self.statut == 'running':
            return "En cours d'exécution"
        elif self.statut == 'non_executed':
            return "Non exécuté"
        return "Statut inconnu"



class ExecutionResult(models.Model):
    execution = models.ForeignKey(ExecutionTest, on_delete=models.CASCADE, related_name='resultats')
    script = models.ForeignKey(Script, on_delete=models.CASCADE)
    statut = models.CharField(max_length=20, choices=ExecutionTest.STATUS_CHOICES)
    log_fichier = models.FileField(upload_to="logs/", null=True, blank=True)
    commentaire = models.TextField(blank=True)

    def __str__(self):
        return f"{self.script.nom} - {self.get_statut_display()}"

    @property
    def resultat_interprete(self):
        if self.statut == 'done':
            return "Concluant"
        elif self.statut == 'error':
            return "Non concluant"
        elif self.statut == 'pending':
            return "En attente"
        elif self.statut == 'running':
            return "En cours"
        return "Statut inconnu"
   
    class Meta:
        verbose_name = "Résultat d'exécution de script"
        verbose_name_plural = "Résultats des scripts"


class TicketRedmine:
    # modèle factice, non lié à la DB
    def __init__(self, id, sujet, url, projet_nom):
        self.id = id
        self.sujet = sujet
        self.url = url
        self.projet_nom = projet_nom
        

# Fake data
from django.db import models

class Dashboard(models.Model):
    class Meta:
        verbose_name_plural = "Dashboard"
        verbose_name = "Dashboard"
        managed = False  # toujours pas de table
        default_permissions = ()  # désactive add/change/delete/view auto

   
# core/models.py

from django.db import models

class VueGlobale(models.Model):
    class Meta:
        verbose_name = "Vue Globale"
        verbose_name_plural = "Vue Globale"
        managed = False  # Pas de table en base de données

# core/models.py

from django.db import models
from django.utils import timezone
from dateutil.parser import parse as parse_datetime

class Configuration(models.Model):
    redmine_url = models.URLField("URL Redmine", blank=True, null=True)
    redmine_api_key = models.CharField("Clé API Redmine", max_length=255, blank=True, null=True)
    email_host_user = models.EmailField("Email Host User", blank=True, null=True)
    email_host_password = models.CharField("Mot de passe Email", max_length=255, blank=True, null=True)
    last_sync = models.DateTimeField("Dernière synchronisation", null=True, blank=True, default=timezone.now)

    class Meta:
        verbose_name = "Paramètre global"
        verbose_name_plural = "Paramètres globaux"

    def __str__(self):
        return "Paramètres globaux"
    
    def sync_redmine_projects(self):
        """Synchronise tous les projets Redmine et les enregistre en base avec homepage corrigé"""
        if not self.redmine_url or not self.redmine_api_key:
            return False, "URL Redmine ou clé API manquante"

        base_url = self.redmine_url.rstrip('/')
        endpoint = f"{base_url}/projects.json"
        headers = {'X-Redmine-API-Key': self.redmine_api_key}
        params = {'limit': 100, 'offset': 0}

        total_count = 0
        now_naive = timezone.now().replace(tzinfo=None)

        try:
            while True:
                response = requests.get(endpoint, headers=headers, params=params)
                response.raise_for_status()
                data = response.json()
                projects = data.get('projects', [])
                if not projects:
                    break

                for project in projects:
                    parent_name = project.get('parent', {}).get('name', '') if project.get('parent') else ''
                    created_on = parse_datetime(project['created_on']).replace(tzinfo=None) if project.get('created_on') else None
                    updated_on = parse_datetime(project['updated_on']).replace(tzinfo=None) if project.get('updated_on') else None

                    # Gestion du homepage
                    homepage = project.get('homepage', '')
                    if homepage and not homepage.startswith(('http://', 'https://')):
                        homepage = 'https://' + homepage

                    obj, created = RedmineProject.objects.update_or_create(
                        project_id=project['id'],
                        defaults={
                            'name': project.get('name', ''),
                            'identifier': project.get('identifier', ''),
                            'description': project.get('description', ''),
                            'homepage': homepage,
                            'parent_name': parent_name,
                            'status': project.get('status', 0),
                            'is_public': project.get('is_public', False),
                            'created_on': created_on,
                            'updated_on': updated_on,
                            'last_sync': now_naive
                        }
                    )
                    total_count += 1

                if len(projects) < params['limit']:
                    break
                params['offset'] += params['limit']

            return True, f"{total_count} projets synchronisés avec succès"

        except Exception as e:
            return False, f"Erreur lors de la synchronisation : {e}"

class RedmineProject(models.Model):
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
    last_sync = models.DateTimeField("Dernière synchronisation", null=True, blank=True, default=timezone.now)

    def __str__(self):
        return f"{self.name} ({self.identifier})"

    class Meta:
        verbose_name = "Projet Redmine"
        verbose_name_plural = "Projets Redmine"