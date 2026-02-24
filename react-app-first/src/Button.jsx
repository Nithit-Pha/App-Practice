
function Button() {

    const styles = {
        backgroundColor: "hsl(0, 0%, 55%)",
        color: "white",
        border: "none",
        padding: "10px 20px",
        borderRadius: "5px",
        cursor: "pointer",
    }

    return (
        <button style={styles}>Check</button>
    )
}

export default Button;