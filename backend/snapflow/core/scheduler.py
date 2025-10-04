# core/scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from core.jobs import execute_pending_tests
import logging

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()

def start_scheduler():
    if not scheduler.running:
        try:
            scheduler.add_job(execute_pending_tests, 'interval', minutes=1)
            scheduler.start()
            logger.info("✅ Scheduler démarré avec succès")
            print("✅ Scheduler démarré avec succès - Vérification toutes les minutes")
        except Exception as e:
            logger.error(f"❌ Erreur démarrage scheduler: {e}")
            print(f"❌ Erreur démarrage scheduler: {e}")
    else:
        logger.info("ℹ️ Scheduler déjà en cours d'exécution")
        print("ℹ️ Scheduler déjà en cours d'exécution")