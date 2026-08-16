import os

from django.core.management.base import BaseCommand

from accounts.models import Customer


class Command(BaseCommand):
    help = (
        "Crée le compte staff utilisé pour l'Espace Gestion s'il n'existe pas déjà, "
        "à partir des variables d'environnement STAFF_PHONE et STAFF_PASSWORD. "
        "Ne modifie jamais le mot de passe d'un compte existant."
    )

    def handle(self, *args, **options):
        phone = os.environ.get('STAFF_PHONE')
        password = os.environ.get('STAFF_PASSWORD')

        if not phone or not password:
            self.stdout.write('STAFF_PHONE / STAFF_PASSWORD non définis — compte staff ignoré.')
            return

        user, created = Customer.objects.get_or_create(
            phone=phone,
            defaults={
                'username': phone,
                'email': f'{phone}@goldenpousso.local',
                'is_staff': True,
            },
        )

        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Compte staff créé pour {phone}.'))
        elif not user.is_staff:
            user.is_staff = True
            user.save(update_fields=['is_staff'])
            self.stdout.write(self.style.SUCCESS(f'Compte staff {phone} réactivé (is_staff=True).'))
        else:
            self.stdout.write(f'Compte staff {phone} déjà présent, rien à faire.')
