import { Link } from 'react-router-dom';
import kaoManKaiImg from '../assets/kao_man_kai.jpg';

const recipes = [
    {
        slug: 'hainanese-chicken-rice',
        name: 'Hainanese Chicken Rice (Kao Man Kai)',
        summary:
            'Tender poached chicken served on fragrant rice cooked in chicken broth, with a tangy ginger-chili dipping sauce.',
        image: kaoManKaiImg,
    },
];

function CookingPage() {
    return (
        <main className="healthy-page">
            <h1 className="healthy-page-title">Cooking</h1>
            <p className="healthy-page-lead">
                Healthy eating starts at home. Pick a recipe below and cook
                something delicious from scratch.
            </p>

            <ul className="recipe-list">
                {recipes.map((r) => (
                    <li key={r.slug} className="recipe-list-item">
                        <Link to={`/cooking/${r.slug}`} className="recipe-list-link">
                            {r.image && (
                                <img
                                    src={r.image}
                                    alt={r.name}
                                    className="recipe-list-thumb"
                                />
                            )}
                            <div className="recipe-list-body">
                                <h2>{r.name}</h2>
                                <p>{r.summary}</p>
                                <span className="hero-card-cta">View recipe &rarr;</span>
                            </div>
                        </Link>
                    </li>
                ))}
            </ul>

            <p className="healthy-page-back">
                <Link to="/">&larr; Back to Home</Link>
            </p>
        </main>
    );
}

export default CookingPage;
