const AProposPage = () => {
  const values = [
    { icon: 'bx-diamond', title: 'Authenticité Africaine', desc: 'Chaque création puise ses racines dans la richesse des traditions textiles du Sénégal — wax, basin riche, soie locale — réinterprétées avec une sensibilité contemporaine.' },
    { icon: 'bx-award', title: 'Qualité Artisanale', desc: 'Nos artisans, formés depuis l\'enfance aux secrets de la couture dakaroise, façonnent chaque pièce à la main avec une précision et une patience qui ne se trouvent plus en série.' },
    { icon: 'bx-palette', title: 'Élégance Moderne', desc: 'Nous croyons que l\'élégance africaine n\'a pas à choisir entre tradition et modernité. Nos collections marient les deux avec fierté.' },
    { icon: 'bx-leaf', title: 'Circuit Court', desc: 'Tissu, broderie, confection : tout est sourcé et réalisé à Dakar. Nous soutenons l\'économie locale et réduisons notre empreinte carbone.' },
  ];

  const team = [
    { name: 'Fatoumata Diallo', role: 'Fondatrice & Créatrice', desc: 'Couturière depuis l\'âge de 14 ans, Fatoumata a fondé Golden Pousso en 2015 après avoir perfectionné son art entre Dakar et Paris.' },
    { name: 'Moussa Ndiaye', role: 'Maître Tailleur', desc: 'Avec 20 ans d\'expérience dans la confection masculine haut de gamme, Moussa est le gardien de notre excellence technique.' },
    { name: 'Aïssatou Bâ', role: 'Styliste & Broderie', desc: 'Spécialiste des broderies traditionnelles wolof et peul, Aïssatou transforme chaque tissu en œuvre d\'art portée.' },
  ];

  const milestones = [
    { year: '2015', event: 'Ouverture du premier atelier à Pikine Tally Boumack' },
    { year: '2017', event: 'Première collection capsule présentée à la FESPAD' },
    { year: '2019', event: 'Participation à la Dakar Fashion Week' },
    { year: '2021', event: 'Lancement de la boutique en ligne' },
    { year: '2023', event: 'Collaboration avec des créateurs de la diaspora' },
    { year: '2025', event: 'Nouvelle collection exclusive — Teranga Luxe' },
  ];

  return (
    <section className="section">
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #0D0D0D 60%, #1a1200)', padding: '8rem 3rem', textAlign: 'center', marginBottom: '6rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(circle at 70% 50%, #C9A84C18 0%, transparent 60%)', pointerEvents: 'none' }} />
        <span style={{ color: '#C9A84C', fontSize: '1.3rem', letterSpacing: '0.3em', textTransform: 'uppercase' }}>Notre Histoire</span>
        <h1 style={{ color: '#fff', fontSize: '4rem', fontFamily: 'Aclonica, sans-serif', margin: '1.5rem 0', lineHeight: 1.2 }}>Golden Pousso</h1>
        <p style={{ color: '#bbb', maxWidth: '60rem', margin: '0 auto', fontSize: '1.6rem', lineHeight: 1.8 }}>
          Un atelier de couture dakarois où l'âme africaine rencontre l'élégance contemporaine.
          Depuis 2015, nous habillons les femmes et les hommes qui portent leur culture avec fierté.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '4rem', marginTop: '4rem', flexWrap: 'wrap' }}>
          {[['500+', 'Créations / an'], ['10+', 'Ans d\'expérience'], ['3', 'Artisans experts'], ['100%', 'Made in Dakar']].map(([num, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ color: '#C9A84C', fontSize: '3rem', fontWeight: 700, fontFamily: 'Aclonica, sans-serif' }}>{num}</div>
              <div style={{ color: '#aaa', fontSize: '1.3rem', marginTop: '0.4rem' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="container">

        {/* Histoire */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6rem', alignItems: 'center', marginBottom: '8rem' }}>
          <div>
            <span style={{ color: '#C9A84C', fontSize: '1.3rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Notre Fondation</span>
            <h2 style={{ fontSize: '3rem', margin: '1rem 0 2rem', fontFamily: 'Aclonica, sans-serif', lineHeight: 1.3 }}>Né à Pikine,<br />rêvé pour le monde</h2>
            <p style={{ color: 'var(--default-color)', fontSize: '1.5rem', lineHeight: 1.9, marginBottom: '1.5rem' }}>
              Golden Pousso est né d'une conviction simple : la mode africaine mérite sa place sur la scène internationale,
              sans jamais renier ses racines. Fondé en 2015 dans le quartier de Pikine Tally Boumack par Fatoumata Diallo,
              l'atelier a commencé avec trois machines à coudre et un rêve immense.
            </p>
            <p style={{ color: 'var(--default-color)', fontSize: '1.5rem', lineHeight: 1.9, marginBottom: '2rem' }}>
              Aujourd'hui, Golden Pousso est une référence dans la couture sénégalaise haut de gamme.
              Nos boubous brodés, nos robes wax et nos tenues de cérémonie habillent des familles de Dakar à Paris,
              de Montréal à Dubai. Chaque pièce raconte une histoire — celle d'un peuple fier, créatif et élégant.
            </p>
            <div style={{ display: 'flex', gap: '1.5rem' }}>
              <div style={{ padding: '1.5rem 2rem', background: '#C9A84C11', borderLeft: '3px solid #C9A84C', borderRadius: '0.4rem' }}>
                <p style={{ fontSize: '1.4rem', color: 'var(--default-color)', fontStyle: 'italic' }}>
                  "La beauté africaine est infinie. Nous n'en sommes qu'au début de sa révélation."
                </p>
                <p style={{ fontSize: '1.3rem', color: '#C9A84C', fontWeight: 600, marginTop: '0.8rem' }}>— Fatoumata Diallo, Fondatrice</p>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {[
              { bg: '#C9A84C', icon: 'bx-scissors', label: 'Atelier' },
              { bg: '#0D0D0D', icon: 'bx-crown', label: 'Luxe' },
              { bg: '#1a1200', icon: 'bx-globe', label: 'Héritage' },
              { bg: '#C9A84C22', icon: 'bx-heart', label: 'Passion' },
            ].map(({ bg, icon, label }) => (
              <div key={label} style={{ background: bg, borderRadius: '1.2rem', padding: '3rem 2rem', textAlign: 'center', border: '1px solid #e0e0e022' }}>
                <i className={`bx ${icon}`} style={{ fontSize: '4rem', color: bg === '#C9A84C' ? '#fff' : '#C9A84C', display: 'block', marginBottom: '1rem' }}></i>
                <span style={{ color: bg === '#C9A84C' ? '#fff' : 'var(--default-color)', fontSize: '1.4rem', fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Valeurs */}
        <div style={{ marginBottom: '8rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <span style={{ color: '#C9A84C', fontSize: '1.3rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Ce qui nous guide</span>
            <h2 style={{ fontSize: '3rem', margin: '1rem 0', fontFamily: 'Aclonica, sans-serif' }}>Nos Valeurs</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(26rem, 1fr))', gap: '2.5rem' }}>
            {values.map(({ icon, title, desc }) => (
              <div key={title} style={{ background: '#fff', borderRadius: '1.4rem', padding: '3rem 2.5rem', boxShadow: 'var(--box-shadow-1)', borderTop: '3px solid #C9A84C' }}>
                <div style={{ width: '5.5rem', height: '5.5rem', borderRadius: '50%', background: '#C9A84C22', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.8rem' }}>
                  <i className={`bx ${icon}`} style={{ fontSize: '2.5rem', color: '#C9A84C' }}></i>
                </div>
                <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem', fontWeight: 700 }}>{title}</h3>
                <p style={{ color: 'var(--default-color)', fontSize: '1.4rem', lineHeight: 1.8 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div style={{ marginBottom: '8rem', background: 'linear-gradient(135deg, #0D0D0D, #1a1200)', borderRadius: '2rem', padding: '5rem 4rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <span style={{ color: '#C9A84C', fontSize: '1.3rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Notre parcours</span>
            <h2 style={{ fontSize: '3rem', margin: '1rem 0', fontFamily: 'Aclonica, sans-serif', color: '#fff' }}>10 ans d'excellence</h2>
          </div>
          <div style={{ position: 'relative', maxWidth: '70rem', margin: '0 auto' }}>
            <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: '2px', background: '#C9A84C44', transform: 'translateX(-50%)' }} />
            {milestones.map(({ year, event }, i) => (
              <div key={year} style={{ display: 'flex', gap: '3rem', alignItems: 'center', marginBottom: '3rem', flexDirection: i % 2 === 0 ? 'row' : 'row-reverse' }}>
                <div style={{ flex: 1, textAlign: i % 2 === 0 ? 'right' : 'left' }}>
                  <div style={{ color: '#C9A84C', fontSize: '2rem', fontWeight: 700, fontFamily: 'Aclonica, sans-serif' }}>{year}</div>
                  <div style={{ color: '#ccc', fontSize: '1.4rem', marginTop: '0.4rem' }}>{event}</div>
                </div>
                <div style={{ width: '1.6rem', height: '1.6rem', borderRadius: '50%', background: '#C9A84C', flexShrink: 0, zIndex: 1, boxShadow: '0 0 0 4px #C9A84C33' }} />
                <div style={{ flex: 1 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Équipe */}
        <div style={{ marginBottom: '8rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <span style={{ color: '#C9A84C', fontSize: '1.3rem', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Les artisans du rêve</span>
            <h2 style={{ fontSize: '3rem', margin: '1rem 0', fontFamily: 'Aclonica, sans-serif' }}>Notre Équipe</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(28rem, 1fr))', gap: '3rem' }}>
            {team.map(({ name, role, desc }) => (
              <div key={name} style={{ background: '#fff', borderRadius: '1.4rem', overflow: 'hidden', boxShadow: 'var(--box-shadow-1)', textAlign: 'center' }}>
                <div style={{ background: 'linear-gradient(135deg, #C9A84C22, #0D0D0D11)', height: '16rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '9rem', height: '9rem', borderRadius: '50%', background: '#C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #fff', boxShadow: '0 4px 20px #C9A84C44' }}>
                    <i className="bx bx-user" style={{ fontSize: '4rem', color: '#fff' }}></i>
                  </div>
                </div>
                <div style={{ padding: '2.5rem' }}>
                  <h3 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem' }}>{name}</h3>
                  <span style={{ color: '#C9A84C', fontSize: '1.3rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{role}</span>
                  <p style={{ color: 'var(--default-color)', fontSize: '1.4rem', lineHeight: 1.7, marginTop: '1.2rem' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Atelier + CTA */}
        <div style={{ background: 'linear-gradient(135deg, #C9A84C, #a8822a)', borderRadius: '2rem', padding: '5rem', textAlign: 'center', marginBottom: '5rem' }}>
          <i className="bx bx-map-pin" style={{ fontSize: '4rem', color: '#fff', display: 'block', marginBottom: '1.5rem' }}></i>
          <h2 style={{ fontSize: '3rem', fontFamily: 'Aclonica, sans-serif', color: '#fff', marginBottom: '1.5rem' }}>Visitez Notre Atelier</h2>
          <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.6rem', maxWidth: '50rem', margin: '0 auto 3rem', lineHeight: 1.8 }}>
            Venez découvrir notre atelier à Pikine Tally Boumack. Nos artisans vous accueilleront
            et vous présenteront les coulisses de chaque création.
          </p>
          <p style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem' }}>
            Tableau Gazelle N.2372 · Pikine, Dakar
          </p>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1.4rem', marginBottom: '3rem' }}>
            Lundi – Samedi · 9h00 – 19h00
          </p>
          <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/contact" style={{ background: '#fff', color: '#C9A84C', padding: '1.4rem 3.5rem', borderRadius: '0.8rem', fontSize: '1.5rem', fontWeight: 700, textDecoration: 'none' }}>
              Nous contacter
            </a>
            <a href="/boutique" style={{ background: 'transparent', color: '#fff', padding: '1.4rem 3.5rem', borderRadius: '0.8rem', fontSize: '1.5rem', fontWeight: 700, textDecoration: 'none', border: '2px solid rgba(255,255,255,0.6)' }}>
              Voir la boutique
            </a>
          </div>
        </div>

      </div>
    </section>
  );
};

export default AProposPage;
