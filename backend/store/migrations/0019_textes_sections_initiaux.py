"""
Sème les intitulés actuels du site.

Sans cette étape, l'admin s'ouvrirait sur une liste vide et le propriétaire
devrait deviner les clés techniques. Ici il retrouve les textes tels qu'ils
s'affichent aujourd'hui et n'a qu'à les modifier.

Les valeurs reprennent exactement ce qui est écrit en dur dans les composants :
la migration ne change donc rien à l'écran.
"""

from django.db import migrations

TEXTES = [
    ('accueil-categories', "Accueil — grille des rayons",        '',                    'Catégories'),
    ('accueil-creations',  "Accueil — carrousel du catalogue",   '',                    'Nos Créations'),
    ('accueil-promotion',  "Accueil — bande promotionnelle",     '',                    'Promotion'),
    ('accueil-mouvement',  "Accueil — séquences filmées",        '',                    'Nos créations en mouvement'),
    ('accueil-selection',  "Accueil — sélection de pièces",      'La sélection',        'Nos plus belles pièces'),
    ('accueil-atelier',    "Accueil — l'atelier",                'Notre savoir-faire',  'L’élégance africaine réinventée'),
    ('accueil-avis',       "Accueil — avis clients",             'Avis Clients',        'Elles Nous Font Confiance'),
    ('accueil-contact',    "Accueil — nous contacter",           'Une question ?',      'Parlons de votre pièce'),
]


def semer(apps, schema_editor):
    SectionTexte = apps.get_model('store', 'SectionTexte')
    for cle, zone, surtitre, titre in TEXTES:
        # get_or_create : rejouer la migration ne doit pas écraser un texte
        # que le propriétaire aurait déjà changé.
        SectionTexte.objects.get_or_create(
            cle=cle,
            defaults={'zone': zone, 'surtitre': surtitre, 'titre': titre},
        )


def retirer(apps, schema_editor):
    SectionTexte = apps.get_model('store', 'SectionTexte')
    SectionTexte.objects.filter(cle__in=[c for c, *_ in TEXTES]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0018_sectiontexte'),
    ]

    operations = [
        migrations.RunPython(semer, retirer),
    ]
