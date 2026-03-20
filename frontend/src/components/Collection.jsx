import { useEffect, useState, useRef } from 'react';
import Swiper from 'swiper/bundle';
import 'swiper/css/bundle';

const FILTERS = ['Jewellery', 'Accessories', 'Dresses', 'Footwear'];

const Collection = ({ products }) => {
  const [activeFilter, setActiveFilter] = useState('Dresses');
  const swiperRef = useRef(null);
  const swiperInstance = useRef(null);

  const filtered = products.filter((p) => p.category === activeFilter);

  useEffect(() => {
    if (swiperRef.current) {
      swiperInstance.current = new Swiper(swiperRef.current, {
        grabCursor: true,
        slidesPerView: 1,
        spaceBetween: 70,
        pagination: {
          el: '.custom-pagination',
          clickable: true,
        },
        breakpoints: {
          567: { slidesPerView: 2 },
          996: { slidesPerView: 3 },
        },
      });
    }
    return () => {
      swiperInstance.current?.destroy(true, true);
    };
  }, []);

  useEffect(() => {
    if (swiperInstance.current) {
      swiperInstance.current.update();
    }
  }, [filtered]);

  return (
    <section className="section collection">
      <div className="title">
        <span>COLLECTION</span>
        <h2>Our Top Collection</h2>
      </div>
      <div className="filters d-flex">
        {FILTERS.map((f) => (
          <div
            key={f}
            data-filter={f}
            className={activeFilter === f ? 'active' : ''}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </div>
        ))}
      </div>

      <div className="products container">
        <div className="swiper mySwiper" ref={swiperRef}>
          <div className="swiper-wrapper" id="products">
            {filtered.map((product) => (
              <div className="swiper-slide" key={product.id}>
                <div className="product">
                  <div className="top d-flex">
                    <img src={product.url} alt="" />
                    <div className="icon d-flex">
                      <i className="bx bxs-heart"></i>
                    </div>
                  </div>
                  <div className="bottom">
                    <h4>{product.title}</h4>
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
              </div>
            ))}
          </div>
        </div>
        <div className="pagination">
          <div className="custom-pagination"></div>
        </div>
      </div>
    </section>
  );
};

export default Collection;
