import { Link } from 'react-router-dom';

export default function ForbiddenPage() {
    return (
        <section style={{ textAlign: 'center', marginTop: '60px' }}>
            <h1>403</h1>
            <h2>Доступ запрещён</h2>
            <p>У вас недостаточно прав для просмотра этой страницы.</p>

            <div style={{ marginTop: '20px' }}>
                <Link to="/">Вернуться на главную</Link>
            </div>
        </section>
    );
}