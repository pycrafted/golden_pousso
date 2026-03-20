import { useParams } from 'react-router-dom';

// TASK-07 — Page Fiche Produit
function ProduitPage() {
  const { slug } = useParams();

  return (
    <section className="categories section container">
      <h2 className="section-title">Fiche Produit</h2>
      <p style={{ textAlign: 'center', color: 'var(--default-color)', marginTop: '2rem' }}>
        Produit : <strong>{slug}</strong> — sera implémenté dans TASK-07.
      </p>
    </section>
  );
}

export default ProduitPage;
