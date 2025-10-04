# core/management/commands/debug_config_creation.py
from django.core.management.base import BaseCommand
from core.models import ConfigurationTest, Societe, Projet
from django.utils.timezone import now

class Command(BaseCommand):
    help = 'Debug urgent de la création de configuration'

    def handle(self, *args, **options):
        self.stdout.write("🚨 DEBUG URGENT - Création Configuration")
        
        try:
            societe = Societe.objects.first()
            projet = Projet.objects.first()
            
            self.stdout.write(f"Société: {societe}")
            self.stdout.write(f"Projet: {projet}")
            
            # Test 1: Création directe
            self.stdout.write("\n1. Création directe...")
            config = ConfigurationTest.objects.create(
                nom="DEBUG URGENT",
                societe=societe,
                projet=projet,
                periodicite="2h",
                is_active=True,
                date_activation=now()
            )
            self.stdout.write(f"✅ Config créée: {config.id}")
            
            # Vérification immédiate
            exists = ConfigurationTest.objects.filter(id=config.id).exists()
            self.stdout.write(f"🔍 Existe immédiatement: {exists}")
            
            # Attendre 2 secondes
            import time
            time.sleep(2)
            
            # Vérification après attente
            exists_after = ConfigurationTest.objects.filter(id=config.id).exists()
            self.stdout.write(f"🔍 Existe après 2s: {exists_after}")
            
            # Lister TOUTES les configs
            self.stdout.write("\n📋 TOUTES les configurations:")
            all_configs = ConfigurationTest.objects.all()
            self.stdout.write(f"Total: {all_configs.count()}")
            for c in all_configs:
                self.stdout.write(f"   - {c.id}: {c.nom}")
                
            if not exists_after:
                self.stdout.write("❌❌❌ CRITIQUE: La configuration a DISPARU!")
                
        except Exception as e:
            self.stdout.write(f"❌ Erreur: {str(e)}")