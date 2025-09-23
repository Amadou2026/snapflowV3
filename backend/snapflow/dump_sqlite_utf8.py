import os
import django
from django.core.management import call_command

# Définit le module settings exact
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "snapflow.settings")

# Initialisation de Django
django.setup()

# Dump SQLite en JSON UTF-8 sans BOM
with open("data.json", "w", encoding="utf-8") as f:
    call_command(
        "dumpdata",
        "--exclude=contenttypes",
        "--exclude=auth.Permission",
        "--exclude=core.dashboard",
        "--exclude=core.vueglobale",
        "--indent", "2",
        stdout=f
    )

print("data.json créé avec succès (UTF-8 sans BOM).")
