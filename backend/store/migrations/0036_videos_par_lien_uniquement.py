from django.db import migrations, models


def fichiers_en_liens(apps, schema_editor):
    """Plus d'envoi de fichier, à la demande : une vidéo n'est plus qu'un lien.

    Une vidéo publiée par FICHIER garde sa place : son adresse publique (R2 en
    production) devient son lien. Une ligne sans lien ni fichier ne montrait
    rien sur l'accueil : elle est supprimée, le lien devenant obligatoire."""
    Video = apps.get_model('store', 'ShowcaseVideo')
    for video in Video.objects.all():
        if not video.video_lien and video.video:
            try:
                video.video_lien = video.video.url
            except Exception:
                video.video_lien = ''
            if video.video_lien.startswith('https://'):
                video.save(update_fields=['video_lien'])
                continue
        if not video.video_lien:
            video.delete()


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0035_videos_sans_repere_ni_piece'),
    ]

    operations = [
        migrations.RunPython(fichiers_en_liens, migrations.RunPython.noop),
        migrations.RemoveField(model_name='showcasevideo', name='video'),
        migrations.AlterField(
            model_name='showcasevideo',
            name='video_lien',
            field=models.URLField(
                max_length=500, verbose_name='Lien de la vidéo',
                help_text='Adresse publique du fichier, déposé sur Cloudflare.',
            ),
        ),
    ]
