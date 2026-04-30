from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0006_herobanner'),
    ]

    operations = [
        migrations.CreateModel(
            name='AtelierImage',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(upload_to='atelier/')),
                ('is_active', models.BooleanField(default=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Image Atelier',
                'verbose_name_plural': 'Image Atelier',
            },
        ),
    ]
