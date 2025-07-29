import json
import subprocess
import os
import traceback
from django.conf import settings
from django.utils.timezone import now
from django.core.mail import send_mail
import requests
from .models import *


def creer_ticket_redmine(projet_id, sujet, description):
    url = f"{settings.REDMINE_URL}/issues.json"
    headers = {
        "Content-Type": "application/json",
        "X-Redmine-API-Key": settings.REDMINE_API_KEY,
    }

    print(f"Recherche projet avec id_redmine={projet_id}")
    projet = Projet.objects.get(id_redmine=projet_id)

    if projet.id_redmine is None:
        raise ValueError("Ce projet n'a pas d'ID Redmine défini.")

    # Construction des données à envoyer
    issue_data = {
        "project_id": projet_id,
        "subject": sujet,
        "description": description[:4000],
        "priority_id": 4,
        "tracker_id": 2,
    }

    # Ajout de l'affectation si disponible
    if projet.id_redmine_charge_de_compte:
        issue_data["assigned_to_id"] = projet.id_redmine_charge_de_compte

    data = {
        "issue": issue_data
    }

    print("Données envoyées à Redmine :", data)
    print(f"project_id envoyé à Redmine : {projet_id} (type: {type(projet_id)})")

    try:
        response = requests.post(url, json=data, headers=headers)
        response.raise_for_status()
        return response.json().get("issue", {}).get("id")
    except requests.exceptions.HTTPError as e:
        print(f"❌ Échec création ticket Redmine : {e}")
        print("➡️ Réponse Redmine :", response.text)
        raise



def notifier_utilisateurs(execution):
    configuration = execution.configuration
    destinataires = [e.email for e in configuration.emails_notification.all()]
    if destinataires:
        try:
            send_mail(
                subject=f"Test terminé : {configuration.nom}",
                message=(
                    f"Le test '{configuration.nom}' est terminé.\n"
                    f"Statut : {execution.statut}\n\n"
                    f"Rapport :\n{execution.rapport[:500]}..."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=destinataires,
                fail_silently=False,
            )
        except Exception as e:
            print("❌ Erreur lors de l'envoi de l'e-mail :", str(e))


def lancer_scripts_pour_execution(execution_id):
    execution = ExecutionTest.objects.get(id=execution_id)
    execution.statut = "running"
    execution.started_at = now()
    execution.save()

    logs = []
    erreur_detectee = False

    try:
        scripts = execution.configuration.scripts.all()
        projet = execution.configuration.projet
        infos_projet = f"=== Projet : {projet.nom} ===\n\n"

        id_redmine = projet.id_redmine  # id du projet Redmine

        for script in scripts:
            path = os.path.join(settings.MEDIA_ROOT, script.fichier.name)
            logs.append(f"➡️ Execution du script: {script.nom}\n")

            result = subprocess.run(
                ["python", path],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=300,
            )
            stdout = result.stdout.decode("utf-8", errors="replace")
            stderr = result.stderr.decode("utf-8", errors="replace")

            logs.append(stdout)
            if stderr:
                logs.append("ERREUR:\n" + stderr)

            if (
                result.returncode != 0
                or "ERREURS_FORMULAIRES" in stdout
                or "❌" in stdout
            ):
                erreur_detectee = True
                execution.statut = "error"
                description = (
                    f"Le script '{script.nom}' a échoué avec le code {result.returncode}.\n\n"
                    f"Rapport d'exécution :\n\n{stdout[:2000]}"
                )

                # Création du ticket Redmine
                try:
                    ticket_id = creer_ticket_redmine(
                        projet_id=id_redmine,
                        sujet=f"Erreur test automatique - {script.nom}",
                        description=description
                        + "\n\nLogs complets:\n"
                        + "\n".join(logs),
                    )
                    logs.append(f"\n✅ Ticket Redmine créé avec ID: {ticket_id}")

                    execution.ticket_redmine_id = ticket_id
                    execution.save()
                except Exception as e:
                    logs.append(f"\n❌ Échec création ticket Redmine : {str(e)}")

                execution.rapport = infos_projet + "\n".join(logs)
                break

        if not erreur_detectee:
            execution.statut = "done"
            execution.rapport = infos_projet + "\n".join([log for log in logs if log])

    except Exception:
        erreur_trace = traceback.format_exc()
        logs.append("❌ Exception:\n" + erreur_trace)
        execution.statut = "error"
        execution.rapport = infos_projet + "\n".join(logs)
        # Ne pas créer de ticket ici, ou le faire si tu veux

    execution.ended_at = now()

    # Sauvegarde du fichier log
    log_path = f"logs/execution_{execution.id}.txt"
    full_log_path = os.path.join(settings.MEDIA_ROOT, log_path)
    os.makedirs(os.path.dirname(full_log_path), exist_ok=True)

    with open(full_log_path, "w", encoding="utf-8") as f:
        f.write(execution.rapport)

    execution.log_fichier.name = log_path
    execution.save()

    notifier_utilisateurs(execution)
