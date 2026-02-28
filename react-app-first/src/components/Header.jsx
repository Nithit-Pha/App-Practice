import { Link } from 'react-router-dom';

function Header() {
    return (
        <header className="header">
            <h1 className="header-title">My first React App</h1>
            <nav>
                <ul>
                    {/* Use Link instead of a tags */}
                    <li><Link to="/">Home</Link></li>
                    <li><Link to="/about">About</Link></li>
                    <li><Link to="/services">Services</Link></li>
                    <li><Link to="/contact">Contact</Link></li>
                </ul>
            </nav>
            <hr />
        </header>
    );
}

export default Header;