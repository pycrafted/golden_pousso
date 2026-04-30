from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0003_contactmessage'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='paydunya_token',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AlterField(
            model_name='order',
            name='payment_method',
            field=models.CharField(
                choices=[
                    ('orange_money', 'Orange Money'),
                    ('wave', 'Wave'),
                    ('free_money', 'Free Money'),
                    ('cash_on_delivery', 'Paiement à la livraison'),
                    ('card', 'Carte bancaire'),
                ],
                default='cash_on_delivery',
                max_length=20,
            ),
        ),
    ]
