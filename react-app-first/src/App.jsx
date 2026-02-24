import Header from "./Header";  
import Footer from "./Footer";
import Exercise from "./Exercise";
import Card from "./Card";
import Button from "./Button";
import Food from "./Food";

function App() {
  return (
    <div>
      <Header />
      <Exercise /> 
      <Card />
      <Button />
      <Food name="Pizza"
            description="Delicious cheesy pizza with various toppings. T T" 
            calories={true} />
       <Food name="Salad"
            description="Fresh and healthy salad with a variety of vegetables." 
            calories={false} />
        <Food name="Smoothie"
             
            calories={false} />
      <Footer />
    </div>
  );
}

export default App
