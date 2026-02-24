import React, { useState } from 'react';

// We "destructure" { name } from the props object
function Button({ name }) {
    const [isHovered, setIsHovered] = useState(false);
    const [isChecked, setIsChecked] = useState(false);

    const styles = {
        backgroundColor: isChecked 
            ? "#2ecc71" // Green when checked
            : (isHovered ? "hsl(0, 100%, 66%)" : "hsl(0, 0%, 55%)"),
        color: "white",
        border: "none",
        padding: "10px 20px",
        borderRadius: "5px",
        cursor: "pointer",
        transition: "all 0.3s ease",
        margin: "5px",
        minWidth: "150px"
    };

    const handleClick = () => {
        setIsChecked(!isChecked); // This lets you toggle it on and off!
        if (!isChecked) {
            alert(`Good job! You did ${name}! 🌟`);
        }
    };

    return (
        <button 
            style={styles} 
            onClick={handleClick} 
            onMouseEnter={() => setIsHovered(true)} 
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Using the {name} prop here */}
            {isChecked ? `${name} Done ✓` : `${name} Check`}
        </button>
    );
}

export default Button;