"""Aligne les slugs des cinq rayons sur ceux de la production.

Le frontend bâtit la grille de la page d'accueil sur une liste de slugs écrite
en dur (`frontend/src/constants/rayons.js`) : ils nomment la photo de chaque
tuile ET l'adresse du rayon. Ces slugs — « boubous », « sacs », « bijoux »,
« cosmetique » — n'existaient plus en production, où les rayons s'appellent
« boubou-africain », « sac », « bijou » et « accessoire ». Quatre tuiles sur
cinq menaient donc à une page vide, en affichant leur nom de repli.

Le frontend et `Category.SLUGS_STRUCTURELS` ont été alignés sur la base ; cette
migration aligne l'inverse, c'est-à-dire toute base restée sur les anciens
slugs — les postes de développement.

Elle est SANS EFFET là où le travail est déjà fait (production) : chaque
renommage n'a lieu que si l'ancien slug existe et que le nouveau est libre.
Rien n'est créé ni supprimé : une base sans rayon « cosmetique » et sans rayon
« accessoire » reste telle quelle.
"""

from django.db import migrations

RENOMMAGES = (
    # (ancien slug, nouveau slug, nom à poser si le rayon portait encore
    #  l'ancien nom — None pour ne pas toucher au nom)
    ('boubous', 'boubou-africain', 'Boubou africain'),
    ('sacs', 'sac', 'Sac'),
    ('bijoux', 'bijou', 'Bijou'),
    ('cosmetique', 'accessoire', 'Accessoire'),
)


def aligner(apps, schema_editor):
    Category = apps.get_model('store', 'Category')
    for ancien, nouveau, nom in RENOMMAGES:
        if Category.objects.filter(slug=nouveau).exists():
            continue
        rayon = Category.objects.filter(slug=ancien).first()
        if rayon is None:
            continue
        rayon.slug = nouveau
        if nom:
            rayon.name = nom
        rayon.save(update_fields=['slug', 'name'])


def revenir(apps, schema_editor):
    Category = apps.get_model('store', 'Category')
    for ancien, nouveau, _nom in RENOMMAGES:
        if Category.objects.filter(slug=ancien).exists():
            continue
        rayon = Category.objects.filter(slug=nouveau).first()
        if rayon is not None:
            rayon.slug = ancien
            rayon.save(update_fields=['slug'])


class Migration(migrations.Migration):

    dependencies = [('store', '0037_coordonnees')]

    operations = [migrations.RunPython(aligner, revenir)]
