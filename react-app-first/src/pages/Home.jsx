import { Link } from 'react-router-dom';

function Home() {
  return (
    <main className="home-hero">
      <section className="hero-banner">
        <h1 className="hero-title">Want to be healthy?</h1>
        <p className="hero-subtitle">
          Small daily choices build a stronger you. Move your body, eat well,
          and feel the difference — one habit at a time.
        </p>
      </section>

      <section className="hero-cards">
        <Link to="/exercise" className="hero-card hero-card-exercise">
          <h2>Exercise</h2>
          <p>Plan your daily workouts — yoga, running, swimming and more.</p>
          <span className="hero-card-cta">Start moving &rarr;</span>
        </Link>

        <Link to="/food" className="hero-card hero-card-food">
          <h2>Food</h2>
          <p>Choose balanced meals and track your daily calories.</p>
          <span className="hero-card-cta">Eat better &rarr;</span>
        </Link>

        <Link to="/cooking" className="hero-card hero-card-cooking">
          <h2>Cooking</h2>
          <p>Cook healthy meals at home with simple, step-by-step recipes.</p>
          <span className="hero-card-cta">Browse recipes &rarr;</span>
        </Link>
      </section>
    </main>
  );
}

export default Home;
