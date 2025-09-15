from django.contrib.auth.models import AbstractUser
from django.db import models
from users.managers import CustomUserManager
from django.utils.timezone import now

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    username = None

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()  

    def __str__(self):
        return self.email


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
    priorite = models.PositiveSmallIntegerField(choices=PRIORITY_CHOICES, default=2)

    def __str__(self):
        return f"{self.axe.nom}/{self.sous_axe.nom}/{self.nom}"



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
        managed = False  # Pas de table créée
   
# core/models.py

from django.db import models

class VueGlobale(models.Model):
    class Meta:
        verbose_name = "Vue Globale"
        verbose_name_plural = "Vue Globale"
        managed = False  # Pas de table en base de données

# core/models.py

from django.db import models

class Configuration(models.Model):
    redmine_url = models.URLField("URL Redmine", blank=True, null=True)
    redmine_api_key = models.CharField("Clé API Redmine", max_length=255, blank=True, null=True)
    email_host_user = models.EmailField("Email Host User", blank=True, null=True)
    email_host_password = models.CharField("Mot de passe Email", max_length=255, blank=True, null=True)

    class Meta:
        verbose_name = "Paramètre global"
        verbose_name_plural = "Paramètres globaux"

    def __str__(self):
        return "Paramètres globaux"
