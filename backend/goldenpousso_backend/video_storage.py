"""Stockage des fichiers vidéo.

Les images restent sur Cloudinary : ses transformations (`f_auto,q_auto`) font tout le
travail d'optimisation. Les vidéos, elles, coûtent surtout en bande passante — elles
partent donc sur Cloudflare R2, qui ne facture aucun frais de sortie.

Le choix du stockage se fait dans settings.STORAGES['videos'] :
    — R2 dès que les variables CLOUDFLARE_R2_* sont renseignées ;
    — sinon Cloudinary en production (avec resource_type='video', sans quoi
      Cloudinary refuse les MP4) ;
    — sinon le disque local, en développement.

Le fichier s'appelle `video_storage` et non `storages` pour ne pas prêter à confusion
avec le paquet `django-storages`, importé juste en dessous.
"""
from django.conf import settings
from django.core.files.storage import storages
from storages.backends.s3 import S3Storage


def video_storage():
    """Stockage du champ vidéo — résolu à l'exécution, jamais figé dans une migration."""
    return storages['videos']


class R2VideoStorage(S3Storage):
    """Vidéos hébergées sur Cloudflare R2, servies via le domaine public du bucket."""

    def __init__(self, **kwargs):
        super().__init__(
            bucket_name=settings.R2_BUCKET_NAME,
            endpoint_url=f'https://{settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com',
            access_key=settings.R2_ACCESS_KEY_ID,
            secret_key=settings.R2_SECRET_ACCESS_KEY,
            # Domaine branché sur le bucket — c'est l'adresse que voient les visiteurs.
            custom_domain=settings.R2_PUBLIC_DOMAIN,
            # Bucket public via ce domaine : pas d'URL signée, sinon les liens expirent
            # et le cache du CDN ne sert plus à rien.
            querystring_auth=False,
            default_acl=None,
            # R2 ignore les ACL S3 ; deux vidéos homonymes ne doivent pas s'écraser.
            file_overwrite=False,
            region_name='auto',
            signature_version='s3v4',
            # Un mois de cache : une vidéo produit ne change jamais sous le même nom.
            object_parameters={'CacheControl': 'public, max-age=2592000'},
            **kwargs,
        )
