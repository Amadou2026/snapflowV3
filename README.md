# Snapflow — Plateforme de tests automatisés

Snapflow est une application web combinant **Django (backend)** et **React (frontend)** pour l’automatisation et la gestion des tests de formulaires sur différents projets.

---

## Architecture du projet

snapflow/
├── backend/ # API Django + base de données
│ ├── manage.py
│ ├── core/
│ ├── requirements.txt
│ └── venv/ # Environnement virtuel Python
│
└── frontend/ # Interface utilisateur React
├── src/
├── package.json
└── public/

## Prérequis

Avant de démarrer, assure-toi d’avoir installé :

- **Python 3.10+**
- **Node.js 18+** et **npm** (ou **yarn**)
- **Git**

## Installation du backend (Django)

cd backend
python -m venv venv
source venv/bin/activate        # macOS / Linux
venv\Scripts\activate           # Windows
pip install -r requirements.txt
pip install python-dateutil

## Configure la base de données selon ta configuration MySQL

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'djangosnapflow',
        'USER': 'root',
        'PASSWORD': 'root',
        'HOST': 'localhost',
        'PORT': '3306',        
    }
}
python manage.py migrate
Le backend est accessible sur :
http://127.0.0.1:8000/


## Installation du Frontend (React)
cd frontend
npm install
npm start
Le frontend est accessible sur :
http://localhost:3000/

## Créer un superutilisateur
Sur Django, tape sur le terminal: python manage.py createsuperuser