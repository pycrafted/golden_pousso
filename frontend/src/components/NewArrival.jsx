const NewArrival = () => {
  return (
    <section className="section new-arrival">
      <div className="title">
        <span>NEW ARRIVAL</span>
        <h2>Latest Collection</h2>
      </div>

      <div className="row container">
        <div className="col col-1">
          <img src="/images/poster-1.png" alt="" />
          <h3>
            2021 Trends <br />
            Women's Smart Skirt
          </h3>
        </div>
        <div className="col col-2">
          <img src="/images/poster-2.png" alt="" />
          <h3>
            2021 Trends <br />
            Women's Smart Skirt
          </h3>
        </div>
        <div className="col col-3">
          <img src="/images/poster-3.png" alt="" />
          <h3>
            2021 Trends <br />
            Women's Smart Shirt <br />
            <span>Discover More:</span>
          </h3>
        </div>
      </div>
    </section>
  );
};

export default NewArrival;
