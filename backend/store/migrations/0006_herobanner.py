from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0005_review_model'),
    ]

    operations = [
        migrations.CreateModel(
            name='HeroBanner',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('image', models.ImageField(upload_to='hero/')),
                ('is_active', models.BooleanField(default=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Bannière Hero',
                'verbose_name_plural': 'Bannières Hero',
            },
        ),
    ]
