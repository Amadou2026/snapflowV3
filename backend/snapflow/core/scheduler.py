# core/scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from django.conf import settings
import logging
import atexit

logger = logging.getLogger(__name__)

# Instance globale du scheduler
scheduler = BackgroundScheduler({
    'apscheduler.timezone': 'UTC',  # ou votre timezone
    'apscheduler.job_defaults.coalesce': True,
    'apscheduler.job_defaults.max_instances': 1,  # Une seule instance à la fois
})

def start_scheduler():
    """
    Démarre le scheduler APScheduler pour l'exécution périodique des tests.
    """
    if scheduler.running:
        logger.warning("⚠️ Scheduler déjà en cours d'exécution")
        print("⚠️ Scheduler déjà en cours d'exécution")
        return
    
    try:
        from core.jobs import execute_pending_tests
        
        # Ajouter le job avec un ID unique
        scheduler.add_job(
            func=execute_pending_tests,
            trigger=IntervalTrigger(minutes=1),
            id='execute_pending_tests',
            name='Vérification des tests en attente',
            replace_existing=True,  # Remplace si existe déjà
            max_instances=1  # Une seule instance à la fois
        )
        
        # Démarrer le scheduler
        scheduler.start()
        
        logger.info("✅ Scheduler démarré avec succès")
        print("✅ Scheduler démarré avec succès - Vérification toutes les minutes")
        print(f"📊 Jobs planifiés: {len(scheduler.get_jobs())}")
        
        # Afficher les jobs pour débugger
        for job in scheduler.get_jobs():
            print(f"  - Job: {job.name} | Prochaine exécution: {job.next_run_time}")
        
        # Arrêter proprement le scheduler à la fermeture de Django
        atexit.register(lambda: shutdown_scheduler())
        
    except Exception as e:
        logger.error(f"❌ Erreur démarrage scheduler: {e}", exc_info=True)
        print(f"❌ Erreur démarrage scheduler: {e}")
        import traceback
        traceback.print_exc()

def shutdown_scheduler():
    """
    Arrête proprement le scheduler.
    """
    if scheduler.running:
        logger.info("🛑 Arrêt du scheduler...")
        print("🛑 Arrêt du scheduler...")
        scheduler.shutdown(wait=False)
        logger.info("✅ Scheduler arrêté")
        print("✅ Scheduler arrêté")

def get_scheduler_status():
    """
    Retourne le statut du scheduler (utile pour le débogage).
    """
    return {
        'running': scheduler.running,
        'jobs_count': len(scheduler.get_jobs()),
        'jobs': [
            {
                'id': job.id,
                'name': job.name,
                'next_run': str(job.next_run_time)
            }
            for job in scheduler.get_jobs()
        ]
    }