from django.contrib.auth.models import AbstractUser
from django.db import models


class Customer(AbstractUser):
    phone = models.CharField(max_length=20, blank=True)
    default_address = models.TextField(blank=True)

    class Meta:
        verbose_name = 'Client'
        verbose_name_plural = 'Clients'

    def __str__(self):
        return self.get_full_name() or self.username
