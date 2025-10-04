# core/apps.py
from django.apps import AppConfig
import threading
import logging

logger = logging.getLogger(__name__)

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        # Éviter le double chargement dans le shell Django
        import os
        if os.environ.get('RUN_MAIN') or not os.environ.get('DJANGO_AUTORELOAD'):
            try:
                # Démarrage du scheduler dans un thread
                from .scheduler import start_scheduler
                logger.info("🚀 Démarrage du scheduler...")
                print("🚀 Démarrage du scheduler...")
                threading.Thread(target=start_scheduler, daemon=True).start()

                # Import des signaux
                from . import signals
                logger.info("✅ Signaux chargés")
                print("✅ Signaux chargés")
                
            except Exception as e:
                logger.error(f"❌ Erreur lors du démarrage: {e}")
                print(f"❌ Erreur lors du démarrage: {e}")