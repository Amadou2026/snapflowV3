# core/apps.py
from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'
    
    scheduler_started = False  # Variable de classe pour éviter les doubles démarrages

    def ready(self):
        """
        Appelé au démarrage de Django.
        Démarre le scheduler et charge les signaux.
        """
        # Éviter le double chargement lors du rechargement automatique en dev
        import sys
        
        # En production, RUN_MAIN n'existe pas, donc on démarre toujours
        # En dev, on démarre seulement dans le processus principal
        run_main = 'runserver' not in sys.argv
        
        if run_main or not CoreConfig.scheduler_started:
            try:
                # Import des signaux (AVANT le scheduler pour que tout soit prêt)
                from . import signals
                logger.info("✅ Signaux Django chargés")
                print("✅ Signaux Django chargés")
                
                # Démarrage du scheduler
                from .scheduler import start_scheduler
                logger.info("🚀 Tentative de démarrage du scheduler...")
                print("🚀 Tentative de démarrage du scheduler...")
                
                start_scheduler()  # ⚠️ PAS dans un thread - APScheduler gère déjà les threads
                
                CoreConfig.scheduler_started = True
                logger.info("✅ Application Core initialisée avec succès")
                print("✅ Application Core initialisée avec succès")
                
            except Exception as e:
                logger.error(f"❌ Erreur lors de l'initialisation: {e}", exc_info=True)
                print(f"❌ Erreur lors de l'initialisation: {e}")
                import traceback
                traceback.print_exc()