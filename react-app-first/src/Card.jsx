import Yoga from './assets/yoga.png';

function Card() {
    return (
        <div className="card">
            <img className="card-img" src={Yoga} alt="Yoga" />
            <h2 className="card-title">Yoga</h2>
            <p className="card-description"> at Morning</p>
        </div>
    )
}

export default Card;