from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings
from django.utils import timezone


def populate_initial_data(apps, schema_editor):
    EmailNotification = apps.get_model('core', 'EmailNotification')
    Societe = apps.get_model('core', 'Societe')
    User = apps.get_model('auth', 'User')
    
    # Récupérez ou créez une société par défaut
    societe = Societe.objects.first()
    if not societe:
        print("Création d'une société par défaut...")
        societe = Societe.objects.create(
            nom="Société par défaut",
            url="",
            employes=0
        )
    
    # Récupérez un utilisateur admin
    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        admin_user = User.objects.first()
    
    # Mettez à jour tous les enregistrements existants
    for email_notif in EmailNotification.objects.all():
        if not hasattr(email_notif, 'societe') or email_notif.societe is None:
            email_notif.societe = societe
        if not hasattr(email_notif, 'est_actif'):
            email_notif.est_actif = True
        email_notif.save()
    
    print(f"Données mises à jour pour {EmailNotification.objects.count()} enregistrements")


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0048_merge_20251003_0901'),
    ]

    operations = [
        # Ajouter societe_id
        migrations.AddField(
            model_name='emailnotification',
            name='societe',
            field=models.ForeignKey(
                null=True,
                blank=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name='emails_notification',
                to='core.societe',
            ),
        ),
        # Ajouter date_creation
        migrations.AddField(
            model_name='emailnotification',
            name='date_creation',
            field=models.DateTimeField(auto_now_add=True, null=True),
        ),
        # Ajouter est_actif
        migrations.AddField(
            model_name='emailnotification',
            name='est_actif',
            field=models.BooleanField(default=True, help_text='Indique si cet email reçoit des notifications'),
        ),
        # Peupler les données
        migrations.RunPython(populate_initial_data),
    ]