import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function NotFoundPage() {
    const { isAuthenticated } = useSelector((state) => state.auth);

    return (
        <section className="centered-page">
            <h1>404</h1>
            <h2>Страница не найдена</h2>
            <p>Такой страницы не существует или она была удалена.</p>

            <div className="form__actions" style={{ justifyContent: 'center', marginTop: '20px' }}>
                <Link className="button" to={isAuthenticated ? '/files' : '/'}>
                    {isAuthenticated ? 'Вернуться к моим файлам' : 'На главную'}
                </Link>
            </div>
        </section>
    );
}