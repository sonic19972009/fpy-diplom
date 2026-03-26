import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { logoutThunk } from '../../store/slices/authSlice';
import './NavBar.css';

export default function NavBar() {
    const dispatch = useDispatch();
    const { isAuthenticated, user, isLoading } = useSelector((state) => state.auth);

    const handleLogout = () => {
        dispatch(logoutThunk());
    };

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
                            <span className="navbar__user">{user?.username}</span>
                            <button
                                className="navbar__button"
                                type="button"
                                onClick={handleLogout}
                                disabled={isLoading}
                            >
                                Выход
                            </button>
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