from django.db import migrations

def remplir_donnees_manquantes(apps, schema_editor):
    EmailNotification = apps.get_model('core', 'EmailNotification')
    Societe = apps.get_model('core', 'Societe')
    User = apps.get_model('auth', 'User')
    
    # Récupérez une société existante (créez-en une si nécessaire)
    societe = Societe.objects.first()
    if not societe:
        societe = Societe.objects.create(nom="Société par défaut")
    
    # Récupérez un utilisateur admin
    admin_user = User.objects.filter(is_superuser=True).first()
    if not admin_user:
        admin_user = User.objects.first()
    
    # Mettez à jour les enregistrements existants
    if societe and admin_user:
        EmailNotification.objects.filter(societe__isnull=True).update(societe=societe)
        EmailNotification.objects.filter(created_by__isnull=True).update(created_by=admin_user)

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0045_alter_emailnotification_options_and_more'),  # Remplacez par le numéro correct
    ]
    
    operations = [
        migrations.RunPython(remplir_donnees_manquantes),
    ]