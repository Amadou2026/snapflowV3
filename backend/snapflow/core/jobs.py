# core/jobs.py
from django.utils.timezone import now
from django.db.models import Q
from datetime import timedelta
import logging

from core.models import ConfigurationTest, ExecutionTest

logger = logging.getLogger(__name__)

# Définition des périodicités
PERIODICITE_DELTA = {
    '2min': timedelta(minutes=2),
    '2h': timedelta(hours=2),
    '6h': timedelta(hours=6),
    '1j': timedelta(days=1),
    '1s': timedelta(weeks=1),
    '1m': timedelta(days=30),
}

def execute_pending_tests():
    current_time = now()
    logger.info(f"🕒 Début vérification des tests à exécuter - {current_time}")
    print(f"🕒 Début vérification des tests à exécuter - {current_time}")

    # Configurations actives et valides dans la période
    active_configs = ConfigurationTest.objects.filter(
        is_active=True
    ).filter(
        Q(date_activation__lte=current_time) | Q(date_activation__isnull=True)
    ).filter(
        Q(date_desactivation__gt=current_time) | Q(date_desactivation__isnull=True)
    )

    logger.info(f"📊 {active_configs.count()} configuration(s) active(s) trouvée(s)")
    print(f"📊 {active_configs.count()} configuration(s) active(s) trouvée(s)")

    for config in active_configs:
        logger.info(f"🔍 Vérification configuration: {config.nom} (Périodicité: {config.periodicite})")
        print(f"🔍 Vérification configuration: {config.nom} (Périodicité: {config.periodicite})")

        delta = PERIODICITE_DELTA.get(config.periodicite)
        if not delta:
            logger.warning(f"⚠️ Périodicité inconnue pour {config.nom} : {config.periodicite}")
            print(f"⚠️ Périodicité inconnue pour {config.nom} : {config.periodicite}")
            continue

        last_exec = config.last_execution
        logger.info(f"⏰ Dernière exécution: {last_exec}")
        print(f"⏰ Dernière exécution: {last_exec}")

        if not last_exec:
            # Aucun test encore exécuté → créer une première exécution
            logger.info(f"🚀 Première exécution pour : {config.nom}")
            print(f"🚀 Première exécution pour : {config.nom}")
            
            execution = ExecutionTest.objects.create(configuration=config, statut='pending')
            config.last_execution = current_time
            config.save()
            
            logger.info(f"✅ Execution créée: {execution.id}")
            print(f"✅ Execution créée: {execution.id}")
        else:
            time_since_last = current_time - last_exec
            logger.info(f"⏱️ Temps écoulé depuis dernière exécution: {time_since_last}")
            print(f"⏱️ Temps écoulé depuis dernière exécution: {time_since_last}")
            print(f"📅 Delta requis: {delta}")

            # Vérifier si on a dépassé le double du délai → alors test oublié
            if time_since_last >= 2 * delta:
                logger.warning(f"❌ Test oublié pour : {config.nom} - Temps écoulé: {time_since_last}")
                print(f"❌ Test oublié pour : {config.nom} - Temps écoulé: {time_since_last}")
                
                execution = ExecutionTest.objects.create(configuration=config, statut='non_executed')
                config.last_execution = current_time
                config.save()
                
                logger.info(f"✅ Execution 'non_executed' créée: {execution.id}")
                print(f"✅ Execution 'non_executed' créée: {execution.id}")

            elif time_since_last >= delta:
                logger.info(f"🚀 Exécution planifiée pour : {config.nom}")
                print(f"🚀 Exécution planifiée pour : {config.nom}")
                
                execution = ExecutionTest.objects.create(configuration=config, statut='pending')
                config.last_execution = current_time
                config.save()
                
                logger.info(f"✅ Execution 'pending' créée: {execution.id}")
                print(f"✅ Execution 'pending' créée: {execution.id}")
            else:
                temps_restant = delta - time_since_last
                logger.info(f"⏸️ Trop tôt pour {config.nom} - Temps restant: {temps_restant}")
                print(f"⏸️ Trop tôt pour {config.nom} - Temps restant: {temps_restant}")

    logger.info(f"✅ Fin vérification des tests")
    print(f"✅ Fin vérification des tests")