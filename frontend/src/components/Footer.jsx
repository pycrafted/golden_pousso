const Footer = () => {
  return (
    <footer className="footer">
      <div className="row container">
        <div className="col">
          <div className="logo d-flex">
            <img src="/images/logo.svg" alt="logo" />
          </div>
          <p>
            Lorem ispum is a placeholder text <br />
            commonly used as a free text.
          </p>
          <div className="icons d-flex">
            <div className="icon d-flex"><i className="bx bxl-facebook"></i></div>
            <div className="icon d-flex"><i className="bx bxl-twitter"></i></div>
            <div className="icon d-flex"><i className="bx bxl-instagram"></i></div>
            <div className="icon d-flex"><i className="bx bxl-youtube"></i></div>
          </div>
          <p className="color">
            Copyrights 2021 <br />
            @Iamabdulqadeer01
          </p>
        </div>
        <div className="col">
          <div>
            <h4>Product</h4>
            <a href="">Download</a>
            <a href="">Pricing</a>
            <a href="">Locations</a>
            <a href="">Server</a>
            <a href="">Countries</a>
            <a href="">Blog</a>
          </div>
          <div>
            <h4>Category</h4>
            <a href="">Men</a>
            <a href="">Women</a>
            <a href="">Kids</a>
            <a href="">Best Seller</a>
            <a href="">New Arrivals</a>
          </div>
          <div>
            <h4>My Account</h4>
            <a href="">My Account</a>
            <a href="">Discount</a>
            <a href="">Returns</a>
            <a href="">Order History</a>
            <a href="">Order Tracking</a>
          </div>
          <div>
            <h4>Contact Us</h4>
            <div className="d-flex">
              <div className="icon"><i className="bx bxs-map"></i></div>
              <span>123 Street Trafford, London, UK</span>
            </div>
            <div className="d-flex">
              <div className="icon"><i className="bx bxs-envelope"></i></div>
              <span>info@sitename.com</span>
            </div>
            <div className="d-flex">
              <div className="icon"><i className="bx bxs-phone"></i></div>
              <span>+456 789 789 001</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
