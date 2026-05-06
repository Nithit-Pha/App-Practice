import { Link } from 'react-router-dom';
import Exercise from '../components/Exercise';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';

function ExercisePage() {
    return (
        <main className="healthy-page">
            <h1 className="healthy-page-title">Move Your Body</h1>
            <p className="healthy-page-lead">
                A balanced day of activity keeps your heart, mind, and energy in shape.
                Plan your morning, afternoon, and evening sessions below.
            </p>

            <Exercise />

            <div className="button-group">
                <Button name="Yoga" id={1} initialStatus={false} />
                <Button name="Lunch Walk" id={2} initialStatus={true} />
            </div>

            <p className="text-inapp">Daily activity progress</p>
            <ProgressBar percentage={60} />

            <p className="healthy-page-back">
                <Link to="/">&larr; Back to Home</Link> &nbsp;|&nbsp;
                <Link to="/food">Plan your meals &rarr;</Link>
            </p>
        </main>
    );
}

export default ExercisePage;
