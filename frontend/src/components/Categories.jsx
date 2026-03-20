import { useState } from 'react';

const MAX_RESULT = 8;

const Categories = ({ products }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayed, setDisplayed] = useState(products.slice(0, MAX_RESULT));
  const [noMore, setNoMore] = useState(products.length <= MAX_RESULT);

  const loadMore = () => {
    const next = currentIndex + MAX_RESULT;
    if (next >= products.length) {
      setNoMore(true);
      return;
    }
    setDisplayed((prev) => [...prev, ...products.slice(next, next + MAX_RESULT)]);
    setCurrentIndex(next);
    if (next + MAX_RESULT >= products.length) {
      setNoMore(true);
    }
  };

  return (
    <section className="section categories">
      <div className="title">
        <span>CATEGORIES</span>
        <h2>2021 Latest Collection</h2>
      </div>

      <div className="products container">
        {displayed.map((product) => (
          <div className="product" key={product.id}>
            <div className="top d-flex">
              <img src={product.url} alt="" />
              <div className="icon d-flex">
                <i className="bx bxs-heart"></i>
              </div>
            </div>
            <div className="bottom">
              <div className="d-flex">
                <h4>{product.title}</h4>
                <a href="" className="btn cart-btn">Add to Cart</a>
              </div>
              <div className="d-flex">
                <div className="price">${product.price}</div>
                <div className="rating">
                  <i className="bx bxs-star"></i>
                  <i className="bx bxs-star"></i>
                  <i className="bx bxs-star"></i>
                  <i className="bx bxs-star"></i>
                  <i className="bx bxs-star"></i>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="button d-flex">
        <a
          className="btn loadmore"
          onClick={noMore ? undefined : loadMore}
          style={{ cursor: noMore ? 'default' : 'pointer' }}
        >
          {noMore ? 'No More Products' : 'Load More'}
        </a>
      </div>
    </section>
  );
};

export default Categories;
