#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
python manage.py createsuperuser --no-input 2>/dev/null || true
python manage.py ensure_staff_account || true

# Le contenu editorial ne voyage pas par git : media/ est ignore et la base de
# prod est distincte. Cette commande y recopie les tableaux du hero et les
# titres de sections. Elle est idempotente — relancee a chaque deploiement,
# elle ne republie que ce qui manque.
python manage.py sync_contenu || true
