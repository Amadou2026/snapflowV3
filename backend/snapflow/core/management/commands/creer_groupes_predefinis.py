# core/management/commands/creer_groupes_predefinis.py
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from core.models import GroupePersonnalise


class Command(BaseCommand):
    help = "Crée les groupes prédéfinis avec leurs permissions"

    def handle(self, *args, **options):
        # Définition des permissions pour chaque rôle basé sur le tableau
        permissions_par_role = {
            "super-admin": Permission.objects.all(),  # Toutes les permissions
            "admin-societe": Permission.objects.filter(
                codename__in=[
                    "add_groupepersonnalise",
                    "change_groupepersonnalise",
                    "delete_groupepersonnalise",
                    "view_groupepersonnalise",
                    "change_redmineproject",
                    "add_redmineproject",
                    "change_projet",
                    "view_configuration",
                    "change_executionresult",
                    "view_redmineproject",
                    "view_problemescript",
                    "delete_emailnotification",
                    "view_emailnotification",
                    "view_sousaxe",
                    "change_emailnotification",
                    "view_customuser",
                    "delete_configurationtest",
                    "add_customuser",
                    "view_script",
                    "add_emailnotification",
                    "view_executionresult",
                    "add_configuration",
                    "add_executiontest",
                    "delete_societe_configurationtest",
                    "can_view_configurationtest",
                    "delete_redmineproject",
                    "view_dashboard",
                    "view_configurationtest",
                    "view_executiontest",
                    "view_societe_configurationtest",
                    "change_societe",
                    "view_vueglobale",
                    "delete_customuser",
                    "add_configurationtest",
                    "add_executionresult",
                    "change_configuration",
                    "change_societe_configurationtest",
                    "change_configurationtest",
                    "delete_configuration",
                    "view_projet",
                    "change_customuser",
                ]
            ),
            "manager": Permission.objects.filter(
                codename__in=[
                    "add_groupepersonnalise",
                    "change_groupepersonnalise",
                    "view_groupepersonnalise",
                    "change_redmineproject",
                    "add_redmineproject",
                    "change_projet",
                    "view_configuration",
                    "change_executionresult",
                    "view_redmineproject",
                    "view_problemescript",
                    "delete_emailnotification",
                    "view_emailnotification",
                    "view_sousaxe",
                    "change_emailnotification",
                    "view_customuser",
                    "delete_configurationtest",
                    "view_script",
                    "add_emailnotification",
                    "view_executionresult",
                    "add_configuration",
                    "add_executiontest",
                    "delete_societe_configurationtest",
                    "can_view_configurationtest",
                    "view_dashboard",
                    "view_configurationtest",
                    "view_executiontest",
                    "view_societe_configurationtest",
                    "add_configurationtest",
                    "add_executionresult",
                    "change_configuration",
                    "change_societe_configurationtest",
                    "change_script",
                    "change_configurationtest",
                    "delete_configuration",
                    "view_projet",
                    "change_customuser",
                ]
            ),
            "chef_projet": Permission.objects.filter(
                codename__in=[
                    "add_groupepersonnalise",
                    "change_groupepersonnalise",
                    "view_groupepersonnalise",
                    "change_redmineproject",
                    "add_redmineproject",
                    "change_projet",
                    "view_configuration",
                    "change_executionresult",
                    "view_redmineproject",
                    "view_problemescript",
                    "delete_emailnotification",
                    "view_emailnotification",
                    "view_sousaxe",
                    "change_emailnotification",
                    "view_customuser",
                    "delete_configurationtest",
                    "view_script",
                    "add_emailnotification",
                    "view_executionresult",
                    "add_configuration",
                    "add_executiontest",
                    "delete_societe_configurationtest",
                    "can_view_configurationtest",
                    "view_dashboard",
                    "view_configurationtest",
                    "view_executiontest",
                    "view_societe_configurationtest",
                    "add_configurationtest",
                    "add_executionresult",
                    "change_configuration",
                    "change_societe_configurationtest",
                    "change_script",
                    "change_configurationtest",
                    "view_projet",
                    "change_customuser",
                ]
            ),
            "qa": Permission.objects.filter(
                codename__in=[
                    "delete_axe",
                    "change_executionresult",
                    "view_redmineproject",
                    "view_problemescript",
                    "add_sousaxe",
                    "view_sousaxe",
                    "change_emailnotification",
                    "delete_configurationtest",
                    "change_executiontest",
                    "add_axe",
                    "change_sousaxe",
                    "view_script",
                    "add_emailnotification",
                    "view_executionresult",
                    "add_script",
                    "add_configuration",
                    "add_executiontest",
                    "delete_societe_configurationtest",
                    "can_view_configurationtest",
                    "delete_sousaxe",
                    "view_dashboard",
                    "view_configurationtest",
                    "view_executiontest",
                    "view_societe_configurationtest",
                    "add_secteuractivite",
                    "change_axe",
                    "delete_script",
                    "view_projet",
                    "change_customuser",
                ]
            ),
        }

        groupes_predefinis = [
            {
                "nom": "Super-Admin",
                "role_predefini": "super-admin",
                "permissions": permissions_par_role["super-admin"],
            },
            {
                "nom": "Admin Société",
                "role_predefini": "admin-societe", 
                "permissions": permissions_par_role["admin-societe"],
            },
            {
                "nom": "Manager",
                "role_predefini": "manager",
                "permissions": permissions_par_role["manager"],
            },
            {
                "nom": "Chef de Projet",
                "role_predefini": "chef_projet",
                "permissions": permissions_par_role["chef_projet"],
            },
            {
                "nom": "Quality Assurance",
                "role_predefini": "qa",
                "permissions": permissions_par_role["qa"],
            },
        ]

        for groupe_data in groupes_predefinis:
            groupe, created = Group.objects.get_or_create(name=groupe_data["nom"])
            groupe.permissions.set(groupe_data["permissions"])

            GroupePersonnalise.objects.get_or_create(
                nom=groupe_data["nom"],
                defaults={
                    "type_groupe": "predéfini",
                    "role_predefini": groupe_data["role_predefini"],
                    "groupe_django": groupe,
                    "est_protege": True,
                    "description": f'Groupe prédéfini: {groupe_data["nom"]}',
                },
            )

        self.stdout.write(self.style.SUCCESS("Groupes prédéfinis créés avec succès"))