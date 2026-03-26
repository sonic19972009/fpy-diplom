import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

import { clearAuthError, loginThunk } from '../../store/slices/authSlice';

export default function LoginPage() {
    const dispatch = useDispatch();
    const { isAuthenticated, isLoading, error } = useSelector((state) => state.auth);

    const [form, setForm] = useState({
        username: '',
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

    const handleSubmit = async (event) => {
        event.preventDefault();
        dispatch(loginThunk(form));
    };

    if (isAuthenticated) {
        return <Navigate to="/files" replace />;
    }

    return (
        <section>
            <h1>Вход</h1>

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

                <button type="submit" disabled={isLoading} style={{ marginTop: '16px' }}>
                    {isLoading ? 'Входим...' : 'Войти'}
                </button>
            </form>
        </section>
    );
}