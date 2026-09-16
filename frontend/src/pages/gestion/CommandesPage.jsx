import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../api/client';
import {
  PageHeader, GestionButton, IconButton, Recherche, Pilules, Badge, GestionTable, Td,
  EmptyState, ConfirmDialog, Tiroir, Bloc, Chargement,
} from './ui';

/**
 * Les commandes — payées seulement.
 * ---------------------------------------------------------------------------
 * À la demande, plus rien ne concerne le paiement sur cette page : c'est le
 * paiement qui active une commande, et on ne prépare pas une commande non
 * payée. Tout paiement passe par PayDunya, dont le retour marque seul la
 * commande « Payée ». Le serveur ne sert donc ici que les
 * commandes payées, et refuse de modifier le paiement.
 *
 * Plus de statut « En attente » non plus : il voulait dire « en attente de
 * paiement ». Une commande arrive ici « Payée », passe « En livraison »,
 * puis « Livrée ».
 *
 * ── Supprimer une commande ─────────────────────────────────────────────────
 * À la demande : la corbeille de la ligne (et le pied du tiroir) efface la
 * commande, définitivement — ses articles partent avec elle. Le compte du
 * client n'est pas touché : une commande ne lui est liée que par téléphone.
 *
 * ⚠ Le STOCK suit ce que la commande a fait : une commande jamais partie
 * (« Payée », « Annulée ») rend ses pièces au rayon — sinon une commande
 * d'essai effacée retiendrait sa taille pour toujours ; une commande « En
 * livraison » ou « Livrée » ne rend rien, les pièces sont dehors. Le serveur
 * en décide, la confirmation le dit avant de cliquer.
 *
 * ── Le dessin ──
 * Refonte dans le dessin du site, à la demande : le filtre des statuts est
 * une rangée de pilules comptées (il était un menu déroulant), une ligne
 * s'ouvre d'un clic, et le détail est un tiroir du panier où le statut se
 * choisit en pilules.
 */

const formatFCFA = (n) => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';
const dateLisible = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

/* Payée → En livraison → Livrée, à la demande : on vend des vêtements, il
   n'y a rien à « préparer ». Plus d'« En préparation ». */
const STATUS_LABELS = {
  confirmed: 'Payée', shipped: 'En livraison',
  delivered: 'Livrée', cancelled: 'Annulée',
};
const STATUS_TONE = {
  confirmed: 'warning', shipped: 'info',
  delivered: 'success', cancelled: 'danger',
};

/* Une commande jamais partie rend ses pièces au rayon quand on la supprime ;
   une commande expédiée ou livrée, non. C'est le serveur qui applique la
   règle (`GestionOrderViewSet.perform_destroy`) — elle est répétée ici pour
   que la confirmation dise ce qui va se passer. */
const RENDUE_AU_STOCK = new Set(['confirmed', 'cancelled']);

const ZONES = {
  dakar_centre: 'Dakar Centre',
  dakar_banlieue: 'Dakar Banlieue / Pikine',
  thies: 'Thiès et environs',
  pickup: 'Retrait en boutique',
};

const Ligne = ({ libelle, valeur, fort = false }) => (
  <div className={`cmd-ligne${fort ? ' cmd-ligne--fort' : ''}`}>
    <span>{libelle}</span>
    <span className="gx-num">{valeur}</span>
  </div>
);

const OrderDetail = ({ order, onClose, onUpdated, onSupprimer }) => {
  const [status, setStatus] = useState(order.status);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await apiClient.patch(`/gestion/orders/${order.id}/`, { status });
      toast.success('Commande mise à jour — client notifié par email si statut changé');
      onUpdated(res.data);
    } catch (err) {
      const erreurs = err.response?.data;
      toast.error(erreurs?.status?.[0] || erreurs?.detail || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Tiroir
      titre={`Commande ${order.order_number}`}
      sousTitre={`Payée le ${dateLisible(order.created_at)}`}
      onClose={onClose}
      fermable={!saving}
      pied={(
        <>
          <GestionButton variant="danger" icone="bx-trash" onClick={onSupprimer} disabled={saving}>
            Supprimer
          </GestionButton>
          <GestionButton onClick={save} disabled={saving || status === order.status}>
            {saving ? 'Enregistrement…' : 'Mettre à jour le statut'}
          </GestionButton>
        </>
      )}
    >
      <Bloc titre="Statut">
        <Pilules
          label="Statut de la commande"
          valeur={status}
          onChange={setStatus}
          options={Object.entries(STATUS_LABELS).map(([valeur, libelle]) => ({ valeur, libelle }))}
        />
      </Bloc>

      <Bloc titre="Client">
        <p className="cmd-client">{order.customer_name}</p>
        <p className="cmd-contact">
          <a href={`tel:${order.customer_phone}`} className="link-reveal">{order.customer_phone}</a>
          {order.customer_email && (
            <> · <a href={`mailto:${order.customer_email}`} className="link-reveal">{order.customer_email}</a></>
          )}
        </p>
        {order.delivery_address && <p className="cmd-contact">{order.delivery_address}</p>}
        {order.notes && <p className="cmd-note">« {order.notes} »</p>}
      </Bloc>

      <Bloc titre="Articles">
        {order.items.map((it) => (
          <div key={it.id} className="cmd-article">
            <span className="cmd-quantite gx-num">{it.quantity}×</span>
            <span className="cmd-article-nom">{it.product_name}</span>
            <span className="price">{formatFCFA(it.line_total)}</span>
          </div>
        ))}
        <div className="cmd-totaux">
          <Ligne libelle="Sous-total" valeur={formatFCFA(order.subtotal)} />
          <Ligne libelle={`Livraison — ${ZONES[order.delivery_zone] ?? order.delivery_zone}`} valeur={formatFCFA(order.delivery_fee)} />
          <Ligne libelle="Total" valeur={formatFCFA(order.total)} fort />
        </div>
      </Bloc>
    </Tiroir>
  );
};

const CommandesPage = () => {
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [recherche, setRecherche] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(() => {
    apiClient.get('/gestion/orders/?page_size=200').then((r) => setOrders(r.data.results ?? r.data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const supprimer = (o) => {
    const pieces = o.items?.reduce((n, it) => n + it.quantity, 0) ?? 0;
    setConfirm({
      title: `Supprimer la commande ${o.order_number} ?`,
      description: [
        "Elle sera effacée définitivement, avec ses articles. Le compte du client n'est pas touché.",
        RENDUE_AU_STOCK.has(o.status)
          ? `Elle n'est pas partie : ${pieces > 1 ? `ses ${pieces} pièces retournent` : 'sa pièce retourne'} en stock.`
          : 'Elle est déjà partie : le stock n’est pas modifié.',
      ].join(' '),
      confirmLabel: 'Supprimer',
      onConfirm: async () => {
        try {
          await apiClient.delete(`/gestion/orders/${o.id}/`);
          toast.success('Commande supprimée');
          setSelected(null);
          load();
        } catch (err) {
          toast.error(err.response?.data?.detail || 'Erreur lors de la suppression');
        }
        setConfirm(null);
      },
    });
  };

  /* La recherche, à la demande — côté navigateur : toutes les commandes
     payées sont déjà chargées. Numéro, nom et e-mail du client sans tenir
     compte de la casse ; le téléphone sur ses seuls chiffres, pour que
     « 77 123 » trouve « +22177123… ». Elle se combine au filtre de statut. */
  const terme = recherche.trim().toLowerCase();
  const chiffres = terme.replace(/\D/g, '');
  const correspond = (o) => !terme
    || [o.order_number, o.customer_name, o.customer_email]
      .some((champ) => (champ || '').toLowerCase().includes(terme))
    || (chiffres.length > 0 && (o.customer_phone || '').replace(/\D/g, '').includes(chiffres));

  const trouvees = orders.filter(correspond);
  const filtered = trouvees.filter((o) => !statusFilter || o.status === statusFilter);

  /* Les compteurs des pilules suivent la recherche : ils disent combien de
     commandes on obtiendra en cliquant. */
  const optionsStatut = [
    { valeur: '', libelle: 'Toutes', nb: trouvees.length },
    ...Object.entries(STATUS_LABELS).map(([valeur, libelle]) => ({
      valeur, libelle, nb: trouvees.filter((o) => o.status === valeur).length,
    })),
  ];

  const aTraiter = orders.filter((o) => o.status === 'confirmed').length;
  const compte = loading ? null : orders.length === 0 ? null
    : `${orders.length} commande${orders.length > 1 ? 's' : ''} payée${orders.length > 1 ? 's' : ''}`
      + (aTraiter ? ` · ${aTraiter} à expédier` : '');

  return (
    <>
      {/* Plus d'export CSV, à la demande : le bouton et sa fonction ont été
          retirés. */}
      <PageHeader
        title="Commandes"
        compte={compte}
        action={
          <>
            <Recherche
              label="Rechercher : n°, client, téléphone, email"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
            />
            <Pilules label="Filtrer par statut" options={optionsStatut} valeur={statusFilter} onChange={setStatusFilter} />
          </>
        }
      />

      {loading ? <Chargement /> : filtered.length === 0 ? (
        <EmptyState
          icon="bx-receipt"
          title={terme || statusFilter ? 'Aucune commande trouvée' : "Aucune commande payée pour l'instant"}
          description={terme || statusFilter ? 'Modifiez la recherche, ou revenez à « Toutes ».' : 'Les commandes apparaissent ici dès que leur paiement PayDunya est reçu.'}
          action={(terme || statusFilter) && (
            <GestionButton variant="outline" onClick={() => { setRecherche(''); setStatusFilter(''); }}>
              Tout afficher
            </GestionButton>
          )}
        />
      ) : (
        <GestionTable columns={['N°', 'Client', { titre: 'Total', droite: true }, 'Statut', 'Date', '']}>
          {filtered.map((o) => (
            /* Toute la ligne ouvre le détail ; le bouton reste pour le clavier. */
            <tr key={o.id} data-cliquable onClick={() => setSelected(o)}>
              <Td intitule="N°" className="gx-num cmd-numero">{o.order_number}</Td>
              <Td intitule="Client">
                <span>
                  {o.customer_name}
                  <span className="gx-secondaire gx-num">{o.customer_phone}</span>
                </span>
              </Td>
              <Td intitule="Total" className="gx-num gx-droite">{formatFCFA(o.total)}</Td>
              <Td intitule="Statut"><Badge tone={STATUS_TONE[o.status] ?? 'neutral'}>{STATUS_LABELS[o.status] ?? o.status}</Badge></Td>
              <Td intitule="Date" className="gx-num gx-attenue">{dateLisible(o.created_at)}</Td>
              <Td className="gx-droite">
                {/* La ligne entière ouvre le détail : les actions arrêtent le
                    clic, sans quoi la corbeille ouvrirait aussi le tiroir. */}
                <div className="gx-actions">
                  <GestionButton variant="outline" petit onClick={(e) => { e.stopPropagation(); setSelected(o); }}>
                    Détail
                  </GestionButton>
                  <IconButton
                    icone="bx-trash"
                    danger
                    label={`Supprimer la commande ${o.order_number}`}
                    onClick={(e) => { e.stopPropagation(); supprimer(o); }}
                  />
                </div>
              </Td>
            </tr>
          ))}
        </GestionTable>
      )}

      {selected && (
        <OrderDetail
          key={selected.id}
          order={selected}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => { setSelected(updated); load(); }}
          onSupprimer={() => supprimer(selected)}
        />
      )}

      {confirm && <ConfirmDialog {...confirm} onCancel={() => setConfirm(null)} />}

      <style>{`
        .cmd-numero { color: var(--gp-brass-400); font-weight: 600; letter-spacing: 0.04em; }

        .gx-tiroir .gx-filtres { justify-content: flex-start; }
        .cmd-client { font-family: var(--font-display); font-size: 2rem; }
        .cmd-contact { margin-top: 0.6rem; font-size: 1.4rem; color: var(--text-muted); overflow-wrap: anywhere; }
        .cmd-contact a { color: var(--gp-ecru-50); }
        .cmd-note {
          margin-top: 1.4rem;
          padding: 1.2rem 1.6rem;
          border-left: 2px solid var(--gp-brass-400);
          font-size: 1.4rem;
          font-style: italic;
          color: var(--text);
        }

        .cmd-article {
          display: flex;
          align-items: baseline;
          gap: 1.2rem;
          padding: 1.2rem 0;
          border-bottom: 1px solid var(--line);
          font-size: 1.4rem;
        }
        .cmd-article:first-of-type { border-top: 1px solid var(--line); }
        .cmd-quantite { min-width: 3ch; color: var(--text-muted); }
        .cmd-article-nom { flex: 1; min-width: 0; }
        .cmd-article .price { font-size: 1.4rem; white-space: nowrap; }

        .cmd-totaux { padding-top: 1.2rem; }
        .cmd-ligne {
          display: flex;
          justify-content: space-between;
          gap: 1.6rem;
          padding: 0.5rem 0;
          font-size: 1.35rem;
          color: var(--text-muted);
        }
        .cmd-ligne--fort {
          margin-top: 0.8rem;
          padding-top: 1.2rem;
          border-top: 1px solid var(--line-dark-accent);
          font-family: var(--font-display);
          font-size: 1.9rem;
          color: var(--gp-ecru-50);
        }
        .cmd-ligne--fort .gx-num { color: var(--gp-brass-400); }
      `}</style>
    </>
  );
};

export default CommandesPage;
