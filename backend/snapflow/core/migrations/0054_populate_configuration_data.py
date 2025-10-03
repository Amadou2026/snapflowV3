from django.db import migrations

def populate_configuration_data(apps, schema_editor):
    Configuration = apps.get_model('core', 'Configuration')
    Societe = apps.get_model('core', 'Societe')
    RedmineProject = apps.get_model('core', 'RedmineProject')
    
    # 1. Créer des configurations pour les sociétés existantes
    societes_sans_config = Societe.objects.filter(configuration__isnull=True)
    
    for societe in societes_sans_config:
        Configuration.objects.create(
            societe=societe,
            redmine_url="",
            redmine_api_key="",
            email_host_user="",
            email_host_password=""
        )
        print(f"Configuration créée pour {societe.nom}")
    
    # 2. Assigner les projets Redmine existants à une société par défaut
    projets_sans_societe = RedmineProject.objects.filter(societe__isnull=True)
    if projets_sans_societe.exists():
        societe_defaut = Societe.objects.first()
        if societe_defaut:
            projets_sans_societe.update(societe=societe_defaut)
            print(f"{projets_sans_societe.count()} projets Redmine assignés à {societe_defaut.nom}")

class Migration(migrations.Migration):
    dependencies = [
        ('core', '0052_alter_configuration_options_and_more'),  # Remplacez par le bon numéro
    ]
    
    operations = [
        migrations.RunPython(populate_configuration_data),
    ]