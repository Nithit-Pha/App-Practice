import PersonalForm from "../components/PersonalForm";


function Contact() {
    return (
        <div className="contact">
            <h2>Contact me</h2>
            <p>Email: nithitpha@gmail.com</p>
            <p>Phone: Dont call me XD </p>

            <p>Or you can fill out the form below to send me a message:</p>
            <PersonalForm />

        </div>
    );
}

export default Contact;