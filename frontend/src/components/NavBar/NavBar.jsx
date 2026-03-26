import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

import './NavBar.css';

export default function NavBar() {
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    return (
        <header className="navbar">
            <div className="navbar__container">
                <Link to="/" className="navbar__logo">
                    My Cloud
                </Link>

                <nav className="navbar__nav">
                    <Link to="/">Главная</Link>

                    {isAuthenticated ? (
                        <>
                            <Link to="/files">Мои файлы</Link>
                            {user?.is_admin && <Link to="/admin">Админка</Link>}
                            <span>{user?.username}</span>
                            <button>Выход</button>
                        </>
                    ) : (
                        <>
                            <Link to="/login">Вход</Link>
                            <Link to="/register">Регистрация</Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}