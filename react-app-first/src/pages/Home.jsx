import React from 'react';
import Exercise from "../components/Exercise";
import Card from "../components/Card";
import Button from "../components/Button";
import Food from "../components/Food";
import SimpleCaptcha from "../components/Captcha";
import ProgressBAr from "../components/ProgressBar";

function Home() {
  return (
    <main>
      <Exercise /> 
      <Card />
      <div className="button-group">
        <Button name="Yoga" id={1} initialStatus={false} />
        <Button name="Lunch" id={2} initialStatus={true} />
      </div>

      <Food name="Pizza"
            description="Delicious cheesy pizza with various toppings." 
            calories={true} />
      <Food name="Salad"
            description="Fresh and healthy salad." 
            calories={false} />
      
      <p className="text-inapp">Total calories / per day (max = 2000)</p>
      <ProgressBAr percentage={75} />
      
      <SimpleCaptcha onVerify={(isVerified) => console.log("Verified:", isVerified)} />
    </main>
  );
}

export default Home;