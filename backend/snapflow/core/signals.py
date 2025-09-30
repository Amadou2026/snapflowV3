# core/signals.py
from django.db.models.signals import post_save, post_delete
from django.db.models.signals import post_migrate
from django.dispatch import receiver
from .models import ExecutionTest, ExecutionResult
from .runner import lancer_scripts_pour_execution
import threading
from django.contrib.auth.models import Group, Permission
from .models import GroupePersonnalise

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
            
# @receiver(post_save, sender=GroupePersonnalise)
# def sync_group_permissions(sender, instance, created, **kwargs):
#     """Synchronise les permissions entre GroupePersonnalise et Group Django"""
#     if not created:
#         instance.groupe_django.permissions.set(instance.permissions.all())

# @receiver(post_save, sender=Group)
# def create_groupe_personnalise(sender, instance, created, **kwargs):
#     """Crée automatiquement un GroupePersonnalise pour les nouveaux groupes"""
#     if created and not hasattr(instance, 'groupe_personnalise'):
#         GroupePersonnalise.objects.create(
#             nom=instance.name,
#             groupe_django=instance,
#             type_groupe='personnalisé',
#             description='Groupe personnalisé créé automatiquement'
#         )
@receiver(post_migrate)
def create_predefined_groups(sender, **kwargs):
    # Ne pas créer pour les apps qui ne sont pas la notre
    if sender.name != "core":
        return

    # Définir les groupes prédéfinis et leurs permissions (codenames)
    predefined_groups = [
        {
            'nom': 'Administrateur',
            'role_predefini': 'administrateur',
            'perms': ['add_script', 'change_script', 'view_script', 'add_executiontest', 'change_executiontest', 'view_executiontest','add_script', 'change_script', 'view_script','view_dashboard', 'view_executionresult','add_projet', 'change_projet', 'view_projet', 'view_executionresult', 'view_configurationtest', 'delete_configurationtest', 'add_configurationtest', 'change_configurationtest', 'add_emailnotification', 'view_emailnotification', 'change_emailnotification'],
        },
        {
            'nom': 'QA',
            'role_predefini': 'qa',
            'perms': ['add_script', 'change_script', 'view_script', 'add_executiontest', 'change_executiontest', 'view_executiontest'],
        },
        {
            'nom': 'Développeur',
            'role_predefini': 'developpeur',
            'perms': ['add_script', 'change_script', 'view_script'],
        },
        {
            'nom': 'Manager',
            'role_predefini': 'manager',
            'perms': ['view_dashboard', 'view_executionresult'],
        },
        {
            'nom': 'Chef de projet',
            'role_predefini': 'chef_projet',
            'perms': ['add_projet', 'change_projet', 'view_projet', 'view_executionresult'],
        },
    ]

    for g in predefined_groups:
        group, created = Group.objects.get_or_create(name=g['nom'])

        # Créer le GroupePersonnalise correspondant
        grp_perso, created2 = GroupePersonnalise.objects.get_or_create(
            nom=g['nom'],
            defaults={
                'type_groupe': 'predéfini',
                'role_predefini': g['role_predefini'],
                'groupe_django': group,
                'est_protege': True
            }
        )

        # Ajouter les permissions
        if g['perms'] == 'all':
            perms = Permission.objects.all()
            group.permissions.set(perms)
        else:
            perms = Permission.objects.filter(codename__in=g['perms'])
            group.permissions.set(perms)