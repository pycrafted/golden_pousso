import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = ({ onUserIconClick }) => {
  const [navOpen, setNavOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="row container d-flex">
        <div className="logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src="/images/logo.svg" alt="Golden Pousso" />
        </div>

        <div className={`nav-list d-flex${navOpen ? ' show' : ''}`}>
          <Link to="/" onClick={() => setNavOpen(false)}>Accueil</Link>
          <Link to="/boutique" onClick={() => setNavOpen(false)}>Boutique</Link>
          <Link to="/collections" onClick={() => setNavOpen(false)}>Collections</Link>
          <Link to="/a-propos" onClick={() => setNavOpen(false)}>À Propos</Link>
          <Link to="/contact" onClick={() => setNavOpen(false)}>Contact</Link>
          <div className="close" onClick={() => setNavOpen(false)}>
            <i className="bx bx-x"></i>
          </div>
          <a className="user-link" onClick={onUserIconClick}>Connexion</a>
        </div>

        <div className="icons d-flex">
          <div className="icon d-flex" onClick={() => navigate('/boutique')} style={{ cursor: 'pointer' }}>
            <i className="bx bx-search"></i>
          </div>
          <div className="icon user-icon d-flex" onClick={onUserIconClick}>
            <i className="bx bx-user"></i>
          </div>
          <div className="icon d-flex" onClick={() => navigate('/panier')} style={{ cursor: 'pointer' }}>
            <i className="bx bx-cart"></i>
            <span></span>
          </div>
        </div>

        <div className="hamburger" onClick={() => setNavOpen(true)}>
          <i className="bx bx-menu-alt-right"></i>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
