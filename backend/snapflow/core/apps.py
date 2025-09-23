from django.apps import AppConfig
import threading

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        # Démarrage du scheduler dans un thread
        from .scheduler import start_scheduler
        threading.Thread(target=start_scheduler).start()

        # Import des signaux (création automatique des groupes prédéfinis)
        from . import signals  # signals.py doit contenir create_predefined_groups
