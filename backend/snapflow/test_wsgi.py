"""
Test rapide du fichier WSGI - Une seule commande
Exécutez depuis la racine du projet: python test_wsgi.py
"""

if __name__ == "__main__":
    import sys
    import os
    
    # Vérifier qu'on est dans le bon répertoire
    if not os.path.exists('manage.py'):
        print("❌ Exécutez depuis la racine du projet (où se trouve manage.py)")
        sys.exit(1)
    
    print("🔍 Test du fichier WSGI...\n")
    
    try:
        # Importer l'application WSGI
        from snapflow.wsgi import application
        print("✅ WSGI chargé avec succès!")
        print(f"   Type: {type(application).__name__}")
        
        # Vérifier Django
        from django.conf import settings
        print(f"✅ Django configuré")
        print(f"   DEBUG: {settings.DEBUG}")
        print(f"   BASE_DIR: {settings.BASE_DIR}")
        
        # Tester la base de données
        from django.db import connection
        connection.ensure_connection()
        print(f"✅ Connexion DB OK")
        print(f"   Database: {settings.DATABASES['default']['NAME']}")
        
        print("\n✅ TOUT FONCTIONNE! Prêt pour la production.")
        
        # Proposer de lancer un serveur
        print("\n💡 Pour tester avec un serveur:")
        print("   python manage.py runserver")
        print("   ou: waitress-serve --port=8000 snapflow.wsgi:application")
        
    except Exception as e:
        print(f"❌ ERREUR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)