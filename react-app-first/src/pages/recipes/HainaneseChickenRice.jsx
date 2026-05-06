import { Link } from 'react-router-dom';
import kaoManKaiImg from '../../assets/kao_man_kai.jpg';

function HainaneseChickenRice() {
    return (
        <main className="healthy-page recipe-page">
            <h1 className="healthy-page-title">
                Hainanese Chicken Rice (Kao Man Kai)
            </h1>
            <p className="healthy-page-lead">
                A classic Thai-style poached chicken served over fragrant rice
                cooked in chicken broth, paired with a tangy ginger-chili
                dipping sauce.
            </p>

            <img
                src={kaoManKaiImg}
                alt="Hainanese Chicken Rice (Kao Man Kai)"
                className="recipe-hero-img"
            />

            <h2 className="recipe-section-title">How to Make Hainanese Chicken Rice</h2>

            <h3 className="recipe-step-title">
                Step 1: Boil the Chicken + Winter Melon Broth
            </h3>
            <ol className="recipe-steps">
                <li>
                    Boil the chicken broth by adding coriander roots, garlic,
                    pepper, ginger, rock sugar, light soy sauce, and salt.
                    Simmer for about 15 minutes.
                </li>
                <li>
                    Add the chicken and continue boiling until cooked, about 30
                    minutes.
                </li>
                <li>
                    Once cooked, immerse the chicken in ice water until cool,
                    about 5–10 minutes. Then remove the chicken and let it
                    drain.
                </li>
                <li>
                    Lightly brush the chicken pieces with vegetable oil and set
                    aside.
                </li>
                <li>
                    Skim the fat from the chicken broth until it's clear. Add
                    the chopped winter melon and simmer. Season with soy sauce
                    and salt.
                </li>
                <li>Boil until the winter melon is cooked.</li>
            </ol>
            <p className="recipe-tip">
                <strong>Tip:</strong> When boiling the chicken, use a relatively
                low heat. Simmering slowly will result in a clear broth and
                beautifully cooked chicken.
            </p>

            <h3 className="recipe-step-title">
                Step 2: Make the Hainanese Chicken Rice
            </h3>
            <ol className="recipe-steps">
                <li>
                    Cook the chicken rice by sautéing garlic and crushed ginger
                    until fragrant. Add the raw rice and stir until well
                    combined. Season with salt and oil.
                </li>
                <li>
                    Stir-fry the drained chicken again and pour into a rice
                    cooker. Add chicken broth and cook until the rice is done.
                </li>
            </ol>

            <h2 className="recipe-section-title">
                How to Make the Dipping Sauce
            </h2>
            <ol className="recipe-steps">
                <li>
                    Combine sliced ginger, chopped chili peppers, soybean paste,
                    sweet dark soy sauce, lime juice, sugar, and boiled water.
                    Stir well.
                </li>
                <li>Serve with Hainanese chicken rice.</li>
            </ol>

            <p className="healthy-page-back">
                <Link to="/cooking">&larr; Back to recipes</Link> &nbsp;|&nbsp;
                <Link to="/">Home</Link>
            </p>
        </main>
    );
}

export default HainaneseChickenRice;
