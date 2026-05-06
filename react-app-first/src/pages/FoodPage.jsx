import { Link } from 'react-router-dom';
import Food from '../components/Food';
import ProgressBar from '../components/ProgressBar';

function FoodPage() {
    return (
        <main className="healthy-page">
            <h1 className="healthy-page-title">Eat Well</h1>
            <p className="healthy-page-lead">
                Fuel your body with the right balance of nutrients. Mix high-energy
                foods with lighter, low-calorie options throughout the day.
            </p>

            <div className="food-list">
                <Food
                    name="Pizza"
                    description="Delicious cheesy pizza with various toppings."
                    calories={true}
                />
                <Food
                    name="Salad"
                    description="Fresh and healthy salad."
                    calories={false}
                />
                <Food
                    name="Grilled Chicken"
                    description="Lean protein grilled with herbs and lemon."
                    calories={false}
                />
                <Food
                    name="Smoothie Bowl"
                    description="Frozen fruit blended with yogurt and granola."
                    calories={true}
                />
            </div>

            <p className="text-inapp">Total calories / per day (max = 2000)</p>
            <ProgressBar percentage={75} />

            <p className="healthy-page-back">
                <Link to="/">&larr; Back to Home</Link> &nbsp;|&nbsp;
                <Link to="/exercise">Start exercising &rarr;</Link>
            </p>
        </main>
    );
}

export default FoodPage;
