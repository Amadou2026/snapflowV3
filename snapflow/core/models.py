from django.contrib.auth.models import AbstractUser
from django.db import models
from users.managers import CustomUserManager
from django.utils.timezone import now

class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    username = None

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()  # ici on ajoute le manager

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
    nom = models.CharField(max_length=255)
    fichier = models.FileField(upload_to="scripts/")
    axe = models.ForeignKey(Axe, on_delete=models.SET_NULL, null=True)
    sous_axe = models.ForeignKey(SousAxe, on_delete=models.SET_NULL, null=True)

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

    def __str__(self):
        return self.nom

class EmailNotification(models.Model):
    email = models.EmailField(unique=True)

    def __str__(self):
        return self.email

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
    projet = models.ForeignKey(Projet, on_delete=models.CASCADE)
    scripts = models.ManyToManyField(Script)
    emails_notification = models.ManyToManyField(EmailNotification, blank=True)
    periodicite = models.CharField(max_length=10, choices=PERIODICITE_CHOICES)
    last_execution = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)  # Ajout du champ is_active

    def __str__(self):
        return self.nom



class ExecutionTest(models.Model):
    STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('running', 'En cours'),
        ('done', 'Terminé'),
        ('error', 'Erreur'),
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

class TicketRedmine:
    # modèle factice, non lié à la DB
    def __init__(self, id, sujet, url, projet_nom):
        self.id = id
        self.sujet = sujet
        self.url = url
        self.projet_nom = projet_nom
        

from django.db import models

class Dashboard(models.Model):
    class Meta:
        verbose_name_plural = "Dashboard"
        verbose_name = "Dashboard"
        managed = False  # Pas de table créée
   
    
    