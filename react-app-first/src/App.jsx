import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from "./components/Header";
import Footer from "./components/Footer";
import Chatbot from "./components/Chatbot";
import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ExercisePage from "./pages/ExercisePage";
import FoodPage from "./pages/FoodPage";
import CookingPage from "./pages/CookingPage";
import HainaneseChickenRice from "./pages/recipes/HainaneseChickenRice";
import AdminUsers from "./pages/AdminUsers";
import RequireRole from "./auth/RequireRole";

function App() {
  return (
    <Router>
      <Header /> 
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/exercise" element={<ExercisePage />} />
        <Route path="/food" element={<FoodPage />} />
        <Route path="/cooking" element={<CookingPage />} />
        <Route path="/cooking/hainanese-chicken-rice" element={<HainaneseChickenRice />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/admin/users"
          element={
            <RequireRole role="admin">
              <AdminUsers />
            </RequireRole>
          }
        />
        <Route path="*" element={<h2>Page Not Found</h2>} />
      </Routes>
      
      <Footer />
      <Chatbot />
    </Router>
  );
}

export default App;