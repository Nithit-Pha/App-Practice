
function Food(props) {
    
    return (
        <div className="food">
            <h2>{props.name || "Unknown Food"}</h2>
            <p>{props.description || "No description available."}</p>
            <p>Calories: {props.calories === true ? "over 500" : props.calories === false ? "under 500" : "Unknown"}</p>
        </div>
    );
}




export default Food;