import { Link } from 'react-router-dom';

export default function ForbiddenPage() {
    return (
        <section className="centered-page">
            <h1>403</h1>
            <h2>Доступ запрещён</h2>
            <p>У вас недостаточно прав для просмотра этой страницы.</p>

            <div className="form__actions" style={{ justifyContent: 'center', marginTop: '20px' }}>
                <Link className="button" to="/files">
                    Вернуться к моим файлам
                </Link>
            </div>
        </section>
    );
}