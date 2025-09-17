# core/runner.py
import json
import subprocess
import os
import traceback
from django.conf import settings
from django.utils.timezone import now
from django.core.mail import send_mail
import requests
from .models import *

def get_global_config():
    try:
        return Configuration.objects.first()  # récupère la première instance
    except Configuration.DoesNotExist:
        return None

from .models import Configuration  # ou le chemin vers ton modèle Configuration

def creer_ticket_redmine(projet_id, sujet, description, priority_id=2):
    # Récupérer la configuration globale (la première instance)
    config = Configuration.objects.first()
    if not config or not config.redmine_url or not config.redmine_api_key:
        raise ValueError("Configuration Redmine non définie dans la base de données.")

    url = f"{config.redmine_url.rstrip('/')}/issues.json"
    headers = {
        "Content-Type": "application/json",
        "X-Redmine-API-Key": config.redmine_api_key,
    }

    print(f"Recherche projet avec id_redmine={projet_id}")
    projet = Projet.objects.get(id_redmine=projet_id)

    if projet.id_redmine is None:
        raise ValueError("Ce projet n'a pas d'ID Redmine défini.")

        # Valeur par défaut

    
    issue_data = {
        "project_id": projet_id,
        "subject": sujet,
        "description": description[:4000],
        "priority_id": priority_id,
        "tracker_id": 2,
    }

    if projet.id_redmine_charge_de_compte:
        issue_data["assigned_to_id"] = projet.id_redmine_charge_de_compte

    data = {"issue": issue_data}

    print("Données envoyées à Redmine :", data)
    print(f"project_id envoyé à Redmine : {projet_id} (type: {type(projet_id)})")

    try:
        response = requests.post(url, json=data, headers=headers)
        response.raise_for_status()
        return response.json().get("issue", {}).get("id")
    except requests.exceptions.HTTPError as e:
        print(f"Échec création ticket Redmine : {e}")
        print("Réponse Redmine :", response.text)
        raise


from django.core.mail import EmailMessage, get_connection

def notifier_utilisateurs(execution):
    config = get_global_config()
    if not config:
        print("Pas de configuration globale trouvée")
        return

    configuration = execution.configuration
    destinataires = [e.email for e in configuration.emails_notification.all()]
    if not destinataires:
        print("Aucun destinataire trouvé")
        return

    connection = get_connection(
        host='smtp.gmail.com',  # ou config.redmine_url si c'est aussi le SMTP host, sinon met le bon hôte SMTP
        port=587,
        username=config.email_host_user,
        password=config.email_host_password,
        use_tls=True,
    )

    subject = f"Test terminé : {configuration.nom}"
    message = (
        f"Le test '{configuration.nom}' est terminé.\n"
        f"Statut : {execution.statut}\n\n"
        f"Rapport :\n{execution.rapport[:500]}..."
    )

    email = EmailMessage(subject, message, config.email_host_user, destinataires, connection=connection)
    try:
        email.send()
        print("E-mail envoyé avec succès")
    except Exception as e:
        print(f"Erreur envoi email: {e}")


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
        id_redmine = projet.id_redmine

        from core.models import ExecutionResult

        for script in scripts:
            path = os.path.join(settings.MEDIA_ROOT, script.fichier.name)
            logs.append(f"Execution du script: {script.nom}\n")

            try:
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

                statut_resultat = (
                    "error"
                    if result.returncode != 0
                    or "ERREURS_FORMULAIRES" in stdout
                    or "❌" in stdout
                    else "done"
                )

            except Exception as e:
                stdout = ""
                stderr = str(e)
                statut_resultat = "error"
                logs.append(f"Erreur pendant l'exécution du script: {e}")

            # ✅ Mise à jour ou création d’un ExecutionResult
            execution_result, _ = ExecutionResult.objects.get_or_create(
                execution=execution,
                script=script,
                defaults={'statut': statut_resultat}
            )
            execution_result.statut = statut_resultat
            execution_result.log_fichier.name = f"logs/execution_{execution.id}.txt"
            execution_result.save()

            # ✅ Si erreur, créer un ticket Redmine
            if statut_resultat == "error":
                erreur_detectee = True
                description = (
                    f"Le script '{script.nom}' a échoué avec le code {result.returncode if 'result' in locals() else 'N/A'}.\n\n"
                    f"Rapport d'exécution :\n\n{stdout[:2000]}"
                )

                try:
                    ticket_id = creer_ticket_redmine(
                        projet_id=id_redmine,
                        sujet=f"Erreur test automatique - {script.nom}",
                        description=description
                        + "\n\nLogs complets:\n"
                        + "\n".join(logs),
                        priority_id=script.priorite
                    )
                    logs.append(f"\n✅ Ticket Redmine créé avec ID: {ticket_id}")
                    execution.ticket_redmine_id = ticket_id
                except Exception as e:
                    logs.append(f"\n❌ Échec création ticket Redmine : {str(e)}")

        # ✅ Mise à jour finale
        execution.statut = "error" if erreur_detectee else "done"
        execution.rapport = infos_projet + "\n".join(logs)

    except Exception:
        erreur_trace = traceback.format_exc()
        logs.append("❌ Exception globale:\n" + erreur_trace)
        execution.statut = "error"
        execution.rapport = infos_projet + "\n".join(logs)

    # ✅ Sauvegarde du log global
    execution.ended_at = now()
    log_path = f"logs/execution_{execution.id}.txt"
    full_log_path = os.path.join(settings.MEDIA_ROOT, log_path)
    os.makedirs(os.path.dirname(full_log_path), exist_ok=True)

    with open(full_log_path, "w", encoding="utf-8") as f:
        f.write(execution.rapport)

    execution.log_fichier.name = log_path
    execution.save()

    notifier_utilisateurs(execution)

