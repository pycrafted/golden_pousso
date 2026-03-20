import { useState, useEffect } from 'react';
import Hero from '../components/Hero';
import Collection from '../components/Collection';
import NewArrival from '../components/NewArrival';
import Categories from '../components/Categories';
import Statistics from '../components/Statistics';
import Blog from '../components/Blog';

function HomePage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch('/data/products.json')
      .then((res) => res.json())
      .then((data) => setProducts(data.products))
      .catch(console.error);
  }, []);

  return (
    <>
      <header className="header">
        <Hero />
      </header>
      {products.length > 0 && <Collection products={products} />}
      <NewArrival />
      {products.length > 0 && <Categories products={products} />}
      <Statistics />
      <Blog />
    </>
  );
}

export default HomePage;
