# management/commands/show_scheduled_scripts.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from ...models import ConfigurationTest
from core.views import get_next_scripts_for_project


class Command(BaseCommand):
    help = 'Affiche les prochains scripts planifiés'

    def add_arguments(self, parser):
        parser.add_argument(
            '--hours',
            type=int,
            default=24,
            help='Nombre d\'heures à regarder en avant (défaut: 24)'
        )
        parser.add_argument(
            '--project',
            type=int,
            help='ID du projet à filtrer'
        )
        parser.add_argument(
            '--show-overdue',
            action='store_true',
            help='Afficher les configurations en retard'
        )
        parser.add_argument(
            '--execute-now',
            action='store_true',
            help='Afficher les configurations à exécuter maintenant'
        )

    def handle(self, *args, **options):
        hours = options['hours']
        project_id = options.get('project')
        show_overdue = options['show_overdue']
        execute_now = options['execute_now']

        if execute_now:
            self.show_configurations_to_execute()
        elif show_overdue:
            self.show_overdue_configurations()
        else:
            self.show_scheduled_configurations(hours, project_id)

    def show_scheduled_configurations(self, hours, project_id=None):
        """Affiche les configurations planifiées"""
        if project_id:
            
            scheduled = get_next_scripts_for_project(project_id, hours)
            
            # 🔹 Debug : afficher ce qui a été récupéré
            self.stdout.write(f"DEBUG scheduled (project {project_id}): {scheduled}")
            
            self.stdout.write(
                self.style.SUCCESS(f'Prochains scripts du projet {project_id} dans les {hours} prochaines heures:')
            )
            
            for item in scheduled:
                # 🔹 Debug : afficher chaque item
                self.stdout.write(f"DEBUG item: {item}")
                
                self.stdout.write(f"\n📅 {item['execution_time'].strftime('%Y-%m-%d %H:%M:%S')}")
                self.stdout.write(f"   Script: {getattr(item['script'], 'nom', str(item['script']))}")
                self.stdout.write(f"   Configuration: {item['configuration'].nom}")
                self.stdout.write(f"   Dans: {self._format_timedelta(item['time_until'])}")
        else:
            scheduled = ConfigurationTest.get_next_scheduled_configurations(hours)
            
            # 🔹 Debug : afficher ce qui a été récupéré
            self.stdout.write(f"DEBUG scheduled: {scheduled}")
            
            self.stdout.write(
                self.style.SUCCESS(f'Prochains scripts planifiés dans les {hours} prochaines heures:')
            )
            
            for item in scheduled:
                # 🔹 Debug : afficher chaque item
                self.stdout.write(f"DEBUG item: {item}")
                
                self.stdout.write(f"\n{item['next_execution'].strftime('%Y-%m-%d %H:%M:%S')}")
                self.stdout.write(f"   Configuration: {item['configuration'].nom}")
                self.stdout.write(f"   Projet: {getattr(item['configuration'].projet, 'nom', str(item['configuration'].projet))}")
                script_names = [getattr(s, 'nom', str(s)) for s in item['scripts']]
                self.stdout.write(f"   Scripts: {', '.join(script_names)}")
                self.stdout.write(f"   Dans: {self._format_timedelta(item['time_until_execution'])}")

        if not scheduled:
            self.stdout.write(self.style.WARNING('Aucun script planifié trouvé.'))

    def show_configurations_to_execute(self):
        """Affiche les configurations à exécuter maintenant"""
        configurations = ConfigurationTest.get_configurations_to_execute()
        
        self.stdout.write(self.style.SUCCESS('Configurations à exécuter maintenant:'))
        
        for config in configurations:
            self.stdout.write(f"\n🚀 {config.nom}")
            self.stdout.write(f"   Projet: {getattr(config.projet, 'nom', str(config.projet))}")
            script_names = [getattr(s, 'nom', str(s)) for s in config.scripts.all()]
            self.stdout.write(f"   Scripts: {', '.join(script_names)}")
            self.stdout.write(f"   Périodicité: {config.get_periodicite_display()}")
        
        if not configurations:
            self.stdout.write(self.style.WARNING('Aucune configuration à exécuter maintenant.'))

    def show_overdue_configurations(self):
        """Affiche les configurations en retard"""
        overdue = ConfigurationTest.get_overdue_configurations()
        
        self.stdout.write(self.style.ERROR('Configurations en retard:'))
        
        for item in overdue:
            config = item['configuration']
            self.stdout.write(f"\n⚠️  {config.nom}")
            self.stdout.write(f"   Projet: {getattr(config.projet, 'nom', str(config.projet))}")
            self.stdout.write(f"   Attendu à: {item['expected_time'].strftime('%Y-%m-%d %H:%M:%S')}")
            self.stdout.write(f"   Retard: {self._format_timedelta(item['delay'])}")
            script_names = [getattr(s, 'nom', str(s)) for s in item['scripts']]
            self.stdout.write(f"   Scripts: {', '.join(script_names)}")
        
        if not overdue:
            self.stdout.write(self.style.SUCCESS('Aucune configuration en retard.'))

    def _format_timedelta(self, td):
        """Formate un timedelta de manière lisible"""
        total_seconds = int(td.total_seconds())
        
        if total_seconds < 0:
            return f"En retard de {self._format_positive_timedelta(-total_seconds)}"
        
        return self._format_positive_timedelta(total_seconds)

    def _format_positive_timedelta(self, total_seconds):
        """Formate un nombre de secondes positif"""
        days = total_seconds // 86400
        hours = (total_seconds % 86400) // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60

        parts = []
        if days > 0:
            parts.append(f"{days}j")
        if hours > 0:
            parts.append(f"{hours}h")
        if minutes > 0:
            parts.append(f"{minutes}m")
        if seconds > 0 and not parts:  # Afficher les secondes seulement si < 1 minute
            parts.append(f"{seconds}s")

        return " ".join(parts) if parts else "0s"