from datetime import timedelta
from django.utils.timezone import now
import threading

from core.models import ConfigurationTest, ExecutionTest


PERIODICITE_DELTA = {
    '2min': timedelta(minutes=2),
    '2h': timedelta(hours=2),
    '6h': timedelta(hours=6),
    '1j': timedelta(days=1),
    '1s': timedelta(weeks=1),
    '1m': timedelta(days=30),  # approximation
}
job_lock = threading.Lock()

def execute_pending_tests():
    configs = ConfigurationTest.objects.filter(is_active=True)
    current_time = now()

    for config in configs:
        delta = PERIODICITE_DELTA.get(config.periodicite)
        if not delta:
            continue

        # Si pas de dernière exécution ou si délai écoulé
        if not config.last_execution or (current_time - config.last_execution) >= delta:
            ExecutionTest.objects.create(configuration=config, statut='pending')
            config.last_execution = current_time
            config.save()
