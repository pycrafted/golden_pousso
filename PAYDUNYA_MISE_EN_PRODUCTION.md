# Passage en production — Paiement PayDunya

Guide à suivre une fois que PayDunya a validé le compte entreprise Golden Pousso.

---

## 1. Vérifier que le compte est bien actif

- Connexion sur [app.paydunya.com](https://app.paydunya.com)
- Le statut du compte doit afficher **"Actif"** (plus de bandeau jaune)
- Email de confirmation reçu de PayDunya

---

## 2. Récupérer les clés de production

Dans **Intégrez notre API → Golden Pousso → Afficher les clés API** :

| Variable | Section à copier |
|---|---|
| `PAYDUNYA_MASTER_KEY` | Clé Principale (identique test/prod) |
| `PAYDUNYA_PUBLIC_KEY` | Clés API de **Production** → Clé Publique |
| `PAYDUNYA_PRIVATE_KEY` | Clés API de **Production** → Clé Privée |
| `PAYDUNYA_TOKEN` | Clés API de **Production** → Token |

---

## 3. Mettre à jour le fichier `backend/.env`

Remplacer les valeurs test par les valeurs de production :

```env
SECRET_KEY=<nouvelle-clé-secrète-django-forte>
DEBUG=False

# PayDunya — Mode PRODUCTION
PAYDUNYA_MASTER_KEY=ky0Xnmq8-a8Ie-eFP9-KXWp-Z4v9oCgmKf89
PAYDUNYA_PUBLIC_KEY=live_public_2rYY4dErudNX6Ezyzu2StvUCNnR
PAYDUNYA_PRIVATE_KEY=live_private_nTgOJKVB6Pt7p3TUuwFBc90qRRn
PAYDUNYA_TOKEN=Wo3hlyRsFDPaokBPmvVQ
PAYDUNYA_MODE=live

FRONTEND_URL=https://www.goldenpousso.sn
BACKEND_URL=https://api.goldenpousso.sn
CORS_ALLOWED_ORIGINS=https://www.goldenpousso.sn
ALLOWED_HOSTS=api.goldenpousso.sn
```

> **Important :** Générer une nouvelle `SECRET_KEY` Django solide :
> ```bash
> python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
> ```

---

## 4. Mettre à jour l'application PayDunya (dashboard)

Dans **Intégrez notre API → Golden Pousso → Modifier** :

| Champ | Valeur production |
|---|---|
| URL du site Web | `https://www.goldenpousso.sn` |
| Endpoint IPN | `https://api.goldenpousso.sn/api/v1/paiement/callback/` |
| Activer le mode production | **Oui** |

---

## 5. Vérifier le fichier `backend/requirements.txt`

S'assurer que `requests` est présent :

```bash
cd backend
grep requests requirements.txt
```

Si absent :
```bash
venv/Scripts/pip install requests
venv/Scripts/pip freeze > requirements.txt
```

---

## 6. Appliquer les migrations en production

```bash
python manage.py migrate
python manage.py collectstatic --noinput
```

---

## 7. Tester un vrai paiement (petit montant)

1. Passer une commande sur le site avec **Carte bancaire**
2. Payer **500 FCFA** avec une vraie carte (Visa/Mastercard)
3. Vérifier en admin Django que la commande passe à :
   - `payment_status: paid`
   - `status: confirmed`
4. Vérifier que le solde apparaît dans le dashboard PayDunya

---

## 8. Surveiller les premiers paiements

- Dashboard PayDunya → **Transactions récentes**
- Admin Django → **Commandes** (filtrer par `payment_method: card`)
- En cas de paiement reçu mais commande non confirmée → vérifier les logs du callback IPN

---

## Récapitulatif des URLs de l'intégration

| Endpoint | Rôle |
|---|---|
| `POST /api/v1/paiement/initier/` | Crée la commande + génère l'URL PayDunya |
| `POST /api/v1/paiement/callback/` | Webhook IPN — confirme le paiement |

---

## En cas de problème

- **Paiement reçu sur PayDunya mais commande toujours `pending`** → L'URL IPN est mal configurée dans le dashboard PayDunya. Vérifier le champ Endpoint IPN.
- **Erreur 503 au checkout** → Le backend ne répond pas à PayDunya. Vérifier que le serveur est accessible publiquement.
- **`response_code` différent de `00`** → Vérifier que `PAYDUNYA_MODE=live` et que les clés de production sont correctes.
