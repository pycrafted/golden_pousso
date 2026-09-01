"""
Fabrique la variante web des photos produit déjà en base.

Les nouvelles photos reçoivent leur variante à l'enregistrement ; celles
téléversées avant l'ajout du champ n'en ont pas. Cette commande rattrape.

    python manage.py generer_variantes_web            # ce qui manque
    python manage.py generer_variantes_web --toutes   # régénère tout
    python manage.py generer_variantes_web --simuler  # sans rien écrire

Les originaux ne sont jamais modifiés ni supprimés.
"""

from django.core.management.base import BaseCommand
from django.db.models import Q

from store.imaging import VarianteWebMixin, doit_generer
from store import models as modeles_store


def _ko(champ):
    try:
        return champ.size / 1024
    except (OSError, ValueError):
        return 0


class Command(BaseCommand):
    help = "Génère la variante web (1800 px) des photos produit."

    def add_arguments(self, parser):
        parser.add_argument(
            '--toutes', action='store_true',
            help="Régénère même les photos qui ont déjà une variante.",
        )
        parser.add_argument(
            '--simuler', action='store_true',
            help="Affiche ce qui serait fait, sans rien écrire.",
        )

    def handle(self, *args, **options):
        # Tout modèle qui hérite du mixin est concerné, sans liste à tenir à
        # jour : en ajouter un plus tard suffit à le faire traiter ici.
        classes = [
            m for m in vars(modeles_store).values()
            if isinstance(m, type)
            and issubclass(m, VarianteWebMixin)
            and m is not VarianteWebMixin
            and not m._meta.abstract
        ]

        faits = ignores = echecs = 0
        avant = apres = 0.0

        for classe in classes:
            qs = classe.objects.all()
            if not options['toutes']:
                # Le champ est nullable : une ligne sans variante vaut NULL
                # pour les unes et chaîne vide pour les autres selon la façon
                # dont elle a été créée. Filtrer sur l'une seule en laisserait
                # passer.
                qs = qs.filter(Q(display='') | Q(display__isnull=True))

            if not qs.exists():
                continue

            self.stdout.write('')
            self.stdout.write(self.style.HTTP_INFO(str(classe._meta.verbose_name_plural)))

            for objet in qs.iterator():
                source = objet.source_image
                if not doit_generer(source):
                    ignores += 1
                    continue

                poids_source = _ko(source)

                if options['simuler']:
                    from store.imaging import construire_variantes
                    variantes = construire_variantes(source)
                    if not variantes:
                        echecs += 1
                        self.stderr.write(self.style.WARNING(f"  illisible — {source.name}"))
                        continue
                    poids_cible = sum(c.size for c in variantes.values()) / 1024
                else:
                    if options['toutes']:
                        objet.display = None
                    if not objet.generer_variantes():
                        echecs += 1
                        self.stderr.write(self.style.WARNING(f"  illisible — {source.name}"))
                        continue
                    classe.objects.filter(pk=objet.pk).update(display=objet.display.name)
                    poids_cible = _ko(objet.display)

                avant += poids_source
                apres += poids_cible
                faits += 1
                prefixe = '  [simulation] ' if options['simuler'] else '  '
                self.stdout.write(
                    f"{prefixe}{source.name} : "
                    f"{poids_source:,.0f} Ko -> {poids_cible:,.0f} Ko"
                )

        if not faits and not echecs:
            self.stdout.write("Rien à faire : toutes les images ont leur variante.")
            return

        gain = (1 - apres / avant) * 100 if avant else 0
        verbe = 'seraient générées' if options['simuler'] else 'générées'
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(
            f"{faits} variante(s) {verbe} · {ignores} déjà légère(s) · {echecs} échec(s)"
        ))
        self.stdout.write(self.style.SUCCESS(
            f"{avant / 1024:,.1f} Mo -> {apres / 1024:,.1f} Mo  ({gain:.0f} % de moins)"
        ))
