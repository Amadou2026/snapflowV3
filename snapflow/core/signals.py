from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ExecutionTest
from .runner import lancer_scripts_pour_execution
import threading

@receiver(post_save, sender=ExecutionTest)
def lancer_execution_apres_creation(sender, instance, created, **kwargs):
    if created and instance.statut == 'pending':
        threading.Thread(target=lancer_scripts_pour_execution, args=(instance.id,)).start()
