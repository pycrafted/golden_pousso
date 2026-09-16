from django.db import migrations


def supprimer_videos_masquees(apps, schema_editor):
    """L'option « Visible sur le site » disparaît, à la demande : une vidéo
    masquée deviendrait visible. Elle n'était pas affichée — on la supprime,
    comme les pièces masquées à la migration 0029."""
    apps.get_model('store', 'ShowcaseVideo').objects.filter(is_active=False).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0033_retirer_images_atelier'),
    ]

    operations = [
        migrations.RunPython(supprimer_videos_masquees, migrations.RunPython.noop),
        migrations.RemoveField(model_name='showcasevideo', name='is_active'),
    ]
