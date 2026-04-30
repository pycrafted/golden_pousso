from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0007_atelier_image'),
    ]

    operations = [
        migrations.DeleteModel(
            name='Review',
        ),
    ]
