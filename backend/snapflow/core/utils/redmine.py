import requests
from django.conf import settings

def get_last_redmine_tickets(project_id, limit=10):
    if not settings.REDMINE_URL or not settings.REDMINE_API_KEY:
        raise ValueError("REDMINE_URL ou REDMINE_API_KEY non configurés")

    url = f"{settings.REDMINE_URL}/projects/{project_id}/issues.json?limit={limit}&sort=updated_on:desc"
    headers = {"X-Redmine-API-Key": settings.REDMINE_API_KEY}

    response = requests.get(url, headers=headers)
    response.raise_for_status()

    data = response.json()
    issues = data.get('issues', [])
    # Ajoute ici des infos utiles à chaque ticket, comme URL
    for issue in issues:
        issue['url'] = f"{settings.REDMINE_URL}/issues/{issue['id']}"
    return issues
