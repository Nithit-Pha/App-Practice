import Header from "./Header";  
import Footer from "./Footer";
import Exercise from "./Exercise";
import Card from "./Card";
import Button from "./Button";
import Food from "./Food";
import SimpleCaptcha from "./Captcha";
import ProgressBAr from "./ProgressBar";

function App() {
  return (
    <div>
      <Header />
      <Exercise /> 
      <Card />
      <Button name="Yoga" id={1} initialStatus={false} />
      <Button name="Lunch" id={2} initialStatus={true} />

      <Food name="Pizza"
            description="Delicious cheesy pizza with various toppings. T T" 
            calories={true} />
      <Food name="Salad"
            description="Fresh and healthy salad with a variety of vegetables." 
            calories={false} />
      <Food name="Smoothie"/>

      <p1 className = "text-inapp">Total calories / per day(max = 2000)</p1>
      <ProgressBAr percentage={75} />
      
      <SimpleCaptcha onVerify={(isVerified) => console.log("Captcha Verified:", isVerified)} />
      <Footer />
    </div>
  );
}

export default App
