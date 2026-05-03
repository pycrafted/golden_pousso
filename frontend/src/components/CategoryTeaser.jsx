import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/client';

const FALLBACK = [
  { num: '01', title: 'Boubous & Bazin',      subtitle: 'Tenues de cérémonie',    href: '/boutique?category=boubous', slug: 'boubous' },
  { num: '02', title: 'Robes & Ensembles',    subtitle: 'Prêt-à-porter femme',    href: '/boutique?category=robes',   slug: 'robes'   },
  { num: '03', title: 'Bijoux & Accessoires', subtitle: 'Finitions artisanales',  href: '/boutique?category=bijoux',  slug: 'bijoux'  },
  { num: '04', title: 'Sur Mesure',           subtitle: 'Votre vision, nos mains', href: '/contact',                  slug: null      },
];

const CategoryCard = ({ item, index, onSelect, isActive }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const handleClick = () => {
    if (onSelect && item.slug) {
      onSelect(item.slug);
    } else {
      navigate(item.href);
    }
  };

  const active = isActive && item.slug;

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
        padding: '2rem 3.2rem',
        cursor: 'pointer',
        borderRight: index < 3 ? '1px solid #E0D0B8' : 'none',
        background: active ? 'rgba(184,150,10,0.10)' : hovered ? 'rgba(184,150,10,0.06)' : 'transparent',
        transition: 'background 0.4s ease',
        overflow: 'hidden',
      }}
    >
      {/* Ligne dorée haut — permanente si actif, glisse au hover sinon */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '2px',
        background: '#B8960A',
        transform: (active || hovered) ? 'scaleX(1)' : 'scaleX(0)',
        transformOrigin: 'left',
        transition: 'transform 0.45s cubic-bezier(0.77,0,0.175,1)',
      }} />


      {/* Bas — sous-titre + titre + CTA */}
      <div>
        <h3 style={{
          fontFamily: 'Aclonica, sans-serif',
          fontSize: 'clamp(1.8rem, 2vw, 2.8rem)',
          color: (active || hovered) ? '#1A1208' : '#7A6A50',
          lineHeight: 1.1,
          letterSpacing: '-0.01em',
          marginBottom: '1.4rem',
          transition: 'color 0.35s ease',
        }}>
          {item.title}
        </h3>

        {/* Explorer → */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.8rem',
          opacity: (active || hovered) ? 1 : 0,
          transform: (active || hovered) ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
        }}>
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '1rem',
            fontWeight: 600,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#B8960A',
          }}>
            Explorer
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="#B8960A" strokeWidth="2" strokeLinecap="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </div>
      </div>
    </div>
  );
};

const CategoryTeaser = ({ onSelect, activeSlug }) => {
  const [categories, setCategories] = useState(FALLBACK);

  useEffect(() => {
    apiClient.get('/categories/')
      .then((res) => {
        const data = res.data.results ?? res.data;
        if (!data || data.length < 4) return;
        setCategories(
          data.slice(0, 4).map((cat, i) => ({
            num:      FALLBACK[i].num,
            title:    cat.name,
            subtitle: FALLBACK[i].subtitle,
            href:     `/boutique?category=${cat.slug}`,
            slug:     cat.slug,
          }))
        );
      })
      .catch(() => {});
  }, []);

  return (
    <section style={{ background: '#FAF6EE', borderTop: '1px solid #E0D0B8', padding: '4rem 0 0' }}>
    <div
      className="cat-teaser"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        maxWidth: '110rem',
        margin: '0 auto',
      }}
    >
      {categories.map((item, i) => (
        <CategoryCard
          key={item.title}
          item={item}
          index={i}
          onSelect={onSelect}
          isActive={activeSlug === item.slug}
        />
      ))}

      <style>{`
        @media (max-width: 768px) {
          .cat-teaser {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .cat-teaser > div {
            border-right: none !important;
            border-bottom: 1px solid #E0D0B8;
          }
          .cat-teaser > div:nth-child(odd) {
            border-right: 1px solid #E0D0B8 !important;
          }
        }
      `}</style>
    </div>
    </section>
  );
};

export default CategoryTeaser;
