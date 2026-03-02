
function Food(props) {
    const foodName = props.name || "Unknown Food";
    const foodDescription = props.description || "No description available.";
    const foodCategory = props.calories === true ? "High-Calorie" : props.calories === false ? "Low-Calorie" : "Unknown Category";

    
    return (
            <div className="food">
                <h2>{foodName}</h2>
                <p>{foodDescription}</p>
                <p>Calories: {foodCategory}</p>
            </div>
    );
}




export default Food;