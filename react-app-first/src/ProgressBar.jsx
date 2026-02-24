
const ProgressBar = ({ percentage }) => {
  const containerStyle = {
    height: "20px",
    width: "100%",
    backgroundColor: "#e0e0de",
    borderRadius: "50px",
    margin: "20px 0",
    overflow: "hidden"
  };

  const fillerStyle = {
    height: "100%",
    width: `${percentage}%`, // Dynamic width based on math
    backgroundColor: percentage === 100 ? "#2ecc71" : "#3498db",
    transition: "width 0.5s ease-in-out", // Smooth "filling" animation
    textAlign: "right",
    borderRadius: "inherit"
  };

  const labelStyle = {
    padding: "5px",
    color: "white",
    fontWeight: "bold",
    fontSize: "12px"
  };

  return (
    <div style={containerStyle}>
      <div style={fillerStyle}>
        <span style={labelStyle}>{percentage}%</span>
      </div>
    </div>
  );
};

export default ProgressBar;