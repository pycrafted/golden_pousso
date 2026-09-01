"""Vérifie la configuration Cloudflare R2 de bout en bout.

    python manage.py verifier_r2

Envoie un petit fichier de test sur le bucket, le relit par son URL publique, puis le
supprime. Aucune donnée du site n'est touchée. À lancer après avoir renseigné les cinq
variables CLOUDFLARE_R2_* — en local dans backend/.env, ou sur Render.
"""
import uuid

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

VARIABLES = [
    ('CLOUDFLARE_R2_ACCOUNT_ID', 'R2_ACCOUNT_ID', False),
    ('CLOUDFLARE_R2_ACCESS_KEY_ID', 'R2_ACCESS_KEY_ID', False),
    ('CLOUDFLARE_R2_SECRET_ACCESS_KEY', 'R2_SECRET_ACCESS_KEY', True),
    ('CLOUDFLARE_R2_BUCKET', 'R2_BUCKET_NAME', False),
    ('CLOUDFLARE_R2_PUBLIC_DOMAIN', 'R2_PUBLIC_DOMAIN', False),
]


class Command(BaseCommand):
    help = 'Vérifie que les variables Cloudflare R2 permettent bien d\'envoyer et de servir une vidéo.'

    def handle(self, *args, **options):
        ok = self.style.SUCCESS
        ko = self.style.ERROR
        warn = self.style.WARNING

        self.stdout.write('')
        self.stdout.write('--- Variables ---')
        manquantes = []
        for nom_env, nom_reglage, secret in VARIABLES:
            valeur = getattr(settings, nom_reglage, '')
            if not valeur:
                manquantes.append(nom_env)
                self.stdout.write(f'  {ko("absente")}  {nom_env}')
            else:
                affichee = f'{valeur[:4]}...{valeur[-4:]}' if secret else valeur
                self.stdout.write(f'  {ok("ok")}      {nom_env} = {affichee}')

        if manquantes:
            self.stdout.write('')
            self.stdout.write(ko(f'{len(manquantes)} variable(s) manquante(s) — les vidéos ne partiront pas sur R2.'))
            self.stdout.write("Tant qu'il en manque une seule, elles retombent sur Cloudinary (ou le disque local en développement).")
            return

        # --- Envoi ---
        from goldenpousso_backend.video_storage import R2VideoStorage

        stockage = R2VideoStorage()
        nom = f'verification/test-{uuid.uuid4().hex[:8]}.txt'
        contenu = b'Verification R2 Golden Pousso'

        self.stdout.write('')
        self.stdout.write('--- Envoi vers le bucket ---')
        try:
            enregistre = stockage.save(nom, ContentFile(contenu))
        except Exception as err:
            self.stdout.write(f'  {ko("échec")}  {self._expliquer(err)}')
            return
        self.stdout.write(f'  {ok("ok")}      fichier déposé : {enregistre}')

        url = stockage.url(enregistre)
        self.stdout.write(f'  {ok("ok")}      URL publique   : {url}')

        # --- Lecture publique ---
        self.stdout.write('')
        self.stdout.write('--- Lecture depuis Internet ---')
        lisible = False
        try:
            import requests

            reponse = requests.get(url, timeout=15)
            if reponse.status_code == 200 and reponse.content == contenu:
                lisible = True
                self.stdout.write(f'  {ok("ok")}      le fichier est bien servi publiquement')
            elif reponse.status_code in (401, 403):
                self.stdout.write(f'  {ko("refusé")}  HTTP {reponse.status_code} — le bucket n\'est pas public.')
                self.stdout.write('           Bucket > Settings > « Public Development URL » > Enable (ou branchez un domaine personnalisé).')
            elif reponse.status_code == 404:
                self.stdout.write(f'  {ko("absent")}  HTTP 404 — CLOUDFLARE_R2_PUBLIC_DOMAIN ne pointe pas sur ce bucket.')
            else:
                self.stdout.write(f'  {warn("?")}       HTTP {reponse.status_code} — réponse inattendue.')
        except Exception as err:
            self.stdout.write(f'  {ko("échec")}  {err}')

        # --- Menage ---
        try:
            stockage.delete(enregistre)
            self.stdout.write('')
            self.stdout.write(f'  {ok("ok")}      fichier de test supprimé du bucket')
        except Exception as err:
            self.stdout.write(warn(f'  Fichier de test non supprimé ({err}) — à retirer à la main : {enregistre}'))

        self.stdout.write('')
        if lisible:
            self.stdout.write(ok('R2 est opérationnel : les prochaines vidéos produit partiront dessus.'))
        else:
            self.stdout.write(warn("L'envoi fonctionne, mais le fichier n'est pas lisible publiquement — les vidéos ne s'afficheraient pas sur le site."))

    def _expliquer(self, err):
        """Traduit les erreurs S3 les plus courantes en langage compréhensible."""
        texte = str(err)
        code = getattr(err, 'response', {}).get('Error', {}).get('Code', '') if hasattr(err, 'response') else ''
        if code in ('InvalidAccessKeyId', 'SignatureDoesNotMatch') or 'InvalidAccessKeyId' in texte:
            return "clés refusées — vérifiez CLOUDFLARE_R2_ACCESS_KEY_ID et CLOUDFLARE_R2_SECRET_ACCESS_KEY."
        if code == 'NoSuchBucket' or 'NoSuchBucket' in texte:
            return f"bucket « {settings.R2_BUCKET_NAME} » introuvable — vérifiez CLOUDFLARE_R2_BUCKET."
        if code == 'AccessDenied' or 'AccessDenied' in texte:
            return "accès refusé — le jeton doit avoir la permission « Object Read & Write » sur ce bucket."
        if 'SSL' in texte or 'handshake' in texte:
            return (f"identifiant de compte refuse par Cloudflare - verifiez CLOUDFLARE_R2_ACCOUNT_ID "
                    f"(valeur actuelle : {settings.R2_ACCOUNT_ID}).")
        if 'Could not connect' in texte or 'EndpointConnectionError' in texte or 'NameResolutionError' in texte:
            return f"impossible de joindre {settings.R2_ACCOUNT_ID}.r2.cloudflarestorage.com — vérifiez CLOUDFLARE_R2_ACCOUNT_ID."
        return texte
