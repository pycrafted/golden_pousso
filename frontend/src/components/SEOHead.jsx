import { Helmet } from 'react-helmet-async';

const SITE_NAME = 'Golden Pousso';
const DEFAULT_DESCRIPTION = 'Golden Pousso — Atelier de couture africaine haut de gamme à Dakar, Sénégal. Boubous brodés, robes wax, tenues de cérémonie et collections sur mesure.';
const DEFAULT_IMAGE = '/og-image.jpg';
const BASE_URL = 'https://goldenpousso.sn';

const SEOHead = ({ title, description, image, url, type = 'website', noindex = false }) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Couture Africaine Haut de Gamme`;
  const metaDesc = description || DEFAULT_DESCRIPTION;
  const metaImage = image || DEFAULT_IMAGE;
  const canonical = url ? `${BASE_URL}${url}` : BASE_URL;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDesc} />
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDesc} />
      <meta property="og:image" content={metaImage.startsWith('http') ? metaImage : `${BASE_URL}${metaImage}`} />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="fr_SN" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDesc} />
      <meta name="twitter:image" content={metaImage.startsWith('http') ? metaImage : `${BASE_URL}${metaImage}`} />
    </Helmet>
  );
};

export default SEOHead;
