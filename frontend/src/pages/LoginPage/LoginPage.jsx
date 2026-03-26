import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

import { clearAuthError, loginThunk } from '../../store/slices/authSlice';

function getFormError(form) {
    const usernameEmpty = !form.username.trim();
    const passwordEmpty = !form.password;

    if (usernameEmpty && passwordEmpty) {
        return 'Введите логин и пароль.';
    }

    if (usernameEmpty) {
        return 'Введите логин.';
    }

    if (passwordEmpty) {
        return 'Введите пароль.';
    }

    return null;
}

export default function LoginPage() {
    const dispatch = useDispatch();
    const { isAuthenticated, isLoading, error } = useSelector((state) => state.auth);

    const [form, setForm] = useState({
        username: '',
        password: '',
    });

    const [formError, setFormError] = useState(null);

    useEffect(() => {
        dispatch(clearAuthError());

        return () => {
            dispatch(clearAuthError());
        };
    }, [dispatch]);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));

        setFormError(null);

        if (error) {
            dispatch(clearAuthError());
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const validationError = getFormError(form);

        if (validationError) {
            setFormError(validationError);
            return;
        }

        dispatch(loginThunk(form));
    };

    if (isAuthenticated) {
        return <Navigate to="/files" replace />;
    }

    return (
        <section className="page">
            <div className="card">
                <h1 className="page__title">Вход</h1>

                <form className="form" onSubmit={handleSubmit}>
                    <div className="form__row">
                        <label className="form__label" htmlFor="username">
                            Логин
                        </label>
                        <input
                            className="form__input"
                            id="username"
                            name="username"
                            type="text"
                            value={form.username}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form__row">
                        <label className="form__label" htmlFor="password">
                            Пароль
                        </label>
                        <input
                            className="form__input"
                            id="password"
                            name="password"
                            type="password"
                            value={form.password}
                            onChange={handleChange}
                        />
                    </div>

                    {/* 👇 ВСЕ ОШИБКИ В ОДНОМ МЕСТЕ */}
                    {(formError || error?.error) && (
                        <div className="message message--error">
                            {formError || error.error}
                        </div>
                    )}

                    <div className="form__actions">
                        <button className="button" type="submit" disabled={isLoading}>
                            {isLoading ? 'Входим...' : 'Войти'}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}