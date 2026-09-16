import { useState, useEffect, useId } from 'react';
import './gestion.css';

/**
 * Les briques de l'Espace Gestion.
 * ---------------------------------------------------------------------------
 * À la demande, l'Espace Gestion prolonge le dessin du site : indigo, laiton,
 * pilules, tiroirs du panier. Tout le style vit dans gestion.css (classes
 * .gx-*) ; ces composants ne posent plus aucune couleur en ligne. Ils lisaient
 * `COLORS` (theme.js), figé pour un fond clair.
 */

/** Titre de page — celui des catalogues : sur-titre, h1, filet ; puis les
 *  outils (recherche, filtres, action) centrés dessous. */
export const PageHeader = ({ title, compte, action }) => (
  <header className="gx-entete">
    <span className="eyebrow">Espace Gestion</span>
    <h1 className="gx-titre">{title}</h1>
    <span className="filet-titre" aria-hidden="true" />
    {compte && <p className="gx-compte">{compte}</p>}
    {action && <div className="gx-outils">{action}</div>}
  </header>
);

export const GestionButton = ({ children, variant = 'primary', petit = false, icone, className = '', type = 'button', ...props }) => (
  <button
    type={type}
    {...props}
    className={`gx-btn gx-btn--${variant}${petit ? ' gx-btn--petit' : ''} ${className}`.trim()}
  >
    {icone && <i className={`bx ${icone}`} aria-hidden="true" />}
    {children}
  </button>
);

/** Bouton rond à icône. `label` est obligatoire : c'est le seul nom du bouton. */
export const IconButton = ({ icone, label, danger = false, ...props }) => (
  <button
    type="button"
    {...props}
    className={`gx-icone${danger ? ' gx-icone--danger' : ''}`}
    aria-label={label}
    title={label}
  >
    <i className={`bx ${icone}`} aria-hidden="true" />
  </button>
);

export const GestionInput = ({ className = '', ...props }) => <input {...props} className={`field ${className}`.trim()} />;
export const GestionTextarea = ({ className = '', ...props }) => <textarea {...props} className={`field ${className}`.trim()} />;
export const GestionSelect = ({ children, className = '', ...props }) => (
  <select {...props} className={`field ${className}`.trim()}>{children}</select>
);

export const Recherche = ({ label, ...props }) => (
  <div className="gx-recherche">
    <i className="bx bx-search" aria-hidden="true" />
    <input type="search" className="field" aria-label={label} placeholder={label} {...props} />
  </div>
);

/** Un champ libellé. `groupe` : un <div> au lieu d'un <label>, pour un
 *  contenu qui porte déjà le sien (choix de fichier, pilules). */
export const Field = ({ label, aide, groupe = false, children }) => {
  const Balise = groupe ? 'div' : 'label';
  return (
    <Balise className="gx-champ">
      <span className="gx-label">{label}</span>
      {children}
      {aide && <span className="gx-aide">{aide}</span>}
    </Balise>
  );
};

/** Le choix d'un fichier, en pilule de contour — la case native est cachée. */
export const ChoixFichier = ({ libelle, fichier, disabled = false, ...props }) => (
  <div>
    <label className="gx-btn gx-btn--outline gx-fichier" aria-disabled={disabled || undefined}>
      <i className="bx bx-upload" aria-hidden="true" />
      {libelle}
      <input type="file" disabled={disabled} {...props} />
    </label>
    {fichier && <span className="gx-fichier-nom">{fichier.name}</span>}
  </div>
);

export const Bascule = ({ children, ...props }) => (
  <label className="gx-bascule">
    <input type="checkbox" {...props} />
    {children}
  </label>
);

/** Filtres exclusifs en pilules. `options` : [{ valeur, libelle, nb? }]. */
export const Pilules = ({ label, options, valeur, onChange }) => (
  <div className="gx-filtres" role="group" aria-label={label}>
    {options.map((o) => (
      <button
        key={o.valeur}
        type="button"
        className="gx-pilule"
        aria-pressed={valeur === o.valeur}
        onClick={() => onChange(o.valeur)}
      >
        {o.libelle}
        {o.nb !== undefined && <span className="gx-pilule-nb">{o.nb}</span>}
      </button>
    ))}
  </div>
);

/* Tons historiques (`neutral`, `success`, `warning`, `danger`) + `info`. */
export const Badge = ({ children, tone = 'neutral' }) => (
  <span className={`gx-pastille gx-pastille--${tone}`}>{children}</span>
);

export const GestionTable = ({ columns, children }) => (
  <div className="gx-cadre gx-table-cadre">
    <table className="gx-table">
      <thead>
        <tr>
          {columns.map((c, i) => {
            const col = typeof c === 'string' ? { titre: c } : c;
            return (
              <th key={col.titre || i} className={col.droite ? 'gx-droite' : undefined}>
                {col.titre || <span className="visually-hidden">Actions</span>}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

/** Une cellule. `intitule` : le nom de la colonne, affiché devant la valeur
 *  quand le tableau se replie en cartes (petit écran). */
export const Td = ({ children, intitule, className, style }) => (
  <td data-intitule={intitule} className={className} style={style}>{children}</td>
);

export const Panel = ({ children, className = '' }) => (
  <div className={`gx-cadre gx-panneau ${className}`.trim()}>{children}</div>
);

/** État vide — le constat, la phrase, l'action. */
export const EmptyState = ({ icon = 'bx-info-circle', title, description, action }) => (
  <div className="gx-cadre gx-vide">
    <span className="gx-vide-icone" aria-hidden="true"><i className={`bx ${icon}`} /></span>
    <p className="gx-vide-titre">{title}</p>
    {description && <p className="gx-vide-texte">{description}</p>}
    {action && <div className="gx-vide-action">{action}</div>}
  </div>
);

/** Squelette de chargement, au rayon des cadres qu'il remplace. */
export const Chargement = ({ lignes = 4 }) => (
  <div className="gx-squelette" aria-busy="true" aria-label="Chargement">
    {Array.from({ length: lignes }, (_, i) => <span key={i} />)}
  </div>
);

/* Échap ferme le calque. La boîte de confirmation, posée par-dessus un
   tiroir, écoute en capture et arrête l'événement : Échap ne referme qu'elle,
   pas le tiroir dessous. */
const useEchap = (onClose, actif = true, dessus = false) => {
  useEffect(() => {
    if (!actif) return undefined;
    const surTouche = (e) => {
      if (e.key !== 'Escape') return;
      if (dessus) e.stopPropagation();
      onClose?.();
    };
    window.addEventListener('keydown', surTouche, dessus);
    return () => window.removeEventListener('keydown', surTouche, dessus);
  }, [onClose, actif, dessus]);
};

/**
 * Tiroir latéral — le dessin du panier et du formulaire produit : indigo
 * glissant de la droite sur un voile flouté, titre de laiton, corps qui
 * défile seul, pied fixe portant les actions.
 */
export const Tiroir = ({ titre, sousTitre, onClose, pied, children, fermable = true }) => {
  const titreId = useId();
  useEchap(fermable ? onClose : undefined, fermable);
  return (
    <>
      <div className="gx-voile" onClick={fermable ? onClose : undefined} />
      <div role="dialog" aria-modal="true" aria-labelledby={titreId} className="gx-tiroir on-dark">
        <header className="gx-tiroir-tete">
          <div style={{ minWidth: 0 }}>
            <h2 id={titreId} className="gx-tiroir-titre">{titre}</h2>
            {sousTitre && <p className="gx-tiroir-sous-titre">{sousTitre}</p>}
          </div>
          <IconButton icone="bx-x" label="Fermer" onClick={onClose} disabled={!fermable} />
        </header>
        <div className="gx-tiroir-corps">{children}</div>
        {pied && <footer className="gx-tiroir-pied">{pied}</footer>}
      </div>
    </>
  );
};

/** Un bloc de tiroir, séparé du précédent par un filet. */
export const Bloc = ({ titre, children }) => (
  <section className="gx-bloc">
    {titre && <h3 className="gx-bloc-titre">{titre}</h3>}
    {children}
  </section>
);

/**
 * Boîte de confirmation guidée — remplace window.confirm().
 * Usage : const [confirm, setConfirm] = useState(null); setConfirm({ title, description, onConfirm })
 * puis <ConfirmDialog {...confirm} onCancel={() => setConfirm(null)} /> quand confirm !== null.
 */
export const ConfirmDialog = ({ title, description, confirmLabel = 'Confirmer', danger = true, onConfirm, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const titreId = useId();
  useEchap(onCancel, !loading, true);
  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="gx-dialogue-cadre">
      <div className="gx-voile" onClick={loading ? undefined : onCancel} />
      <div role="alertdialog" aria-modal="true" aria-labelledby={titreId} className="gx-dialogue on-dark">
        <h2 id={titreId} className="gx-tiroir-titre">{title}</h2>
        <p className="gx-dialogue-texte">{description}</p>
        <div className="gx-dialogue-actions">
          <GestionButton variant="outline" onClick={onCancel} disabled={loading}>Annuler</GestionButton>
          <GestionButton variant={danger ? 'dangerSolid' : 'primary'} onClick={handleConfirm} disabled={loading} autoFocus>
            {loading ? 'Un instant…' : confirmLabel}
          </GestionButton>
        </div>
      </div>
    </div>
  );
};
