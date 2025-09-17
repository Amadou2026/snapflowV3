from django.core.management.base import BaseCommand
from django.core.exceptions import ImproperlyConfigured
from core.models import Configuration

class Command(BaseCommand):
    help = 'Synchronise les projets Redmine avec la configuration'

    def handle(self, *args, **options):
        self.stdout.write('Début de la synchronisation des projets Redmine...')
        
        try:
            config = Configuration.objects.first()
            if not config:
                raise ImproperlyConfigured("Configuration non trouvée")
            
            success, message = config.sync_redmine_projects()
            
            if success:
                self.stdout.write(
                    self.style.SUCCESS(message)
                )
            else:
                self.stdout.write(
                    self.style.ERROR(message)
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Erreur: {e}')
            )