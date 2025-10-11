# core/management/commands/test_scheduler.py
from django.core.management.base import BaseCommand
from core.scheduler import get_scheduler_status, scheduler
from core.jobs import execute_pending_tests
from core.models import ConfigurationTest, ExecutionTest
import time

class Command(BaseCommand):
    help = 'Teste le scheduler et l\'exécution des tests'

    def add_arguments(self, parser):
        parser.add_argument(
            '--status',
            action='store_true',
            help='Affiche le statut du scheduler',
        )
        parser.add_argument(
            '--execute',
            action='store_true',
            help='Exécute manuellement execute_pending_tests()',
        )
        parser.add_argument(
            '--watch',
            action='store_true',
            help='Surveille le scheduler pendant 60 secondes',
        )

    def handle(self, *args, **options):
        if options['status']:
            self.show_status()
        
        elif options['execute']:
            self.execute_manually()
        
        elif options['watch']:
            self.watch_scheduler()
        
        else:
            self.stdout.write(self.style.WARNING('Utilisez --status, --execute, ou --watch'))

    def show_status(self):
        """Affiche le statut du scheduler"""
        self.stdout.write(self.style.SUCCESS('\n=== STATUT DU SCHEDULER ==='))
        
        status = get_scheduler_status()
        self.stdout.write(f"Running: {status['running']}")
        self.stdout.write(f"Nombre de jobs: {status['jobs_count']}")
        
        if status['jobs']:
            self.stdout.write("\nJobs planifiés:")
            for job in status['jobs']:
                self.stdout.write(f"  - {job['name']} (ID: {job['id']})")
                self.stdout.write(f"    Prochaine exécution: {job['next_run']}")
        
        # Configurations actives
        configs = ConfigurationTest.objects.filter(is_active=True)
        self.stdout.write(f"\n📊 Configurations actives: {configs.count()}")
        for config in configs:
            self.stdout.write(f"  - {config.nom} ({config.periodicite})")
            self.stdout.write(f"    Dernière exécution: {config.last_execution}")
        
        # Exécutions récentes
        recent_execs = ExecutionTest.objects.all().order_by('-created_at')[:5]
        self.stdout.write(f"\n📝 5 dernières exécutions:")
        for exec in recent_execs:
            self.stdout.write(f"  - {exec.configuration.nom} | {exec.statut} | {exec.created_at}")

    def execute_manually(self):
        """Exécute manuellement la fonction de vérification"""
        self.stdout.write(self.style.SUCCESS('\n=== EXÉCUTION MANUELLE ==='))
        self.stdout.write('Lancement de execute_pending_tests()...\n')
        
        try:
            execute_pending_tests()
            self.stdout.write(self.style.SUCCESS('\n✅ Exécution terminée avec succès'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n❌ Erreur: {e}'))
            import traceback
            traceback.print_exc()

    def watch_scheduler(self):
        """Surveille le scheduler pendant 60 secondes"""
        self.stdout.write(self.style.SUCCESS('\n=== SURVEILLANCE DU SCHEDULER (60s) ==='))
        
        if not scheduler.running:
            self.stdout.write(self.style.ERROR('❌ Le scheduler n\'est pas démarré!'))
            return
        
        self.stdout.write('Surveillance en cours...\n')
        
        initial_count = ExecutionTest.objects.count()
        
        for i in range(60):
            time.sleep(1)
            current_count = ExecutionTest.objects.count()
            
            if current_count > initial_count:
                self.stdout.write(self.style.SUCCESS(
                    f'\n🎉 Nouvelle exécution détectée! ({current_count - initial_count} nouvelle(s))'
                ))
                initial_count = current_count
            
            if i % 10 == 0 and i > 0:
                self.stdout.write(f'  ... {i}s écoulées')
        
        self.stdout.write(self.style.SUCCESS('\n✅ Surveillance terminée'))