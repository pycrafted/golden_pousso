import { useState } from 'react';

const Navbar = ({ onUserIconClick }) => {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="row container d-flex">
        <div className="logo">
          <img src="/images/logo.svg" alt="" />
        </div>

        <div className={`nav-list d-flex${navOpen ? ' show' : ''}`}>
          <a href="">Home</a>
          <a href="">Shop</a>
          <a href="">Pages</a>
          <a href="">About Us</a>
          <a href="">Lookups</a>
          <div className="close" onClick={() => setNavOpen(false)}>
            <i className="bx bx-x"></i>
          </div>
          <a className="user-link" onClick={onUserIconClick}>Login</a>
        </div>

        <div className="icons d-flex">
          <div className="icon d-flex"><i className="bx bx-search"></i></div>
          <div className="icon user-icon d-flex" onClick={onUserIconClick}>
            <i className="bx bx-user"></i>
          </div>
          <div className="icon d-flex">
            <i className="bx bx-bell"></i>
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
