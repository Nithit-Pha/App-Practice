import { useState, useRef, useEffect } from "react";

// FAQ database: each entry has keywords (any match triggers it) and an answer.
// Keywords are matched case-insensitively against the user's message.
const FAQ = [
  {
    keywords: ["exercise", "workout", "work out", "gym", "fitness", "training"],
    answer:
      "For exercise, try 30 minutes of moderate activity daily. Mix cardio (running, swimming, cycling) with strength training 2-3 times a week. Check our Exercise page for daily workout ideas!",
  },
  {
    keywords: ["yoga", "stretch", "stretching", "flexibility"],
    answer:
      "Yoga is great for flexibility and stress relief! Start with 15-20 minutes of basic poses like downward dog, child's pose, and sun salutations. Practice 3-4 times a week.",
  },
  {
    keywords: ["run", "running", "jog", "jogging", "cardio"],
    answer:
      "Running tip: Start slow with a walk-jog mix for 20 minutes. Gradually increase. Wear good shoes, stay hydrated, and warm up first. Aim for 3 runs per week.",
  },
  {
    keywords: ["food", "eat", "eating", "diet", "nutrition", "meal"],
    answer:
      "For a healthy diet, eat plenty of vegetables, fruits, lean protein, and whole grains. Drink water, limit sugar and processed food. Visit our Food page for meal ideas!",
  },
  {
    keywords: ["cook", "cooking", "recipe", "make food", "prepare"],
    answer:
      "Cooking at home is healthier and cheaper! Start with simple recipes — check our Cooking page for step-by-step guides like Hainanese Chicken Rice.",
  },
  {
    keywords: ["calorie", "calories", "weight loss", "lose weight"],
    answer:
      "To lose weight, create a small calorie deficit (about 300-500 fewer calories than you burn). Combine balanced eating with regular exercise. Be patient — slow progress lasts!",
  },
  {
    keywords: ["water", "hydrate", "hydration", "drink"],
    answer:
      "Aim for about 8 glasses (2 liters) of water a day. Drink more if you exercise or it's hot. Water helps energy, digestion, and skin health.",
  },
  {
    keywords: ["sleep", "rest", "tired", "insomnia"],
    answer:
      "Adults need 7-9 hours of sleep. Keep a regular bedtime, avoid screens before bed, and keep your room cool and dark. Good sleep boosts recovery and mood.",
  },
  {
    keywords: ["protein", "muscle", "muscles", "build muscle"],
    answer:
      "For muscle building, eat enough protein (about 1.6-2g per kg of body weight). Good sources: chicken, fish, eggs, beans, tofu, and Greek yogurt. Combine with strength training.",
  },
  {
    keywords: ["vegetable", "vegetables", "veggies", "fruit", "fruits"],
    answer:
      "Aim for 5 servings of fruits and vegetables daily. Pick a variety of colors for different nutrients. Fresh, frozen, or steamed all count!",
  },
  {
    keywords: ["hello", "hi", "hey", "good morning", "good evening"],
    answer:
      "Hello! I'm your health assistant. Ask me about exercise, food, cooking, or healthy habits. Try: 'how to exercise' or 'how to eat healthy'.",
  },
  {
    keywords: ["help", "what can you do", "options"],
    answer:
      "I can answer questions about: exercise, running, yoga, healthy food, cooking, weight loss, sleep, hydration, and more. Just type a keyword!",
  },
  {
    keywords: ["thanks", "thank you", "thx"],
    answer: "You're welcome! Stay healthy and keep moving!",
  },
  {
    keywords: ["bye", "goodbye", "see you"],
    answer: "Goodbye! Remember: small daily choices build a stronger you.",
  },
];

const DEFAULT_REPLY =
  "Sorry, I didn't catch that. Try keywords like 'exercise', 'food', 'cooking', 'sleep', or 'weight loss'. Type 'help' to see what I can do.";

const SUGGESTIONS = [
  "how to exercise",
  "how to make food",
  "weight loss tips",
  "help",
];

function findAnswer(text) {
  const lower = text.toLowerCase();
  for (const item of FAQ) {
    for (const kw of item.keywords) {
      if (lower.includes(kw)) {
        return item.answer;
      }
    }
  }
  return DEFAULT_REPLY;
}

function Chatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text: "Hi! I'm your health assistant. Ask me about exercise, food, cooking, or healthy habits!",
    },
  ]);
  const bodyRef = useRef(null);

  // Auto-scroll to the bottom on new messages
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, open]);

  function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg = { from: "user", text: trimmed };
    const botMsg = { from: "bot", text: findAnswer(trimmed) };
    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendMessage(input);
  }

  return (
    <div className="chatbot-wrapper">
      {open && (
        <div className="chatbot-window" role="dialog" aria-label="Chatbot">
          <div className="chatbot-header">
            <span>Health FAQ Bot</span>
            <button
              className="chatbot-close"
              onClick={() => setOpen(false)}
              aria-label="Close chatbot"
            >
              ×
            </button>
          </div>

          <div className="chatbot-body" ref={bodyRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chatbot-msg chatbot-msg-${m.from}`}>
                {m.text}
              </div>
            ))}
          </div>

          <div className="chatbot-suggestions">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                className="chatbot-suggestion"
                onClick={() => sendMessage(s)}
              >
                {s}
              </button>
            ))}
          </div>

          <form className="chatbot-form" onSubmit={handleSubmit}>
            <input
              type="text"
              className="chatbot-input"
              placeholder="Ask something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              aria-label="Type your message"
            />
            <button type="submit" className="chatbot-send">
              Send
            </button>
          </form>
        </div>
      )}

      <button
        className="chatbot-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? "×" : "💬"}
      </button>
    </div>
  );
}

export default Chatbot;
