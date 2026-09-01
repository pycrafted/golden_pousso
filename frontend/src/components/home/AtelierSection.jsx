import { useState, useEffect } from 'react';
import apiClient from '../../api/client';
import Reveal from '../Reveal';
import CldImg from '../CldImg';
import useTexteSection from '../../hooks/useTexteSection';

/**
 * L'atelier — ce que la maison a et que les autres n'ont pas.
 * ---------------------------------------------------------------------------
 * Tongoro, la référence sénégalaise du secteur, vend une image de marque. Ici
 * il y a un atelier réel à Pikine, des tailleurs, des mains. C'est le seul
 * actif qu'aucun concurrent ne peut copier, et la page d'accueil n'en disait
 * rien : l'histoire était reléguée dans une page À propos, où presque personne
 * n'allait — page depuis supprimée. Cette section porte donc seule le récit de
 * l'atelier sur tout le site.
 *
 * Composition en deux visuels décalés plutôt qu'en bloc : la paire cesse
 * d'être une galerie et devient une image composée. Le décalage vertical de
 * la première tuile est le seul geste, il suffit.
 */

const VISUEL_SECOURS = ['/images/atailleur.webp', '/images/hero.jpg'];

const AtelierSection = () => {
  // Les deux visuels viennent du back-office : Espace Gestion → Contenu du
  // site → « Notre savoir-faire ». Ils sont distincts de la photo de la page
  // À propos, d'où le groupe `accueil` renvoyé par l'API. Les fichiers
  // locaux ne servent que de repli tant que rien n'a été mis en ligne.
  const [visuels, setVisuels] = useState(VISUEL_SECOURS);
  const textes = useTexteSection('accueil-atelier',
    { titre: 'L’élégance africaine' });

  useEffect(() => {
    apiClient.get('/atelier-image/')
      .then(({ data }) => {
        const lot = data.accueil ?? [];
        if (!lot.length) return;
        // Chaque photo va à la place que lui donne son `order` : publier la
        // seule photo de droite ne doit pas la faire atterrir à gauche.
        const parOrdre = (n) => lot.find((i) => i.order === n)?.image_url;
        setVisuels([
          parOrdre(0) ?? VISUEL_SECOURS[0],
          parOrdre(1) ?? VISUEL_SECOURS[1],
        ]);
      })
      .catch(() => {});
  }, []);

  return (
    <section>
      <div className="container">
        <Reveal className="atelier-grille" variant="blur">
          {/* Deux photos du même lieu et de la même lumière : sorties de deux
              décors différents, la paire se lirait comme deux emprunts. */}
          <div className="atelier-visuels">
            <div className="media atelier-visuel atelier-visuel--decale">
              <CldImg src={visuels[0]} alt="L’atelier Golden Pousso à Pikine"
                   sizes="(max-width: 900px) 45vw, 22vw" widths={[400, 800]} />
            </div>
            <div className="media atelier-visuel">
              <CldImg src={visuels[1]} alt=""
                   sizes="(max-width: 900px) 45vw, 22vw" widths={[400, 800]} />
            </div>
          </div>

          {/* Deux blocs et non une suite de frères : c'est ce qui permet au
              titre de tenir le haut et à la prose de tenir le bas, l'espace
              restant s'ouvrant entre les deux. Voir .atelier-texte. */}
          <div className="atelier-texte">
            <div>
              {/* Titre seul, souligné du filet doré. Le sur-titre « Notre
                  savoir-faire » a été retiré ; le champ existe toujours en
                  base pour cette section mais n'est plus affiché. */}
              <h2>{textes.titre}</h2>
              <span className="filet-titre" aria-hidden="true" />
            </div>

            {/* Texte fourni par la maison, repris mot pour mot. Ne pas le
                réécrire : c'est sa parole, pas la nôtre. La dernière ligne est
                la signature de la maison — celle qui figure sur l'enseigne de
                la boutique — d'où son traitement à part. */}
            <div className="atelier-prose">
              <p>
                Golden Pousso est une maison de couture spécialisée dans la
                création et la vente de mode africaine haut de gamme. À travers
                des créations élégantes et raffinées, nous associons le
                savoir-faire de la couture africaine à une touche de modernité.
              </p>
              <p>
                Nos collections proposent des boubous pour hommes et femmes,
                ainsi qu’une sélection de chaussures, sacs à main et bijoux
                soigneusement choisis pour sublimer chaque style.
              </p>
              <p>
                Chez Golden Pousso, chaque création est une célébration de
                l’élégance, de l’authenticité et de la richesse de la mode
                africaine.
              </p>
              <p className="atelier-signature">
                Golden Pousso, la couture africaine autrement&#8239;!
              </p>
            </div>
          </div>
        </Reveal>
      </div>

      <style>{`
        /* La colonne des photos prend plus de place que celle du texte, et la
           gouttière centrale se resserre. À deux colonnes égales et 96 px
           d'écart, chaque photo tombait à 268 px de large — la plus petite
           image de la page, pour la section censée montrer l'atelier. */
        .atelier-grille {
          display: grid;
          grid-template-columns: 1.4fr 1fr;
          /* « stretch » (la valeur par défaut, écrite ici pour qu'on ne la
             remette pas à « start » par réflexe) : les deux colonnes prennent
             la même hauteur.

             C'est ce qui fait finir le texte exactement où finit la photo de
             GAUCHE. La colonne des photos mesure la hauteur d'une photo PLUS
             les 48 px dont la gauche est décalée — son bas est donc le bas de
             la photo de gauche. La colonne de texte épousant cette hauteur,
             sa dernière ligne tombe sur la même horizontale. */
          align-items: stretch;
          gap: clamp(var(--s-6), 4vw, var(--s-8));
        }

        .atelier-visuels {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--s-3);
        }
        /* 2/3 plutôt que 3/4 : un boubou est une silhouette debout, le cadre
           doit être plus haut que large pour la contenir en entier. */
        .atelier-visuel { aspect-ratio: 2 / 3; }
        /* Le décalage est le geste de la composition : sans lui, les deux
           photos forment un rectangle et la section redevient une galerie. */
        .atelier-visuel--decale { margin-top: var(--s-7); }
        .atelier-visuel img { transition: transform 1100ms var(--ease); }
        .atelier-visuel:hover img { transform: scale(1.05); }

        /* Le filet suit l'alignement de la colonne, qui est à gauche —
           contrairement à la section contact, centrée. Laissé en marge auto,
           il se serait posé au milieu du texte, détaché du titre. */
        .atelier-texte .filet-titre { margin-inline: 0; }

        /* Le filet ne porte qu'une marge haute : sans marge ici, la citation
           venait se coller dessous.

           ⚠ PLUS DE JUSTIFICATION — retirée à la demande. Le texte est au fer
           à gauche, bord droit libre. La coupure automatique (hyphens) est
           partie avec : elle n'existait que pour éviter les rivières blanches
           qu'ouvrait la justification sur une colonne de 46 caractères en
           français. Sans justification, elle ne ferait que couper des mots
           sans raison. */
        /* La prose suit le titre, sans espace ouvert entre les deux.

           Elle a été un temps poussée vers le BAS de la colonne
           (justify-content: space-between) pour que sa dernière ligne tombe au
           niveau du bas de la photo de gauche. Le texte ayant depuis perdu sa
           taille de chapô, l'écart ainsi ouvert au milieu de la colonne
           devenait un trou. Le texte remonte donc sous le titre, et la colonne
           finit où finit son texte. */
        .atelier-texte {
          display: flex;
          flex-direction: column;
          gap: var(--s-5);
        }

        .atelier-prose { display: flex; flex-direction: column; gap: var(--s-4); }
        .atelier-prose p:not(.atelier-signature) {
          color: var(--text-muted);
          max-width: 46ch;
        }

        /* La signature de la maison, pas un quatrième paragraphe : en laiton,
           dans la fonte de titrage, légèrement détachée. */
        .atelier-signature {
          margin-top: var(--s-2);
          font-family: var(--font-display);
          font-size: var(--t-body);
          font-style: italic;
          color: var(--text-accent) !important;
        }

        @media (max-width: 900px) {
          .atelier-grille { grid-template-columns: 1fr; gap: var(--s-7); }
          .atelier-visuel--decale { margin-top: var(--s-5); }
        }
      `}</style>
    </section>
  );
};

export default AtelierSection;
