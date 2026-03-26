import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import {
    deleteUserThunk,
    fetchUsers,
    toggleAdminThunk,
} from '../../store/slices/usersSlice';

export default function AdminPage() {
    const dispatch = useDispatch();
    const { items, isLoading } = useSelector((state) => state.users);
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        if (user?.is_admin) {
            dispatch(fetchUsers());
        }
    }, [dispatch, user]);

    if (!user?.is_admin) {
        return null;
    }

    return (
        <section className="page">
            <h1 className="page__title">Админка</h1>

            <div className="card">
                {isLoading ? (
                    <p>Загрузка...</p>
                ) : (
                    <div className="table-wrapper">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Username</th>
                                    <th>Email</th>
                                    <th>Имя</th>
                                    <th>Админ</th>
                                    <th>Файлы</th>
                                    <th>Размер</th>
                                    <th>Хранилище</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((u) => (
                                    <tr key={u.id}>
                                        <td>{u.username}</td>
                                        <td>{u.email}</td>
                                        <td>{u.full_name}</td>
                                        <td>{u.is_admin ? 'Да' : 'Нет'}</td>
                                        <td>{u.files_count}</td>
                                        <td>{u.total_size} байт</td>
                                        <td>
                                            <Link to={`/files?user_id=${u.id}`}>
                                                Открыть файлы
                                            </Link>
                                        </td>
                                        <td>
                                            <div className="form__actions">
                                                <button
                                                    className="button button--secondary"
                                                    type="button"
                                                    onClick={() =>
                                                        dispatch(
                                                            toggleAdminThunk({
                                                                userId: u.id,
                                                                is_admin: !u.is_admin,
                                                            }),
                                                        )
                                                    }
                                                >
                                                    {u.is_admin
                                                        ? 'Снять админа'
                                                        : 'Сделать админом'}
                                                </button>

                                                <button
                                                    className="button button--danger"
                                                    type="button"
                                                    onClick={() =>
                                                        dispatch(deleteUserThunk(u.id))
                                                    }
                                                >
                                                    Удалить
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </section>
    );
}