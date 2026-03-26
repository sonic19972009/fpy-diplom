import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

import { clearAuthError, registerThunk } from '../../store/slices/authSlice';

export default function RegisterPage() {
    const dispatch = useDispatch();
    const { isAuthenticated, isLoading, error } = useSelector((state) => state.auth);

    const [form, setForm] = useState({
        username: '',
        full_name: '',
        email: '',
        password: '',
    });

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (error) {
            dispatch(clearAuthError());
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        dispatch(registerThunk(form));
    };

    if (isAuthenticated) {
        return <Navigate to="/files" replace />;
    }

    return (
        <section>
            <h1>Регистрация</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="username">Логин</label>
                    <br />
                    <input
                        id="username"
                        name="username"
                        type="text"
                        value={form.username}
                        onChange={handleChange}
                    />
                </div>

                <div style={{ marginTop: '12px' }}>
                    <label htmlFor="full_name">Полное имя</label>
                    <br />
                    <input
                        id="full_name"
                        name="full_name"
                        type="text"
                        value={form.full_name}
                        onChange={handleChange}
                    />
                </div>

                <div style={{ marginTop: '12px' }}>
                    <label htmlFor="email">Email</label>
                    <br />
                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                    />
                </div>

                <div style={{ marginTop: '12px' }}>
                    <label htmlFor="password">Пароль</label>
                    <br />
                    <input
                        id="password"
                        name="password"
                        type="password"
                        value={form.password}
                        onChange={handleChange}
                    />
                </div>

                {error?.error && (
                    <p style={{ color: 'crimson', marginTop: '12px' }}>
                        {error.error}
                    </p>
                )}

                {error?.errors && (
                    <div style={{ color: 'crimson', marginTop: '12px' }}>
                        {Object.entries(error.errors).map(([key, value]) => (
                            <p key={key}>
                                {key}: {value}
                            </p>
                        ))}
                    </div>
                )}

                <button type="submit" disabled={isLoading} style={{ marginTop: '16px' }}>
                    {isLoading ? 'Регистрируем...' : 'Зарегистрироваться'}
                </button>
            </form>
        </section>
    );
}