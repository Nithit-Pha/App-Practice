import React, { useState } from 'react';

/**
 * @param {string} name - The activity name (e.g., "Yoga", "Lunch")
 * @param {number} id - The unique ID from your database
 * @param {boolean} initialStatus - Whether it's already checked
 */
function Button({ name, id, initialStatus = false }) {
    // 1. UI States
    const [isHovered, setIsHovered] = useState(false);
    const [isChecked, setIsChecked] = useState(initialStatus);

    // 2. Styling Logic
    const styles = {
        backgroundColor: isChecked 
            ? "#2ecc71" // Green when checked
            : (isHovered ? "hsl(0, 100%, 66%)" : "hsl(0, 0%, 55%)"), // Red on hover, Gray otherwise
        color: "white",
        border: "none",
        padding: "10px 20px",
        borderRadius: "5px",
        cursor: "pointer",
        transition: "all 0.3s ease",
        margin: "10px",
        minWidth: "160px",
        fontSize: "16px",
        fontWeight: "bold",
        boxShadow: isHovered ? "0px 4px 8px rgba(0,0,0,0.2)" : "none"
    };

    // 3. Click Handler with API integration
    const handleClick = async () => {
        const newStatus = !isChecked;
        
        // Optimistic UI update (change it immediately for speed)
        setIsChecked(newStatus);

        try {
            // Send update to your Node.js REST API
            const response = await fetch(`http://localhost:5000/api/activities/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ completed: newStatus })
            });

            if (!response.ok) {
                throw new Error("Failed to save");
            }

            console.log(`${name} updated successfully!`);
        } catch (error) {
            // If the server fails, revert the check and alert the user
            setIsChecked(!newStatus);
            alert("Could not connect to server. Progress not saved.");
        }
    };

    return (
        <button 
            style={styles} 
            onClick={handleClick} 
            onMouseEnter={() => setIsHovered(true)} 
            onMouseLeave={() => setIsHovered(false)}
        >
            {isChecked ? `${name} Done ✓` : `${name} Check`}
        </button>
    );
}

export default Button;