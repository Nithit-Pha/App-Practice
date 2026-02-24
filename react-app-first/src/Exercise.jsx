function Exercise() {

    const morning = "Yoga";
    const afternoon = "Running";
    const evening = "Swimming";


    return (
        <div className ="exercise">
            <h1>Exercise Component</h1>
            <p>Morning: {morning}</p>
            <p>Afternoon: {afternoon}</p>
            <p>Evening: {evening}</p>
        </div>
     );

}

export default Exercise;