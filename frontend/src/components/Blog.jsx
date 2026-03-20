const Blog = () => {
  const posts = [
    { img: '/images/blog-1.png', date: '10 January 2021' },
    { img: '/images/blog-2.png', date: '10 January 2021' },
    { img: '/images/blog-3.png', date: '10 January 2021' },
  ];

  return (
    <section className="section blog">
      <div className="title">
        <span>BLOGS</span>
        <h2>Latest News</h2>
      </div>

      <div className="row container">
        {posts.map((post, i) => (
          <div className="col" key={i}>
            <div className="top">
              <img src={post.img} alt="" />
            </div>
            <div className="bottom">
              <h3>Trendy</h3>
              <h4>Lorem Ispum is a placeholder text commomly used as a free text.</h4>
              <span>{post.date}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Blog;
