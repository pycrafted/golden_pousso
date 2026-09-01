"""Stockage des médias sur Cloudflare R2.

Tout part sur R2 : les images comme les vidéos. Le partage précédent — images
sur Cloudinary pour ses transformations à la volée, vidéos sur R2 pour sa
bande passante gratuite — a été abandonné à la demande. Un seul compte, un
seul tuyau, et pas de quota d'images à surveiller.

⚠ CE QUI REND CE CHOIX POSSIBLE : le site ne demande PAS ses vignettes à la
volée. `store/imaging.py` fabrique trois largeurs (400, 800, 1600) au moment
de l'enregistrement, nommées `<base>-web-<largeur>.jpg`, et `CldImg` déduit
les autres en substituant le nombre. R2 n'a donc rien à transformer : il rend
des fichiers, ce qu'un entrepôt d'objets sait faire.

Si un jour les variantes cessaient d'être pré-fabriquées, R2 servirait
l'original en pleine taille à toutes les tailles d'écran, et les vignettes de
300 px coûteraient plusieurs mégaoctets.

Le choix se fait dans settings.STORAGES :
    — R2 dès que les cinq variables CLOUDFLARE_R2_* sont renseignées ;
    — sinon Cloudinary en production, le montage historique ;
    — sinon le disque local, en développement.

Le fichier s'appelle `video_storage` et non `storages` pour ne pas prêter à
confusion avec le paquet `django-storages`, importé juste en dessous. Le nom
est devenu trompeur depuis que les images y passent aussi, mais une migration
le référence (0012) : le renommer casserait l'historique.
"""
from django.conf import settings
from django.core.files.storage import storages
from storages.backends.s3 import S3Storage


def video_storage():
    """Stockage du champ vidéo — résolu à l'exécution, jamais figé dans une migration."""
    return storages['videos']


class R2Storage(S3Storage):
    """Base commune : le bucket, le domaine public, et ce qui ne change jamais."""

    #: Redéfini par les sous-classes — une vidéo et une vignette n'ont pas la
    #: même durée de vie utile.
    CACHE_CONTROL = 'public, max-age=2592000'

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
            # R2 ignore les ACL S3 ; deux fichiers homonymes ne doivent pas s'écraser.
            file_overwrite=False,
            region_name='auto',
            signature_version='s3v4',
            object_parameters={'CacheControl': self.CACHE_CONTROL},
            **kwargs,
        )


class R2VideoStorage(R2Storage):
    """Vidéos. Un mois de cache : une vidéo produit ne change jamais sous le même nom."""

    CACHE_CONTROL = 'public, max-age=2592000'


class R2MediaStorage(R2Storage):
    """Images et tout le reste — photos produit, visuels de rayon, avatars.

    Un an de cache, contre un mois pour les vidéos. Ce n'est pas de l'excès de
    confiance : `file_overwrite=False` garantit qu'un fichier ne change jamais
    sous le même nom — remplacer une photo produit écrit un NOUVEAU nom, et
    l'URL en base suit. Une adresse d'image est donc immuable, elle peut être
    mise en cache aussi longtemps qu'on veut.
    """

    CACHE_CONTROL = 'public, max-age=31536000, immutable'
