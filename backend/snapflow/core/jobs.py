
from django.utils.timezone import now
from django.db.models import Q
from datetime import timedelta

from core.models import ConfigurationTest, ExecutionTest

# Définition des périodicités
PERIODICITE_DELTA = {
    '2min': timedelta(minutes=2),
    '2h': timedelta(hours=2),
    '6h': timedelta(hours=6),
    '1j': timedelta(days=1),
    '1s': timedelta(weeks=1),
    '1m': timedelta(days=30),  # approximatif
}

def execute_pending_tests():
    current_time = now()

    # Configurations actives et valides dans la période
    active_configs = ConfigurationTest.objects.filter(
        is_active=True
    ).filter(
        Q(date_activation__lte=current_time) | Q(date_activation__isnull=True)
    ).filter(
        Q(date_desactivation__gt=current_time) | Q(date_desactivation__isnull=True)
    )

    for config in active_configs:
        delta = PERIODICITE_DELTA.get(config.periodicite)
        if not delta:
            print(f"⚠️ Périodicité inconnue pour {config.nom} : {config.periodicite}")
            continue

        last_exec = config.last_execution
        if not last_exec:
            # Aucun test encore exécuté → créer une première exécution
            print(f"🚀 Première exécution prévue pour : {config.nom}")
            ExecutionTest.objects.create(configuration=config, statut='pending')
            config.last_execution = current_time
            config.save()
        else:
            time_since_last = current_time - last_exec

            # Vérifier si on a dépassé le double du délai → alors test oublié
            if time_since_last >= 2 * delta:
                print(f"❌ Test oublié pour : {config.nom} — Ajout d'une exécution non_executed")
                ExecutionTest.objects.create(configuration=config, statut='non_executed')

                # On met à jour la date d'exécution pour éviter plusieurs `non_executed` à la suite
                config.last_execution = current_time
                config.save()

            elif time_since_last >= delta:
                print(f"🚀 Exécution planifiée pour : {config.nom}")
                ExecutionTest.objects.create(configuration=config, statut='pending')
                config.last_execution = current_time
                config.save()
            else:
                print(f"⏸️ Trop tôt pour exécuter à nouveau {config.nom}")
