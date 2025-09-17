# core/management/commands/creer_groupes_predefinis.py
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from core.models import GroupePersonnalise


class Command(BaseCommand):
    help = "Crée les groupes prédéfinis avec leurs permissions"

    def handle(self, *args, **options):
        groupes_predefinis = [
            {
                "nom": "Administrateur",
                "role_predefini": "administrateur",
                "permissions": Permission.objects.all(),  # accès complet
            },
            {
                "nom": "Quality Assurance",
                "role_predefini": "qa",
                "permissions": Permission.objects.filter(
                    codename__in=[
                        "add_script",
                        "change_script",
                        "view_script",
                        "add_executiontest",
                        "change_executiontest",
                        "view_executiontest",
                        "view_executionresult",
                        "view_dashboard",
                    ]
                ),
            },
            {
                "nom": "Développeur",
                "role_predefini": "developpeur",
                "permissions": Permission.objects.filter(
                    codename__in=[
                        "add_script",
                        "change_script",
                        "view_script",
                        "view_executiontest",
                        "view_executionresult",
                    ]
                ),
            },
            {
                "nom": "Manager",
                "role_predefini": "manager",
                "permissions": Permission.objects.filter(
                    codename__in=[
                        "view_dashboard",
                        "view_executionresult",
                        "view_projet",
                        "view_vueglobale",
                    ]
                ),
            },
            {
                "nom": "Chef de projet / Account Manager",
                "role_predefini": "chef_projet",
                "permissions": Permission.objects.filter(
                    codename__in=[
                        "add_projet",
                        "change_projet",
                        "view_projet",
                        "add_script",
                        "change_script",
                        "view_script",
                        "view_executionresult",
                        "view_dashboard",
                    ]
                ),
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
