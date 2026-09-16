from django.db import migrations


class Migration(migrations.Migration):
    """Plus de repère interne ni de pièce présentée sur les vidéos de
    l'accueil, à la demande : ce sont des vidéos de la boutique, qui ne
    représentent aucun produit."""

    dependencies = [
        ('store', '0034_videos_sans_masquage'),
    ]

    operations = [
        migrations.RemoveField(model_name='showcasevideo', name='title'),
        migrations.RemoveField(model_name='showcasevideo', name='product'),
    ]
