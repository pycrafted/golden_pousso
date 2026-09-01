import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../api/client';
import Reveal from '../Reveal';
import useTexteSection from '../../hooks/useTexteSection';
import { RAYONS, imageRayon, srcSetRayon } from '../../constants/rayons';

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
            return (
              <Link
                key={rayon.slug}
                to={`/categorie/${rayon.slug}`}
                className={`uv-tuile ${grande ? 'uv-tuile--large' : ''}`}
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

        .uv-grille {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          grid-auto-rows: 180px;
          gap: 12px;
        }

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
          .uv-grille { grid-auto-rows: 220px; gap: 16px; }
        }

        @media (min-width: 768px) {
          .uv-shell { padding: 0 32px; }
        }

        @media (min-width: 1024px) {
          .uv-shell { padding: 0 40px; }
          .uv-grille { grid-template-columns: repeat(4, minmax(0, 1fr)); }
          .uv-tuile--large { grid-column: span 2; grid-row: span 2; }
        }
      `}</style>
    </section>
  );
};

export default UniversGrid;
