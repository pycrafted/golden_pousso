import { useState, useEffect } from 'react';
import apiClient from '../api/client';

/**
 * Les intitulés de sections, modifiables depuis l'admin.
 * ---------------------------------------------------------------------------
 * Chaque section demande sa clé et fournit son texte d'origine en repli. Si
 * l'API ne répond pas, si la clé n'existe pas, ou pendant le chargement, c'est
 * le repli qui s'affiche : **une section ne perd jamais son titre**.
 *
 * Un seul appel réseau pour toute la page, quel que soit le nombre de sections
 * qui interrogent le hook : la promesse est mise en cache au niveau du module,
 * donc les appels suivants s'y rattachent au lieu d'en lancer un nouveau.
 */

let cache = null;      // le dictionnaire, une fois reçu
let enVol = null;      // la requête en cours, partagée entre les appelants

const charger = () => {
  if (cache) return Promise.resolve(cache);
  if (enVol) return enVol;
  enVol = apiClient.get('/textes-sections/')
    .then(({ data }) => {
      cache = data ?? {};
      return cache;
    })
    .catch(() => {
      // Un échec ne doit pas être retenté à chaque rendu : on mémorise un
      // dictionnaire vide et tout le monde retombe sur ses replis.
      cache = {};
      return cache;
    })
    .finally(() => { enVol = null; });
  return enVol;
};

/**
 * @param {string} cle     Clé technique, telle qu'elle est en base
 * @param {{surtitre?: string, titre: string}} repli  Textes écrits en dur
 * @returns {{surtitre: string, titre: string}}
 */
const useTexteSection = (cle, repli) => {
  const [textes, setTextes] = useState(() => cache?.[cle] ?? null);

  useEffect(() => {
    let vivant = true;
    charger().then((tout) => {
      if (vivant) setTextes(tout[cle] ?? null);
    });
    return () => { vivant = false; };
  }, [cle]);

  return {
    surtitre: textes?.surtitre || repli.surtitre || '',
    titre: textes?.titre || repli.titre,
  };
};

export default useTexteSection;
