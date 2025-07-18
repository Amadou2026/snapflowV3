from django.apps import AppConfig
import threading

class CoreConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core'

    def ready(self):
        from .scheduler import start_scheduler
        from . import signals
        threading.Thread(target=start_scheduler).start()
