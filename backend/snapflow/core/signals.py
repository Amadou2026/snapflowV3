from django.db.models.signals import post_save
from django.dispatch import receiver

from snapflow.core.runner import lancer_scripts_pour_execution
from .models import ExecutionTest, ExecutionResult
from .jobs import detecter_scripts_problemes, nettoyer_anciens_problemes_resolus
import threading
from datetime import timedelta
from django.utils import timezone

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

@receiver(post_save, sender=ExecutionTest)
def detecter_problemes_apres_execution(sender, instance, **kwargs):
    """
    Détecte les problèmes après chaque exécution
    """
    # Exécuter la détection dans un thread pour ne pas bloquer
    threading.Thread(target=detecter_scripts_problemes).start()

@receiver(post_save, sender=ExecutionResult)
def detecter_problemes_apres_resultat(sender, instance, **kwargs):
    """
    Détecte les problèmes après chaque résultat d'exécution
    """
    # Si le résultat indique un problème, déclencher la détection
    if instance.statut in ['error', 'timeout']:
        threading.Thread(target=detecter_scripts_problemes).start()