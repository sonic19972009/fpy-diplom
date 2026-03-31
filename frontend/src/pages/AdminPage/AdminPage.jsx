import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import {
    deleteUserThunk,
    fetchUsers,
    toggleAdminThunk,
} from '../../store/slices/usersSlice';

function formatStorageSize(size) {
    if (size === 0) {
        return '0 байт';
    }

    if (size < 1024) {
        return `${size} байт`;
    }

    if (size < 1024 * 1024) {
        return `${(size / 1024).toFixed(1)} КБ`;
    }

    return `${(size / (1024 * 1024)).toFixed(1)} МБ`;
}

export default function AdminPage() {
    const dispatch = useDispatch();
    const { items, isLoading, error } = useSelector((state) => state.users);

    useEffect(() => {
        dispatch(fetchUsers());
    }, [dispatch]);

    return (
        <section className="page">
            <h1 className="page__title">Админка</h1>

            {error && (
                <div className="message message--error">
                    {error.error || 'Ошибка загрузки пользователей.'}
                </div>
            )}

            {isLoading ? (
                <p>Загрузка...</p>
            ) : items.length === 0 ? (
                <div className="card">
                    <p className="page__subtitle" style={{ marginBottom: 0 }}>
                        Пользователи отсутствуют.
                    </p>
                </div>
            ) : (
                <div className="users-grid">
                    {items.map((user) => (
                        <div key={user.id} className="user-tile">
                            <div className="user-tile__top">
                                <div className="user-tile__main">
                                    <div className="user-tile__name">{user.username}</div>
                                    <div className="user-tile__email">{user.email}</div>
                                </div>
                            </div>

                            <div className="user-tile__info">
                                <div>
                                    <strong>Имя:</strong> {user.full_name || '—'}
                                </div>
                                <div>
                                    <strong>Файлы:</strong> {user.files_count}
                                </div>
                                <div>
                                    <strong>Размер:</strong> {formatStorageSize(user.total_size)}
                                </div>
                                <div>
                                    <strong>Роль:</strong>{' '}
                                    {user.is_admin ? 'Администратор' : 'Пользователь'}
                                </div>
                            </div>

                            <div className="user-tile__actions">
                                <Link
                                    to={`/files?user_id=${user.id}`}
                                    className="button button--secondary user-tile__link-button"
                                >
                                    Открыть файлы
                                </Link>

                                <button
                                    className="button button--secondary"
                                    type="button"
                                    onClick={() =>
                                        dispatch(
                                            toggleAdminThunk({
                                                userId: user.id,
                                                is_admin: !user.is_admin,
                                            }),
                                        )
                                    }
                                >
                                    {user.is_admin ? 'Снять админа' : 'Сделать админом'}
                                </button>

                                <button
                                    className="button button--danger"
                                    type="button"
                                    onClick={() => dispatch(deleteUserThunk(user.id))}
                                >
                                    Удалить
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}