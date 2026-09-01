import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import useCartStore from '../store/cartStore';
import SEOHead from '../components/SEOHead';
import apiClient from '../api/client';

/**
 * Commande — le tunnel d'achat, en trois étapes.
 * ===========================================================================
 * Réécriture du dessin, pas du fonctionnement. Les données envoyées, les
 * routes appelées, le passage par PayDunya, le repli sur /orders/ et tout ce
 * qui est écrit en sessionStorage sont repris à l'identique.
 *
 * Ce qui change, c'est que la page ne se dessine plus elle-même. Elle avait sa
 * palette en hexadécimal (#B8960A, #F0E8D8, #CEC0A0…), ses champs à
 * soulignement, ses deux boutons maison et une centaine de styles en ligne —
 * aucun token du système. Elle empruntait le vocabulaire du site sans en
 * parler la langue.
 *
 * Elle reprend maintenant ce qui existe, comme /profil : `.catalogue-page`
 * pour le cadre, `.card` pour les surfaces, `.field` pour les champs, `.btn`
 * pour les actions, `.eyebrow` pour les intitulés, et les tokens pour tout le
 * reste.
 *
 * ── Les cartes ─────────────────────────────────────────────────────────────
 * Chaque étape est une carte au chrome du site (#161B2D), et le récapitulatif
 * en est une seconde, collée à droite. C'est le dessin de la carte du compte,
 * repris ici pour que le tunnel ne soit pas une île.
 *
 * ⚠ CE QUI A ÉTÉ RETIRÉ DE L'ÉTAPE 1, à la demande : la case « c'est un
 * cadeau » avec le nom du destinataire et le mot d'accompagnement, ainsi que
 * le champ « notes / instructions » pour le livreur.
 *
 * Conséquences : un client ne peut plus signaler qu'il commande pour
 * quelqu'un d'autre, ni laisser d'indication de livraison — un étage, un
 * repère, une heure de passage. `notes` part donc toujours vide vers l'API,
 * qui l'attend toujours.
 *
 * ⚠ La carte de récapitulatif est `position: sticky` : sur un formulaire long,
 * le total doit rester lisible pendant qu'on remplit. Elle redevient un bloc
 * ordinaire sous 1024 px, où elle passe SOUS le formulaire — au-dessus, elle
 * aurait repoussé le premier champ hors de l'écran.
 */

const formatFCFA = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

const DELIVERY_ZONES = [
  { value: 'dakar_centre',   label: 'Dakar Centre',                              fee: 1500, delay: '24h' },
  { value: 'dakar_banlieue', label: 'Dakar Banlieue / Pikine',                   fee: 1000, delay: '24h' },
  { value: 'thies',          label: 'Thiès et environs',                         fee: 3000, delay: '2–3 jours' },
  { value: 'pickup',         label: 'Retrait en boutique (Pikine Tally Boumack)', fee: 0,    delay: 'Immédiat' },
];

/* Les émojis qui décoraient chaque moyen de paiement ont été retirés : le
   système n'en emploie nulle part ailleurs, et un 💳 au milieu d'une liste en
   Fraunces se lit comme un corps étranger. */
const PAYMENT_METHODS = [
  { value: 'card',             label: 'Carte bancaire',          paydunya: true,
    instructions: 'Vous serez redirigé vers la page de paiement sécurisée PayDunya (Visa, Mastercard, Orange Money, Wave…).' },
  { value: 'orange_money',     label: 'Orange Money',
    instructions: 'Envoyez le montant au 77 XXX XX XX et mentionnez votre numéro de commande.' },
  { value: 'wave',             label: 'Wave',
    instructions: 'Scannez le QR code Wave en boutique ou envoyez au 77 XXX XX XX.' },
  { value: 'free_money',       label: 'Free Money',
    instructions: 'Composez le #150# et transférez le montant au 77 XXX XX XX.' },
  { value: 'cash_on_delivery', label: 'Paiement à la livraison',
    instructions: 'Préparez le montant exact en espèces pour le livreur.' },
];

const ETAPES = ['Livraison', 'Paiement', 'Récapitulatif'];

/* ── L'avancement ──────────────────────────────────────────────────────────
   Même frise que la page « Mes commandes » : un rail continu, une puce par
   étape, un halo sur celle en cours. Deux frises de dessins différents dans
   le même parcours se seraient lues comme deux mécanismes sans rapport. */
const Frise = ({ courante }) => (
  <ol className="cde-frise" aria-label="Avancement de la commande">
    {ETAPES.map((label, i) => {
      const rang = i + 1;
      const faite = courante >= rang;
      return (
        <li
          key={label}
          className={`cde-etape${faite ? ' cde-etape--faite' : ''}${courante === rang ? ' cde-etape--ici' : ''}`}
          aria-current={courante === rang ? 'step' : undefined}
        >
          <span className="cde-puce" aria-hidden="true" />
          <span className="cde-etape-label">{label}</span>
        </li>
      );
    })}
  </ol>
);

/* ── Un champ ──────────────────────────────────────────────────────────── */
const Champ = ({ label, obligatoire, large, children }) => (
  <label className={`cde-champ${large ? ' cde-champ--large' : ''}`}>
    <span className="eyebrow">
      {label}{obligatoire && <span className="cde-requis" aria-hidden="true"> *</span>}
    </span>
    {children}
  </label>
);

/* ── Le récapitulatif ──────────────────────────────────────────────────── */
const Recapitulatif = ({ items, subtotal, deliveryFee, total }) => (
  <aside className="card cde-carte cde-recap on-dark">
    <h2 className="cde-recap-titre">Votre commande</h2>

    <ul className="cde-articles">
      {items.map((item, i) => (
        <li key={i} className="cde-article">
          <div className="cde-article-texte">
            <p className="cde-article-nom">{item.product.name}</p>
            {item.variant && (
              <p className="cde-article-variante">
                {[item.variant.size, item.variant.color].filter(Boolean).join(' · ')}
              </p>
            )}
            <p className="cde-article-qte">× {item.quantity}</p>
          </div>
          <p className="cde-article-prix">{formatFCFA(item.price * item.quantity)}</p>
        </li>
      ))}
    </ul>

    <dl className="cde-totaux">
      <div><dt>Sous-total</dt><dd>{formatFCFA(subtotal)}</dd></div>
      <div>
        <dt>Livraison</dt>
        <dd>{deliveryFee === 0 ? 'Gratuit' : formatFCFA(deliveryFee)}</dd>
      </div>
      <div className="cde-total"><dt>Total</dt><dd>{formatFCFA(total)}</dd></div>
    </dl>
  </aside>
);

/* ── Étape 1 : livraison ───────────────────────────────────────────────── */
const Etape1 = ({ form, set, setStep }) => (
  <div className="card cde-carte on-dark">
    <h2 className="cde-titre">Informations de livraison</h2>

    <div className="cde-grille">
      <Champ label="Nom complet" obligatoire large>
        <input className="field" value={form.customer_name} placeholder="Prénom et nom"
          autoComplete="name" onChange={(e) => set('customer_name', e.target.value)} />
      </Champ>

      <Champ label="Téléphone" obligatoire>
        {/* L'indicatif est posé DANS le champ plutôt qu'à côté : deux boîtes
            accolées se lisaient comme deux champs, et le +221 n'est pas
            saisissable. */}
        <span className="cde-tel">
          <span className="cde-indicatif" aria-hidden="true">+221</span>
          <input
            className="field" inputMode="numeric" placeholder="77 000 00 00"
            autoComplete="tel-national"
            value={form.customer_phone}
            onChange={(e) => set('customer_phone', e.target.value.replace(/\D/g, '').slice(0, 9))}
          />
        </span>
      </Champ>

      <Champ label="Email (optionnel)">
        <input className="field" type="email" value={form.customer_email}
          placeholder="vous@exemple.com" autoComplete="email"
          onChange={(e) => set('customer_email', e.target.value)} />
      </Champ>

      <Champ label="Zone de livraison" obligatoire large>
        <select className="field" value={form.delivery_zone}
          onChange={(e) => set('delivery_zone', e.target.value)}>
          {DELIVERY_ZONES.map((z) => (
            <option key={z.value} value={z.value}>
              {z.label} — {z.fee === 0 ? 'Gratuit' : formatFCFA(z.fee)} · {z.delay}
            </option>
          ))}
        </select>
      </Champ>

      {form.delivery_zone !== 'pickup' && (
        <Champ label="Adresse complète" obligatoire large>
          <textarea className="field cde-zone" rows={3} value={form.delivery_address}
            placeholder="Rue, quartier, ville…" autoComplete="street-address"
            onChange={(e) => set('delivery_address', e.target.value)} />
        </Champ>
      )}

    </div>

    <div className="cde-actions cde-actions--fin">
      <button
        type="button"
        className="btn btn--accent btn--auto"
        onClick={() => {
          if (!form.customer_name || !form.customer_phone) {
            toast.error('Le nom et le téléphone sont nécessaires.');
            return;
          }
          setStep(2);
        }}
      >
        Continuer
      </button>
    </div>
  </div>
);

/* ── Étape 2 : paiement ────────────────────────────────────────────────── */
const Etape2 = ({ form, set, setStep }) => (
  <div className="card cde-carte on-dark">
    <h2 className="cde-titre">Mode de paiement</h2>

    <div className="cde-moyens">
      {PAYMENT_METHODS.map((pm) => {
        const actif = form.payment_method === pm.value;
        return (
          <label key={pm.value} className={`cde-choix${actif ? ' cde-choix--actif' : ''}`}>
            <input type="radio" name="paiement" value={pm.value} checked={actif}
              onChange={() => set('payment_method', pm.value)} />
            <span className="cde-moyen-corps">
              <span className="cde-moyen-tete">
                <span className="cde-moyen-nom">{pm.label}</span>
                {pm.paydunya && <span className="badge">Recommandé</span>}
              </span>
              {/* Les instructions ne s'affichent que sur le moyen choisi :
                  les cinq à la fois font un mur qu'on ne lit pas. */}
              {actif && <span className="cde-moyen-note">{pm.instructions}</span>}
            </span>
          </label>
        );
      })}
    </div>

    <div className="cde-actions">
      <button type="button" className="cde-retour" onClick={() => setStep(1)}>
        Retour à la livraison
      </button>
      <button type="button" className="btn btn--accent btn--auto" onClick={() => setStep(3)}>
        Continuer
      </button>
    </div>
  </div>
);

/* ── Étape 3 : récapitulatif ───────────────────────────────────────────── */
const Etape3 = ({ form, zone, setStep, handleConfirm, loading }) => {
  const pm = PAYMENT_METHODS.find((p) => p.value === form.payment_method);
  return (
    <div className="card cde-carte on-dark">
      <h2 className="cde-titre">Récapitulatif</h2>

      <dl className="cde-releve">
        <div>
          <dt className="eyebrow">Client</dt>
          <dd>
            {form.customer_name}
            <span className="cde-releve-second">+221{form.customer_phone}</span>
            {form.customer_email && <span className="cde-releve-second">{form.customer_email}</span>}
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Livraison</dt>
          <dd>
            {zone?.label}
            {form.delivery_zone !== 'pickup' && form.delivery_address && (
              <span className="cde-releve-second">{form.delivery_address}</span>
            )}
            <span className="cde-releve-delai">Délai estimé : {zone?.delay}</span>
          </dd>
        </div>
        <div>
          <dt className="eyebrow">Paiement</dt>
          <dd>{pm?.label}</dd>
        </div>
      </dl>

      <div className="cde-actions">
        <button type="button" className="cde-retour" onClick={() => setStep(2)}>
          Retour au paiement
        </button>
        <button type="button" className="btn btn--accent btn--auto"
          onClick={handleConfirm} disabled={loading}>
          {loading
            ? (form.payment_method === 'card' ? 'Redirection…' : 'Envoi…')
            : (form.payment_method === 'card' ? 'Payer par carte' : 'Confirmer ma commande')}
        </button>
      </div>
    </div>
  );
};

/* ── Étape 4 : c'est enregistré ────────────────────────────────────────── */
const Etape4 = ({ form, orderNumber, total }) => {
  const pm = PAYMENT_METHODS.find((p) => p.value === form.payment_method);
  return (
    <div className="card cde-carte cde-fin on-dark">
      <p className="eyebrow cde-fin-surtitre">Commande enregistrée</p>
      <p className="cde-numero">{orderNumber}</p>
      <p className="cde-fin-note">Notez ce numéro pour suivre votre commande.</p>

      <div className="cde-paiement-note">
        <p className="eyebrow">Instructions de paiement — {pm?.label}</p>
        <p className="cde-fin-instructions">{pm?.instructions}</p>
        <div className="cde-fin-montant">
          <span className="eyebrow">Montant à payer</span>
          <span className="cde-fin-total">{formatFCFA(total)}</span>
        </div>
      </div>

      <div className="cde-actions cde-actions--centre">
        <Link to={`/commande/suivi/${orderNumber}`} className="btn btn--accent btn--auto">
          Suivre ma commande
        </Link>
        <Link to="/boutique" className="btn btn--ghost btn--auto">
          Retour à la boutique
        </Link>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════ */
const CommandePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { items, clearCart } = useCartStore();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    if (searchParams.get('payment') === 'cancel') {
      toast.error('Paiement annulé. Vous pouvez réessayer.');
    }
  }, [searchParams]);

  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', customer_email: '',
    delivery_address: '', delivery_zone: 'dakar_centre',
    payment_method: 'cash_on_delivery',
  });

  const zone = DELIVERY_ZONES.find((z) => z.value === form.delivery_zone);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const deliveryFee = zone?.fee ?? 1500;
  const total = subtotal + deliveryFee;
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  if (items.length === 0 && step < 4) {
    // La page /panier n'existe plus : un panier vide renvoie à la boutique,
    // qui est le seul endroit où le remplir.
    navigate('/boutique');
    return null;
  }

  const handleConfirm = async () => {
    setLoading(true);
    const fullPhone = form.customer_phone ? `+221${form.customer_phone}` : '';
    const payload = {
      customer_name: form.customer_name,
      customer_phone: fullPhone,
      customer_email: form.customer_email,
      delivery_address: form.delivery_address,
      delivery_zone: form.delivery_zone,
      payment_method: form.payment_method,
      /* Le champ est parti de l'écran mais reste dans la charge utile :
         l'API l'attend, et le laisser tomber ferait une requête incomplète.
         Il part donc toujours vide. */
      notes: '',
      items: items.map((i) => ({
        product_id: i.product.id,
        variant_id: i.variant?.id ?? null,
        quantity: i.quantity,
      })),
    };

    try {
      if (form.payment_method === 'card') {
        const res = await apiClient.post('/paiement/initier/', payload);
        sessionStorage.setItem(`order_phone_${res.data.order_number}`, fullPhone);
        if (form.customer_email) sessionStorage.setItem(`order_email_${res.data.order_number}`, form.customer_email);
        clearCart();
        window.location.href = res.data.invoice_url;
      } else {
        const res = await apiClient.post('/orders/', payload);
        sessionStorage.setItem(`order_phone_${res.data.order_number}`, fullPhone);
        if (form.customer_email) sessionStorage.setItem(`order_email_${res.data.order_number}`, form.customer_email);
        setOrderNumber(res.data.order_number);
        clearCart();
        setStep(4);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data || 'Erreur lors de la commande.';
      toast.error(typeof msg === 'string' ? msg : JSON.stringify(msg));
      setLoading(false);
    }
  };

  const termine = step === 4;

  return (
    <>
      <SEOHead title="Commande" url="/commande" noindex />

      <div className="catalogue-page">
        <section className="catalogue-entete">
          <h1 className="catalogue-titre">{termine ? 'Merci' : 'Commande'}</h1>
          <span className="filet-titre" aria-hidden="true" />
        </section>

        <div className="catalogue-corps">
          {!termine && (
            <div className="cde-frise-cadre">
              <Frise courante={step} />
            </div>
          )}

          <div className={termine ? 'cde-colonne' : 'cde-plan'}>
            <div>
              {step === 1 && <Etape1 form={form} set={set} setStep={setStep} />}
              {step === 2 && <Etape2 form={form} set={set} setStep={setStep} />}
              {step === 3 && (
                <Etape3 form={form} zone={zone} setStep={setStep}
                  handleConfirm={handleConfirm} loading={loading} />
              )}
              {termine && <Etape4 form={form} orderNumber={orderNumber} total={total} />}
            </div>

            {!termine && (
              <Recapitulatif items={items} subtotal={subtotal}
                deliveryFee={deliveryFee} total={total} />
            )}
          </div>
        </div>
      </div>

      <style>{`
        .cde-plan {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--s-5);
          max-width: 108rem;
          margin: 0 auto;
        }
        .cde-colonne { max-width: 68rem; margin: 0 auto; }

        @media (min-width: 1024px) {
          .cde-plan { grid-template-columns: 1.55fr 1fr; align-items: start; }
          /* Le total reste lisible pendant qu'on remplit un formulaire long.
             Il se cale sous la barre de navigation, dont la hauteur est
             publiée par la bande de coordonnées. */
          .cde-recap { position: sticky; top: calc(var(--bande-h, 0px) + 9rem); }
        }

        /* Les cartes reprennent le chrome du site, comme celle du compte. */
        .cde-carte {
          background: var(--surface-chrome);
          padding: clamp(var(--s-5), 3.5vw, var(--s-7));
        }

        .cde-titre {
          font-size: var(--t-h3);
          font-weight: 600;
          letter-spacing: var(--ls-tight);
          margin-bottom: var(--s-6);
        }

        /* ── La frise ── */
        .cde-frise-cadre { max-width: 62rem; margin: 0 auto var(--s-7); }
        .cde-frise {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: 1fr;
          margin: 0;
          padding: 0;
        }
        .cde-etape {
          position: relative;
          padding-top: var(--s-5);
          text-align: center;
          list-style: none;
        }
        .cde-etape::before {
          content: "";
          position: absolute;
          top: 0.55rem;
          left: 0;
          right: 0;
          height: 1px;
          background: var(--line);
        }
        .cde-etape:first-child::before { left: 50%; }
        .cde-etape:last-child::before  { right: 50%; }
        .cde-etape--faite::before { background: var(--line-accent); }
        .cde-puce {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 1.1rem;
          height: 1.1rem;
          border-radius: var(--r-pill);
          border: 1px solid var(--line);
          background: var(--surface);
        }
        .cde-etape--faite .cde-puce {
          border-color: var(--text-accent);
          background: var(--text-accent);
        }
        .cde-etape--ici .cde-puce {
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--text-accent) 28%, transparent);
        }
        .cde-etape-label {
          display: block;
          font-size: var(--t-xs);
          color: var(--text-muted);
        }
        .cde-etape--ici .cde-etape-label { color: var(--text); font-weight: 600; }

        /* ── Les champs ── */
        .cde-grille {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--s-5);
        }
        @media (min-width: 640px) {
          .cde-grille { grid-template-columns: 1fr 1fr; }
          .cde-champ--large { grid-column: 1 / -1; }
        }
        .cde-champ { display: block; }
        .cde-champ .eyebrow {
          display: block;
          margin-bottom: var(--s-2);
          color: var(--text-muted);
        }
        .cde-requis { color: var(--text-accent); }
        .cde-zone { resize: vertical; line-height: var(--lh-body); }

        /* L'indicatif vit dans le champ : deux boîtes accolées se lisaient
           comme deux champs distincts. */
        .cde-tel { position: relative; display: block; }
        .cde-indicatif {
          position: absolute;
          left: var(--s-4);
          top: 50%;
          transform: translateY(-50%);
          font-size: var(--t-body);
          color: var(--text-muted);
          pointer-events: none;
        }
        .cde-tel .field { padding-left: 6.4rem; }

        /* ── Les choix : cadeau, moyens de paiement ── */
        .cde-moyens { display: flex; flex-direction: column; gap: var(--s-3); }
        .cde-choix {
          display: flex;
          align-items: flex-start;
          gap: var(--s-4);
          padding: var(--s-4);
          border: 1px solid var(--line);
          border-radius: var(--r-3);
          cursor: pointer;
          transition: border-color var(--dur-1) var(--ease), background var(--dur-1) var(--ease);
        }
        .cde-choix:hover { border-color: var(--line-accent); }
        .cde-choix--actif {
          border-color: var(--text-accent);
          background: var(--surface-sunk);
        }
        .cde-choix input { accent-color: var(--text-accent); width: 1.7rem; height: 1.7rem; flex-shrink: 0; margin-top: 0.2rem; }
        .cde-moyen-corps { display: flex; flex-direction: column; gap: var(--s-2); }
        .cde-moyen-tete { display: flex; flex-wrap: wrap; align-items: center; gap: var(--s-3); }
        .cde-moyen-nom { font-size: var(--t-body); }
        .cde-moyen-note { font-size: var(--t-sm); color: var(--text-muted); line-height: var(--lh-body); }


        /* ── Le relevé de l'étape 3 ── */
        .cde-releve { display: flex; flex-direction: column; gap: var(--s-5); }
        .cde-releve > div {
          padding-bottom: var(--s-5);
          border-bottom: 1px solid var(--line);
        }
        .cde-releve > div:last-child { padding-bottom: 0; border-bottom: 0; }
        .cde-releve dt { color: var(--text-muted); margin-bottom: var(--s-2); }
        .cde-releve dd { font-size: var(--t-body); }
        .cde-releve-second,
        .cde-releve-delai {
          display: block;
          font-size: var(--t-sm);
          color: var(--text-muted);
          margin-top: 0.4rem;
        }
        .cde-releve-delai { color: var(--text-accent); }

        /* ── Les actions ── */
        .cde-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: var(--s-3);
          margin-top: var(--s-7);
        }
        .cde-actions--fin { justify-content: flex-end; }
        .cde-actions--centre { justify-content: center; }

        /* Le retour n'est pas un bouton dessiné : dans une paire de décision,
           le chemin arrière doit peser moins que celui qui avance. */
        .cde-retour {
          border: 0;
          background: none;
          padding: var(--s-2);
          font-family: var(--font-body);
          font-size: var(--t-sm);
          color: var(--text-muted);
          cursor: pointer;
        }
        .cde-retour:hover { color: var(--text); }

        /* ── Le récapitulatif ── */
        .cde-recap-titre {
          font-size: var(--t-h3);
          font-weight: 600;
          letter-spacing: var(--ls-tight);
          margin-bottom: var(--s-5);
        }
        .cde-articles { display: flex; flex-direction: column; }
        .cde-article {
          display: flex;
          justify-content: space-between;
          gap: var(--s-4);
          padding: var(--s-3) 0;
          border-bottom: 1px solid var(--line);
        }
        .cde-article-texte { min-width: 0; }
        .cde-article-nom { font-size: var(--t-sm); overflow-wrap: anywhere; }
        .cde-article-variante,
        .cde-article-qte { font-size: var(--t-xs); color: var(--text-muted); margin-top: 0.2rem; }
        .cde-article-prix {
          font-size: var(--t-sm);
          color: var(--text-accent);
          white-space: nowrap;
          font-variant-numeric: tabular-nums;
        }

        .cde-totaux { display: flex; flex-direction: column; gap: var(--s-2); margin-top: var(--s-5); }
        .cde-totaux > div { display: flex; justify-content: space-between; gap: var(--s-4); font-size: var(--t-sm); }
        .cde-totaux dt { color: var(--text-muted); }
        .cde-totaux dd { font-variant-numeric: tabular-nums; }
        .cde-total {
          align-items: baseline;
          padding-top: var(--s-4);
          margin-top: var(--s-2);
          border-top: 1px solid var(--line);
        }
        .cde-total dt { text-transform: uppercase; letter-spacing: var(--ls-eyebrow); font-size: var(--t-eyebrow); }
        .cde-total dd {
          font-family: var(--font-display);
          font-size: var(--t-h3);
          color: var(--text-accent);
        }

        /* ── La fin ── */
        .cde-fin { text-align: center; }
        .cde-fin-surtitre { color: var(--text-accent); }
        .cde-numero {
          font-family: var(--font-display);
          font-size: clamp(2.8rem, 5vw, 4.2rem);
          font-weight: 700;
          letter-spacing: var(--ls-tight);
          font-variant-numeric: tabular-nums;
          margin: var(--s-4) 0 var(--s-3);
        }
        .cde-fin-note { font-size: var(--t-sm); color: var(--text-muted); }
        .cde-paiement-note {
          text-align: left;
          margin-top: var(--s-7);
          padding: var(--s-5);
          border: 1px solid var(--line);
          border-radius: var(--r-3);
        }
        .cde-paiement-note .eyebrow { color: var(--text-accent); }
        .cde-fin-instructions {
          margin-top: var(--s-4);
          font-size: var(--t-sm);
          color: var(--text-muted);
          line-height: var(--lh-body);
        }
        .cde-fin-montant {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          justify-content: space-between;
          gap: var(--s-3);
          margin-top: var(--s-5);
          padding-top: var(--s-4);
          border-top: 1px solid var(--line);
        }
        .cde-fin-montant .eyebrow { color: var(--text-muted); }
        .cde-fin-total {
          font-family: var(--font-display);
          font-size: var(--t-h3);
          color: var(--text-accent);
          font-variant-numeric: tabular-nums;
        }

        @media (max-width: 560px) {
          .cde-frise { grid-auto-flow: row; gap: var(--s-4); }
          .cde-etape { padding-top: 0; padding-left: var(--s-5); text-align: left; }
          .cde-etape::before {
            top: 0; bottom: 0; left: 0.5rem; right: auto; width: 1px; height: auto;
          }
          .cde-etape:first-child::before { top: 50%; }
          .cde-etape:last-child::before  { bottom: 50%; right: auto; }
          .cde-puce { top: 50%; left: 0; transform: translate(0, -50%); }
        }
      `}</style>
    </>
  );
};

export default CommandePage;
