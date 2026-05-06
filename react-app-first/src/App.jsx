import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from "./components/Header";  
import Footer from "./components/Footer";
import Home from "./pages/Home";  
import About from "./pages/About"; 
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

function App() {
  return (
    <Router>
      <Header /> 
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="*" element={<h2>Page Not Found</h2>} />
      </Routes>
      
      <Footer />
    </Router>
  );
}

export default App;