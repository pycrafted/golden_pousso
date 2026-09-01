#!/usr/bin/env bash
set -o errexit

pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate
python manage.py createsuperuser --no-input 2>/dev/null || true
python manage.py ensure_staff_account || true
