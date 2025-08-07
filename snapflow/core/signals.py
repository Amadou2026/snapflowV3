# core/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ExecutionTest, ExecutionResult
from .runner import lancer_scripts_pour_execution
import threading

@receiver(post_save, sender=ExecutionTest)
def lancer_execution_apres_creation(sender, instance, created, **kwargs):
    if created:
        # Créer automatiquement un ExecutionResult par script de la config
        configuration = instance.configuration
        for script in configuration.scripts.all():
            ExecutionResult.objects.create(
                execution=instance,
                script=script,
                statut='pending'  # initialement en attente
            )

        # Lancer l'exécution dans un thread si statut pending
        if instance.statut == 'pending':
            threading.Thread(target=lancer_scripts_pour_execution, args=(instance.id,)).start()
