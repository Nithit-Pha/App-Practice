import React, { useState } from 'react';

function ContactForm() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: ''
    });

    // We add a new state to handle the "Sending..." status
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setIsSubmitting(true); // Disable the button while sending
        console.log("Everything Vite sees:", import.meta.env);
        // 1. Prepare the data to send. We combine our form data with the Access Key.
        const dataToSend = {
            ...formData,
            access_key: import.meta.env.VITE_WEB3FORMS_KEY
        };

        console.log("My Data:", dataToSend);

        try {
            // 2. Send the request to Web3Forms
            const response = await fetch("https://api.web3forms.com/submit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(dataToSend)
            });

            // 3. Check the result
            const result = await response.json();
            
            if (result.success) {
                alert("Success! Your message has been sent to my email.");
                // Clear the form
                setFormData({ name: '', email: '', message: '' });
            } else {
                alert("Something went wrong. Please try again.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Network error. Please check your connection.");
        } finally {
            setIsSubmitting(false); // Re-enable the button
        }
    };

    return (
        <div className="contact-container" style={{ maxWidth: '400px', margin: '0 auto' }}>
            <h2>Contact Me</h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                    <label htmlFor="name" style={{ display: 'block', marginBottom: '5px' }}>Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>

                <div>
                    <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>

                <div>
                    <label htmlFor="message" style={{ display: 'block', marginBottom: '5px' }}>Message</label>
                    <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows="5"
                        style={{ width: '100%', padding: '8px', resize: 'vertical' }}
                    />
                </div>

                {/* The button changes text and disables itself while sending */}
                <button 
                    type="submit" 
                    disabled={isSubmitting}
                    style={{ 
                        padding: '10px', 
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting ? 0.7 : 1
                    }}
                >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
            </form>
        </div>
    );
}

export default ContactForm;