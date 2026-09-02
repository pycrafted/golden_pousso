"""Réglages du serveur d'application en production.

Gunicorn lit ce fichier TOUT SEUL s'il s'appelle `gunicorn.conf.py` et se
trouve dans le répertoire courant. La commande de démarrage de Render tourne
depuis `backend/`, donc il est pris en compte sans rien changer au tableau de
bord — et surtout, le réglage voyage par git au lieu de vivre dans une case
d'interface que personne ne pense à relire.

── Pourquoi ce fichier existe ──────────────────────────────────────────────
L'envoi d'une vidéo depuis l'Espace Gestion répondait 502 Bad Gateway, et le
navigateur signalait par-dessus une erreur CORS trompeuse : la page d'erreur du
proxy ne porte pas d'en-tête `Access-Control-Allow-Origin`, donc le vrai motif
était masqué par un faux.

Le motif, c'est le délai. Gunicorn tue un worker qui n'a pas répondu au bout de
`timeout` — 30 secondes par défaut. Avec des workers synchrones, c'est le
worker lui-même qui lit le corps de la requête : tant que le fichier monte, il
ne « répond » pas. Une vidéo de quelques dizaines de mégaoctets envoyée depuis
une connexion sénégalaise vers l'Oregon met plusieurs minutes. Le worker était
donc abattu à chaque fois, bien avant que Django ne voie le fichier.

C'est le cas d'école documenté par gunicorn lui-même : ses workers synchrones
supposent un proxy tampon devant eux. Le proxy de Render ne tamponne pas les
corps de requête.
"""

# ── Le réglage qui compte ───────────────────────────────────────────────────
# Cinq minutes. Assez pour un envoi lent, assez court pour qu'un worker
# réellement bloqué finisse par être recyclé.
timeout = 300

# Laisse à une requête en cours le temps de finir lors d'un redéploiement,
# plutôt que de couper l'envoi du propriétaire en pleine mise en ligne.
graceful_timeout = 120

# ── Workers ─────────────────────────────────────────────────────────────────
# Des threads, pas des processus : l'attente d'un envoi ou d'un aller-retour
# vers R2 est du temps passé à ne rien faire, et un thread endormi ne coûte pas
# de processeur. C'est exactement le profil de cette application — beaucoup
# d'attente réseau, peu de calcul.
#
# Deux workers seulement : l'instance a 512 Mo, et un processus Django avec
# Pillow chargé en occupe 150 à 200. Trois ne tiendraient pas.
worker_class = 'gthread'
workers = 2
threads = 4

# ── Mémoire ─────────────────────────────────────────────────────────────────
# Le traitement d'images fragmente la mémoire à la longue. Recycler les workers
# rend ce terrain à intervalles réguliers. Le décalage évite qu'ils repartent
# tous en même temps, ce qui creuserait un trou de service.
max_requests = 300
max_requests_jitter = 60

# ── Journal ─────────────────────────────────────────────────────────────────
# Sur la sortie standard : c'est là que Render va chercher les journaux.
accesslog = '-'
errorlog = '-'
