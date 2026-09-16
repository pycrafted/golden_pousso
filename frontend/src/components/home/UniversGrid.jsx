import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import Reveal from '../Reveal';
import useTexteSection from '../../hooks/useTexteSection';
import { RAYONS, imageRayon, srcSetRayon } from '../../constants/rayons';
import { RAYONS_DETOURES, PIECES_RAYON, FOND_RAYON, CADRAGE_PIECE } from '../../constants/rayonsDetoures';

/**
 * « Catégories » — les rayons de la maison.
 * ---------------------------------------------------------------------------
 * Le DESSIN est celui de Redesign_mcommaman.com : palette rose/ink/stone, Plus
 * Jakarta Sans, tuiles à rayon 24 px, photo qui grandit de 5 % en 1100 ms,
 * voile en dégradé. Seuls l'en-tête et les données ont changé — et, à la
 * demande, le nom du rayon : il était posé sur une pastille blanche, flèche au
 * survol, et s'affiche désormais seul, en texte. Ne pas « harmoniser » le
 * reste sans demande.
 *
 * ── Le fond ─────────────────────────────────────────────────────────────────
 * #161B2D, à la demande : l'indigo du chrome, celui de « Le mot de la maison ».
 * Voir « .uv.on-dark » dans le CSS. Les tuiles détourées ont le même fond
 * et plus de filet autour (retiré à la demande) : elles s'y fondent.
 *
 * ── D'où vient quoi ─────────────────────────────────────────────────────────
 * La grille est bâtie sur RAYONS (constants/rayons.js) et non sur la réponse
 * de l'API : les cinq rayons sont structurels, ils existent toujours et dans
 * cet ordre. Elle s'affiche donc complète au premier rendu, sans attendre le
 * serveur — l'ancienne version renvoyait null tant que la requête n'avait pas
 * abouti, et la section apparaissait d'un coup au milieu de la page.
 *
 * L'API n'apporte plus qu'une chose : le NOM du rayon, que le propriétaire
 * peut modifier. Tant qu'elle n'a pas répondu, le nom de repli de RAYONS
 * s'affiche.
 *
 * Le compteur de pièces (« 8 pièces », « Bientôt ») a été retiré des tuiles.
 * Rien d'autre ne l'affichait : la page d'accueil n'annonce donc plus nulle
 * part combien de pièces contient un rayon, ni lesquels sont encore vides.
 *
 * Les photos sont des fichiers du frontend, découpées au ratio des tuiles par
 * outils/exporter_rayons.py. Aucun réglage de cadrage dans le CSS.
 *
 * ── La composition ──────────────────────────────────────────────────────────
 * Quatre colonnes, la première tuile occupe 2 × 2 :
 *
 *   [ grande ][ grande ][ petite ][ petite ]
 *   [ grande ][ grande ][ petite ][ petite ]
 *
 * Les deux rangées se remplissent exactement avec cinq rayons. La règle qui
 * étalait la deuxième tuile quand il n'y en avait que quatre a disparu avec
 * la grille dynamique.
 *
 * En dessous de 1024 px la grille tombe à deux colonnes et la grande tuile
 * garde son 2 × 2, donc toute la largeur :
 *
 *   [ grande  grande ]
 *   [ grande  grande ]
 *   [ petite ][ petite ]
 *   [ petite ][ petite ]
 *
 * Elle porte une paire de pièces détourées, qui a besoin de cette largeur ;
 * et les quatre autres se rangent en deux lignes pleines, là où cinq cases
 * simples laissaient la dernière seule à côté d'un trou.
 */

const UniversGrid = () => {
  // Le nom de chaque rayon, indexé par slug. C'est la seule chose que cette
  // section lise encore de la base : le propriétaire peut renommer un rayon.
  // Vide au premier rendu — la grille s'affiche quand même, avec les noms de
  // repli de RAYONS.
  const [noms, setNoms] = useState({});
  const textes = useTexteSection('accueil-categories', { titre: 'Notre catalogue' });

  useEffect(() => {
    apiClient.get('/categories/')
      .then(({ data }) => {
        const lot = data.results ?? data;
        setNoms(Object.fromEntries(lot.map((c) => [c.slug, c.name])));
      })
      .catch(() => {});
  }, []);

  return (
    <section className="uv on-dark">
      <div className="uv-shell">
        {/* En-tête au style Golden Pousso — c'est la seule partie de cette
            section transférée qui rejoint le système du site, à la demande :
            même traitement que le titre de « Nos créations », même filet doré. */}
        <Reveal className="uv-entete">
          <h2>{textes.titre}</h2>
          <span className="filet-titre" aria-hidden="true" />
        </Reveal>

        <Reveal className="uv-grille" stagger={110}>
          {RAYONS.map((rayon, i) => {
            const nom = noms[rayon.slug] ?? rayon.nom;
            /* La première tuile occupe 2 x 2, les quatre autres une case. */
            const grande = i === 0;
            // Un rayon sans piece garde sa photographie : la table n'a pas a
            // etre complete pour que la grille tienne.
            const pieces = RAYONS_DETOURES ? PIECES_RAYON[rayon.slug] : null;
            // Une tuile peut porter une paire — voir constants/rayonsDetoures.
            const paire = pieces && pieces.length > 1;
            // Le rattrapage des pieces couchees — voir CADRAGE_PIECE. Les
            // deux valeurs s'ajoutent aux regles du CSS au lieu de les
            // remplacer : sans entree dans la table, la tuile garde le
            // cadrage commun.
            const cadrage = (pieces && !paire && CADRAGE_PIECE[rayon.slug]) || null;
            return (
              <Link
                key={rayon.slug}
                to={`/categorie/${rayon.slug}`}
                className={`uv-tuile ${grande ? 'uv-tuile--large' : ''}`
                  + `${pieces ? ' uv-tuile--detouree' : ''}${paire ? ' uv-tuile--paire' : ''}`}
                style={pieces
                  ? {
                      background: FOND_RAYON,
                      ...(cadrage?.reserve ? { '--uv-reserve': `${cadrage.reserve}%` } : {}),
                      ...(cadrage?.assise ? { '--uv-assise': `${cadrage.assise}%` } : {}),
                    }
                  : undefined}
              >
                <div className="uv-photo">
                  {/* Un img nu et non CldImg : la photo n'est plus un média du
                      backend mais un fichier du frontend, déjà découpé en deux
                      largeurs. Il n'y a donc pas d'URL à transformer.

                      La grande tuile fait la moitié d'un conteneur de 1400 px
                      et les petites un quart : sizes le dit au navigateur pour
                      qu'il choisisse 800 ou 1600 avant d'avoir vu la mise en
                      page. */}
                  {/* `alt` vide, et c'est voulu : l'étiquette ci-dessous porte
                      déjà le nom du rayon en texte. Le répéter ici ferait
                      annoncer deux fois la même chose à un lecteur d'écran,
                      une fois pour l'image et une fois pour le titre. La photo
                      est décorative, le nom vient du <h3>. */}
                  {pieces ? (
                    /* Essai : la ou les pieces detourees remplacent la
                       photographie. Pas de srcSet — un fichier par piece, deja
                       dimensionne. Voir constants/rayonsDetoures.js. */
                    pieces.map((src) => (
                      <img key={src} src={src} alt=""
                           loading={grande ? 'eager' : 'lazy'} decoding="async" />
                    ))
                  ) : (
                    <img
                      src={imageRayon(rayon.slug, 800)}
                      srcSet={srcSetRayon(rayon.slug)}
                      sizes={grande
                        ? '(max-width: 1024px) 50vw, 50vw'
                        : '(max-width: 1024px) 50vw, 25vw'}
                      alt=""
                      loading={grande ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  )}
                </div>

                {/* Le voile n'est pas un effet de style : il garantit que
                    l'étiquette se détache quelle que soit la photo dessous.
                    Cinq images n'ont ni la même clarté ni le même sujet à cet
                    endroit. */}
                <div className="uv-voile" aria-hidden="true" />

                <div className="uv-texte">
                  {/* Le nom du rayon, en texte simple, au bas et au milieu de
                      la tuile. Il était posé sur une pastille blanche, flèche
                      au survol : ce « bouton » a été retiré à la demande. Le
                      nom reste — c'est lui qui nomme le lien, les images ayant
                      un alt vide. */}
                  <h3 className="uv-etiquette">{nom}</h3>
                </div>
              </Link>
            );
          })}
        </Reveal>
      </div>

      <style>{`
        /* Palette et rythme de la source, redéclarés localement. */
        .uv {
          --uv-rose:  #e0417f;
          --uv-ink:   #241a20;
          --uv-stone: #f6e9f0;
          --uv-ease:  cubic-bezier(0.22, 0.68, 0.16, 1);
          /* Plus Jakarta Sans, la fonte de la source, a été remplacée par
             celle du site : « tous les écrits, vraiment tous ». C'est le seul
             écart au transfert à l'identique sur ce point. */
          --uv-font:  var(--font-display);

          /* ↓ LA RÉSERVE DU BAS — la place du nom du rayon. Les pièces
             s'arrêtent au-dessus, le nom ne se pose plus sur elles. Elle
             valait 44 px, 56 en grande tuile : moins que la pastille blanche
             qui portait alors le nom (~51 et ~59 px avec son décollement du
             bord), qui mordait donc sur les pièces. Relevée à la demande. La
             pastille a été retirée depuis : le nom seul, 17 px de texte (20 en
             grande tuile) décollé du bord de 16 px par « .uv-texte », monte à
             ~36 px (~39) — la réserve lui laisse une trentaine de pixels
             d'air, gardés à la demande (« plus à l'aise »). */
          --uv-sol: 66px;
          --uv-sol-large: 80px;

          font-family: var(--uv-font);
        }

        /* ── Le fond : #161B2D ─────────────────────────────────────────────
           L'indigo du chrome (« --surface-chrome »), comme « Le mot de la
           maison ». « .on-dark », posé dans le JSX, bascule le titre et le
           filet en version fond sombre ; il pose aussi son propre fond,
           #0F1320, que cette double classe remplace. Contrastes mesurés sur ce
           fond (styles.css) : écru 15,85:1, laiton clair 7,14:1.

           Bande pleine largeur : l'écart avec ce qui précède se prend en
           MARGE, dehors, et l'espace intérieur en padding en haut ET en bas —
           sans le padding du bas, les tuiles toucheraient le bord de l'indigo.
           C'est l'exception que le rythme vertical prévoit pour une bande
           pleine largeur, pas une entorse. */
        .uv.on-dark {
          background: var(--surface-chrome);
          --surface: var(--surface-chrome);
          margin-top: var(--section-y);
          padding-block: var(--section-y);
        }
        /* Juste après le panneau de « Le mot de la maison », sur le même
           indigo : pas de marge — elle ouvrirait une bande d'écru de 80 px
           entre deux fonds sombres. Les deux bandes se fondent, sans
           séparateur. Adossé au voisinage :
           si l'ordre change, la marge revient seule. */
        .man + .uv.on-dark { margin-top: 0; }
        /* De même juste après « Nos produits », elle aussi en #161B2D : pas de
           marge, et pas de séparateur — le filet de laiton qui faisait le
           joint a été retiré à la demande, les deux bandes se fondent. */
        .ev + .uv.on-dark { margin-top: 0; }

        /* Plus de filet de laiton autour des tuiles détourées — retiré à la
           demande. Elles ont le fond de la section (FOND_RAYON, #161B2D) : la
           grille ne se lit plus que par les pièces et leurs étiquettes, qui
           flottent sur un aplat continu. Pour la redessiner, un bord de 2 px
           en « --gp-brass-400 » à 60 % a déjà servi (color-mix). */

        .uv-shell {
          margin: 0 auto;
          width: 100%;
          max-width: 1400px;
          padding: 0 20px;
        }

        /* En-tête centré, comme celui de « Nos créations ». Le titre et le
           filet suivent le système du site (Fraunces, laiton). */
        .uv-entete {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 40px;
          font-family: var(--font-display);
        }

        /* La hauteur de rang decide de la FORME de la grande tuile, et donc
           du cadrage de la paire : la tuile fait deux rangs, les quatre autres
           un seul, il n'y a pas moyen de les regler separement.

           Sur deux colonnes la grande tuile prend toute la largeur du contenu.
           Une hauteur fixe la laissait en bandeau — 836 x 456 a 900 px de
           fenetre — et deux silhouettes debout, calees sur la hauteur, y
           tenaient dans 46 % de la largeur : deux figurines au milieu d'un
           aplat. Le rang suit donc la largeur de la fenetre pour que la tuile
           reste a peu pres carree d'un bout a l'autre de la plage.

           45vw ~= (1,05 x largeur du contenu - gouttiere) / 2. Le plancher de
           180 px tient les tres petits ecrans, ou la tuile est deja carree ;
           le plafond de 470 px arrete la croissance juste avant le passage a
           quatre colonnes. */
        .uv-grille {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          /* Relevé à la demande (il valait clamp(180px, 45vw, 470px)), en même
             temps que la réserve de l'étiquette : sans lui, les pièces auraient
             rapetissé de ce que la réserve a gagné. */
          grid-auto-rows: clamp(210px, 48vw, 510px);
          gap: 12px;
        }

        /* La grande tuile occupe 2 x 2 A TOUTES LES LARGEURS, et plus seulement
           au-dela de 1024 px. Deux raisons : elle porte une paire de pieces,
           qui n'a pas la place de tenir dans une case simple sans reduire les
           deux silhouettes a des vignettes ; et sur deux colonnes, cinq tuiles
           d'une case laissaient la derniere seule sur sa ligne, avec un trou a
           cote. En 2 x 2 la grille se remplit exactement aux deux largeurs. */
        .uv-tuile--large { grid-column: span 2; grid-row: span 2; }

        .uv-tuile {
          position: relative;
          overflow: hidden;
          border-radius: 24px;
          background: var(--uv-stone);
          box-shadow: 0 18px 40px -28px rgba(36,26,32,.45);
        }

        .uv-photo { position: absolute; inset: 0; overflow: hidden; }
        .uv-photo img {
          width: 100%;
          height: 100%;
          /* cover ne rogne plus rien : les photos sont livrées au ratio de
             la tuile par outils/exporter_rayons.py. Il reste là comme
             garde-fou, au cas où un fichier serait remplacé sans repasser par
             le script. */
          object-fit: cover;
          transition: transform 1100ms var(--uv-ease);
        }
        .uv-tuile:hover .uv-photo img { transform: scale(1.05); }

        /* La piece detouree : entiere, jamais rognee, posee sur le bas.
           « contain » et non « cover » — rogner un detourage perdrait ce
           qu'on cherche a montrer. Calee en bas et non centree : centrees, une
           piece haute remplirait sa tuile pendant qu'une piece basse
           flotterait au milieu de la sienne, et la grille perdrait sa ligne.
           La reserve du bas laisse la place a l'etiquette.

           Une piece COUCHEE fait exception et remonte, parce qu'elle ne tenait
           pas cette ligne de toute facon : trop large pour etre calee sur la
           hauteur, elle se posait au fond en laissant la tuile vide au-dessus
           d'elle. Voir CADRAGE_PIECE dans constants/rayonsDetoures. */
        .uv-tuile--detouree:not(.uv-tuile--paire) .uv-photo img {
          object-fit: contain;
          object-position: center var(--uv-assise, 100%);
          /* Reserve reduite au strict minimum. Les petites tuiles font 180 px
             de haut pour pres de 600 de large : chaque pixel rendu a la piece
             compte, sinon un sac carre finit en vignette perdue au milieu d'un
             aplat. La reserve du bas est celle de l'etiquette, pas un pouce de
             plus.

             Seules les pieces couchees ajoutent aux 12 px des cotes, que
             « contain » cale sur la largeur et qui viennent donc toucher les
             deux bords ; zero pour toutes les autres — voir CADRAGE_PIECE dans
             constants/rayonsDetoures. Un pourcentage de padding se lit sur la
             LARGEUR du conteneur, la reserve suit donc la tuile. */
          padding: 8px calc(12px + var(--uv-reserve, 0px)) var(--uv-sol);
        }
        .uv-tuile--large.uv-tuile--detouree:not(.uv-tuile--paire) .uv-photo img {
          /* La grande tuile est deux fois plus haute : elle peut s'offrir de
             l'air sans que la piece devienne minuscule. */
          padding: 16px calc(16px + var(--uv-reserve, 0px)) var(--uv-sol-large);
        }
        /* Le zoom au survol part du bas, sinon la piece decolle du sol en
           grandissant. */
        .uv-tuile--detouree .uv-photo img { transform-origin: center bottom; }

        /* ── La paire ────────────────────────────────────────────────────────
           Deux pieces cote a cote dans la meme tuile. La reserve passe de
           l'image au conteneur : deux images ne peuvent pas se partager une
           largeur si chacune porte son propre padding.

           « flex-end » pose les deux silhouettes sur la MEME ligne de sol —
           l'ourlet de la robe et les chaussures de l'homme a la meme hauteur.
           Sans ca, deux detourages de proportions differentes flotteraient
           chacun a son niveau.

           Largeur « auto » et non 50 % : chaque image prend sa largeur naturelle
           a hauteur pleine, donc les deux silhouettes se tiennent au centre au
           lieu d'etre centrees chacune dans sa moitie, ce qui les aurait
           laissees a un ecran l'une de l'autre. Le retrait ne joue que quand
           la tuile devient trop etroite pour les deux. */
        .uv-tuile--paire .uv-photo {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 8px;
          /* La reserve du bas est plus large que celle d'une piece seule : deux
             pieces posees au sol occupent toute la largeur de la tuile, et
             l'etiquette est centree — elle tomberait sur l'une des deux. Une
             piece seule, elle, laisse toujours ses coins libres.
             Ces valeurs sont celles d'une tuile SIMPLE ; la grande tuile les
             reprend en plus large juste en dessous. */
          padding: 8px 12px var(--uv-sol);
          box-sizing: border-box;
        }
        .uv-tuile--large.uv-tuile--paire .uv-photo { padding: 16px 12px var(--uv-sol-large); }
        .uv-tuile--paire .uv-photo img {
          flex: 0 1 auto;
          width: auto;
          height: 100%;
          min-width: 0;
          padding: 0;
          /* « contain » ne sert qu'au retrait : tant que les deux tiennent
             cote a cote, l'image est deja a son rapport et remplit sa boite.
             Quand la tuile devient trop etroite, la boite se comprime et
             « contain » redescend la piece au lieu de l'ecraser. */
          object-fit: contain;
          object-position: center bottom;
        }
        @media (min-width: 1024px) {
          .uv-tuile--paire .uv-photo { gap: 10px; padding: 8px 16px var(--uv-sol); }
          .uv-tuile--large.uv-tuile--paire .uv-photo { gap: 20px; padding: 20px 20px var(--uv-sol-large); }
        }

        /* Le voile existe pour detacher l'etiquette d'une photographie dont on
           ne sait rien. Sur l'aplat indigo il n'a plus rien a corriger, et il
           ne ferait que ternir le bas de la piece. */
        .uv-tuile--detouree .uv-voile { display: none; }

        .uv-voile {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to top,
            rgba(36,26,32,.70),
            rgba(36,26,32,.10),
            transparent
          );
        }

        .uv-texte {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
          padding: 16px;
        }

        /* Le nom du rayon, en texte simple. Il était posé sur une pastille
           blanche — encre « --uv-ink », flèche qui arrivait au survol : ce
           « bouton » a été retiré à la demande, le nom s'affiche seul sur
           l'indigo de la tuile.

           Écru sur #161B2D : 15,85:1. Au survol il passe au laiton clair,
           « --gp-brass-400 », 7,14:1 sur ce fond : avec le zoom de la photo,
           c'est le signe que la tuile est un lien.

           ⚠ Le nom est un <h3> : « .on-dark h3 », dans styles.css, le repeint
           déjà en écru. La couleur est tout de même écrite ici, en double
           classe pour passer devant cette règle, afin que le survol l'emporte.
           Si une tuile photographique revenait (sans détourage), le voile
           sombre du bas garderait le nom lisible. */
        .uv .uv-etiquette {
          max-width: 100%;
          font-family: var(--uv-font);
          font-size: 17px;
          font-weight: 600;
          letter-spacing: .01em;
          color: var(--text-on-dark);
          text-align: center;
          transition: color 400ms var(--uv-ease);
        }
        .uv-tuile--large .uv-etiquette { font-size: 20px; }
        .uv .uv-tuile:hover .uv-etiquette,
        .uv .uv-tuile:focus-visible .uv-etiquette { color: var(--gp-brass-400); }

        @media (prefers-reduced-motion: reduce) {
          .uv-photo img, .uv-etiquette { transition: none; }
          .uv-tuile:hover .uv-photo img { transform: none; }
        }


        @media (min-width: 640px) {
          .uv-grille { gap: 16px; }
        }

        @media (min-width: 768px) {
          .uv-shell { padding: 0 32px; }
        }

        @media (min-width: 1024px) {
          .uv-shell { padding: 0 40px; }
          /* Sur quatre colonnes la grande tuile ne prend plus que la moitie de
             la largeur : elle cesse de suivre la fenetre et se fixe. 300 px de
             rang la posent a 616 px de haut pour 652 de large au maximum de la
             coque — la paire y remplit 86 % de la largeur, contre 61 % quand le
             rang valait 220. Les quatre petites tuiles heritent des memes
             300 px : un sac ou une parure, tous deux a peu pres carres, y
             gagnent autant que la paire. */
          .uv-grille {
            grid-template-columns: repeat(4, minmax(0, 1fr));
            /* 340 px et non plus 300 : relevé à la demande, avec la réserve
               de l'étiquette (--uv-sol). Une petite tuile passe de 248 à
               266 px de pièce, la grande de 524 à 596 : les pièces grandissent
               même un peu, bien que l'étiquette ait pris sa place. */
            grid-auto-rows: 340px;
          }
        }
      `}</style>
    </section>
  );
};

export default UniversGrid;
