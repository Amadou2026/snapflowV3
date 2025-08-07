# core/scheduler.py
from apscheduler.schedulers.background import BackgroundScheduler
from core.jobs import execute_pending_tests

scheduler = BackgroundScheduler()

def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(execute_pending_tests, 'interval', minutes=1)
        scheduler.start()

