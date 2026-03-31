import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { fetchCurrentUser } from '../../store/slices/authSlice';
import {
    deleteUserThunk,
    fetchUsers,
    toggleAdminThunk,
} from '../../store/slices/usersSlice';

import useDocumentTitle from '../../hooks/useDocumentTitle';

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
    useDocumentTitle('My Cloud — Админка');

    const dispatch = useDispatch();
    const { items, isLoading, error } = useSelector((state) => state.users);
    const { user } = useSelector((state) => state.auth);

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
                    {items.map((userItem) => (
                        <div key={userItem.id} className="user-tile">
                            <div className="user-tile__top">
                                <div className="user-tile__main">
                                    <div className="user-tile__name">{userItem.username}</div>
                                    <div className="user-tile__email">{userItem.email}</div>
                                </div>
                            </div>

                            <div className="user-tile__info">
                                <div>
                                    <strong>Имя:</strong> {userItem.full_name || '—'}
                                </div>
                                <div>
                                    <strong>Файлы:</strong> {userItem.files_count}
                                </div>
                                <div>
                                    <strong>Размер:</strong> {formatStorageSize(userItem.total_size)}
                                </div>
                                <div>
                                    <strong>Роль:</strong>{' '}
                                    {userItem.is_admin ? 'Администратор' : 'Пользователь'}
                                </div>
                            </div>

                            <div className="user-tile__actions">
                                <Link
                                    to={`/files?user_id=${userItem.id}`}
                                    className="button button--secondary user-tile__link-button"
                                >
                                    Открыть файлы
                                </Link>

                                <button
                                    className="button button--secondary"
                                    type="button"
                                    onClick={async () => {
                                        const result = await dispatch(
                                            toggleAdminThunk({
                                                userId: userItem.id,
                                                is_admin: !userItem.is_admin,
                                            }),
                                        );

                                        if (toggleAdminThunk.fulfilled.match(result)) {
                                            if (result.payload.id === user?.id) {
                                                dispatch(fetchCurrentUser());
                                            }
                                        }
                                    }}
                                >
                                    {userItem.is_admin ? 'Снять админа' : 'Сделать админом'}
                                </button>

                                <button
                                    className="button button--danger"
                                    type="button"
                                    onClick={() => dispatch(deleteUserThunk(userItem.id))}
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