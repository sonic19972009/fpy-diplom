import { useEffect } from 'react';
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
        dispatch(fetchUsers());
    }, [dispatch]);

    if (!user?.is_admin) {
        return <p>Доступ запрещён</p>;
    }

    return (
        <section>
            <h1>Админка</h1>

            {isLoading ? (
                <p>Загрузка...</p>
            ) : (
                <table border="1" cellPadding="8">
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Имя</th>
                            <th>Админ</th>
                            <th>Файлы</th>
                            <th>Размер</th>
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
                                <td>{u.total_size}</td>

                                <td>
                                    <button
                                        onClick={() =>
                                            dispatch(
                                                toggleAdminThunk({
                                                    userId: u.id,
                                                    is_admin: !u.is_admin,
                                                }),
                                            )
                                        }
                                    >
                                        {u.is_admin ? 'Снять админа' : 'Сделать админом'}
                                    </button>

                                    <button
                                        onClick={() => dispatch(deleteUserThunk(u.id))}
                                        style={{ marginLeft: '8px' }}
                                    >
                                        Удалить
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </section>
    );
}