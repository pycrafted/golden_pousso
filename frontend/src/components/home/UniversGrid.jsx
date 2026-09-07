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
 * voile en dégradé, pastille blanche qui arrive de la gauche au survol. Seuls
 * l'en-tête et les données ont changé. Ne pas « harmoniser » le reste sans
 * demande.
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
    <section className="uv">
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
                  {/* Le nom est posé sur une étiquette, au bas et au milieu de
                      la tuile. La flèche vit DANS l'étiquette et non à côté :
                      deux objets séparés au bas d'une carte centrée se
                      seraient lus comme deux éléments sans rapport. */}
                  <h3 className="uv-etiquette">
                    {nom}
                    <svg className="uv-fleche" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" strokeWidth={1.9}
                         strokeLinecap="round" strokeLinejoin="round"
                         aria-hidden="true">
                      <path d="M7.5 16.5 16.5 7.5" />
                      <path d="M9 7.5h7.5V15" />
                    </svg>
                  </h3>
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

          font-family: var(--uv-font);
        }

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
          grid-auto-rows: clamp(180px, 45vw, 470px);
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
          padding: 8px calc(12px + var(--uv-reserve, 0px)) 44px;
        }
        .uv-tuile--large.uv-tuile--detouree:not(.uv-tuile--paire) .uv-photo img {
          /* La grande tuile est deux fois plus haute : elle peut s'offrir de
             l'air sans que la piece devienne minuscule. */
          padding: 16px calc(16px + var(--uv-reserve, 0px)) 56px;
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
          padding: 8px 12px 46px;
          box-sizing: border-box;
        }
        .uv-tuile--large.uv-tuile--paire .uv-photo { padding: 16px 12px 64px; }
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
          .uv-tuile--paire .uv-photo { gap: 10px; padding: 8px 16px 48px; }
          .uv-tuile--large.uv-tuile--paire .uv-photo { gap: 20px; padding: 20px 20px 72px; }
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

        /* L'étiquette : un objet posé SUR la photo, pas du texte incrusté
           dedans. D'où le fond clair plutôt que du blanc sur l'image — un nom
           en blanc dépend de ce qu'il y a derrière, et les cinq photos n'ont
           ni la même clarté ni le même sujet à cet endroit. Sur l'étiquette,
           l'encre tient son contraste quelle que soit la photo. */
        .uv-etiquette {
          display: inline-flex;
          align-items: center;
          gap: 0;
          max-width: 100%;
          padding: 9px 18px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, .93);
          backdrop-filter: blur(10px);
          box-shadow: 0 6px 20px -10px rgba(36, 26, 32, .5);
          font-family: var(--uv-font);
          font-size: 15px;
          font-weight: 800;
          letter-spacing: -.015em;
          color: var(--uv-ink);
          text-align: center;
        }

        .uv-tuile--large .uv-etiquette { font-size: 18px; padding: 11px 22px; }

        /* La flèche arrive au survol. Elle ne s'affiche pas d'un coup : c'est
           l'écart de l'étiquette qui s'ouvre pour lui faire place, si bien que
           l'étiquette s'élargit au lieu de laisser un trou. */
        .uv-fleche {
          width: 0;
          height: 15px;
          flex-shrink: 0;
          opacity: 0;
          transition: all 400ms var(--uv-ease);
        }
        .uv-tuile:hover .uv-etiquette { gap: 8px; background: #fff; }
        .uv-tuile:hover .uv-fleche { width: 15px; opacity: 1; }

        @media (prefers-reduced-motion: reduce) {
          .uv-photo img, .uv-fleche, .uv-etiquette { transition: none; }
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
            grid-auto-rows: 300px;
          }
        }
      `}</style>
    </section>
  );
};

export default UniversGrid;
