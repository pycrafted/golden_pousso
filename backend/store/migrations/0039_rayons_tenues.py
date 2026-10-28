"""Remplace le rayon « Boubou africain » par deux rayons : tenues pour homme,
tenues pour femme.

« Boubou africain » n'était qu'un toit : il ne rangeait aucune pièce lui-même,
tout passait par ses deux sous-catégories, « yéré goor » (homme) et « yéré
jiguén » (femme). Ces deux-là deviennent des rayons principaux, renommés et
re-sluggés ; le toit, vidé, est supprimé.

    yere-goor   → tenues-homme  « Tenues pour homme »
    yere-jiguen → tenues-femme  « Tenues pour femme »

Les pièces suivent leur catégorie : elles ne bougent pas, seule l'adresse du
rayon change.

Une base sans ces sous-catégories (poste de développement neuf) reçoit les
deux rayons vides. Si « Boubou africain » range encore des pièces en propre,
elles passent dans « Tenues pour femme » plutôt que de bloquer la
suppression (Product.category est en PROTECT).
"""

from django.db import migrations

RAYONS = (
    # (ancien slug de sous-catégorie, nouveau slug, nom)
    ('yere-goor', 'tenues-homme', 'Tenues pour homme'),
    ('yere-jiguen', 'tenues-femme', 'Tenues pour femme'),
)


def scinder(apps, schema_editor):
    Category = apps.get_model('store', 'Category')
    Product = apps.get_model('store', 'Product')
    nouveaux = {}
    for ancien, slug, nom in RAYONS:
        rayon = Category.objects.filter(slug=slug).first() or Category.objects.filter(slug=ancien).first()
        if rayon is None:
            rayon = Category(slug=slug)
        rayon.slug, rayon.name, rayon.parent = slug, nom, None
        rayon.save()
        nouveaux[slug] = rayon

    toit = Category.objects.filter(slug='boubou-africain').first()
    if toit is not None:
        Product.objects.filter(category=toit).update(category=nouveaux['tenues-femme'])
        # Les sous-catégories restantes deviennent principales au lieu de
        # partir avec le toit (parent en CASCADE).
        Category.objects.filter(parent=toit).update(parent=None)
        # Le modèle historique n'a pas le garde-fou des rayons structurels :
        # la suppression passe.
        toit.delete()


def recoller(apps, schema_editor):
    Category = apps.get_model('store', 'Category')
    toit, _ = Category.objects.get_or_create(slug='boubou-africain', defaults={'name': 'Boubou africain'})
    noms = {'yere-goor': 'yéré goor', 'yere-jiguen': 'yéré jiguén'}
    for ancien, slug, _nom in RAYONS:
        rayon = Category.objects.filter(slug=slug).first()
        if rayon is not None:
            rayon.slug, rayon.name, rayon.parent = ancien, noms[ancien], toit
            rayon.save()


class Migration(migrations.Migration):

    dependencies = [('store', '0038_slugs_rayons')]

    operations = [migrations.RunPython(scinder, recoller)]
