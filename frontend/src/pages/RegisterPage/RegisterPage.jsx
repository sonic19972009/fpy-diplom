import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useNavigate } from 'react-router-dom';

import { clearAuthError, registerThunk } from '../../store/slices/authSlice';

const usernamePattern = /^[A-Za-z][A-Za-z0-9]{3,19}$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const uppercasePattern = /[A-Z]/;
const digitPattern = /\d/;
const specialPattern = /[^A-Za-z0-9]/;

function validateRegisterForm(form) {
    const errors = {};

    const usernameErrors = [];
    const fullNameErrors = [];
    const emailErrors = [];
    const passwordErrors = [];

    if (!form.username.trim()) {
        usernameErrors.push('Введите логин.');
    } else if (!usernamePattern.test(form.username.trim())) {
        usernameErrors.push(
            'Логин должен содержать только латинские буквы и цифры, начинаться с буквы и иметь длину от 4 до 20 символов.',
        );
    }

    if (!form.full_name.trim()) {
        fullNameErrors.push('Введите полное имя.');
    } else if (form.full_name.trim().length < 2) {
        fullNameErrors.push('Полное имя должно содержать не менее 2 символов.');
    }

    if (!form.email.trim()) {
        emailErrors.push('Введите email.');
    } else if (!emailPattern.test(form.email.trim())) {
        emailErrors.push('Введите корректный email.');
    }

    if (!form.password) {
        passwordErrors.push('Введите пароль.');
    } else {
        if (form.password.length < 6) {
            passwordErrors.push('не менее 6 символов');
        }

        if (!uppercasePattern.test(form.password)) {
            passwordErrors.push('хотя бы одну заглавную букву');
        }

        if (!digitPattern.test(form.password)) {
            passwordErrors.push('хотя бы одну цифру');
        }

        if (!specialPattern.test(form.password)) {
            passwordErrors.push('хотя бы один специальный символ');
        }
    }

    if (usernameErrors.length > 0) {
        errors.username = usernameErrors;
    }

    if (fullNameErrors.length > 0) {
        errors.full_name = fullNameErrors;
    }

    if (emailErrors.length > 0) {
        errors.email = emailErrors;
    }

    if (passwordErrors.length > 0) {
        errors.password = passwordErrors;
    }

    return errors;
}

function renderFieldErrors(errors, fieldName = '') {
    if (!errors || errors.length === 0) {
        return null;
    }

    if (fieldName === 'password') {
        return (
            <div className="message message--error">
                <p style={{ margin: '4px 0' }}>Пароль должен содержать:</p>
                <ul style={{ margin: '8px 0 0 20px', padding: 0 }}>
                    {errors.map((errorText) => (
                        <li key={errorText} style={{ marginBottom: '4px' }}>
                            {errorText}
                        </li>
                    ))}
                </ul>
            </div>
        );
    }

    return (
        <div className="message message--error">
            {errors.map((errorText) => (
                <p key={errorText} style={{ margin: '4px 0' }}>
                    {errorText}
                </p>
            ))}
        </div>
    );
}

export default function RegisterPage() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isAuthenticated, isLoading, error } = useSelector((state) => state.auth);

    const [form, setForm] = useState({
        username: '',
        full_name: '',
        email: '',
        password: '',
    });

    const [clientErrors, setClientErrors] = useState({});

    const passwordHint = useMemo(
        () => 'Минимум 6 символов, хотя бы одна заглавная буква, одна цифра и один специальный символ.',
        [],
    );

    const usernameHint = useMemo(
        () => 'Только латинские буквы и цифры, первый символ — буква, длина от 4 до 20 символов.',
        [],
    );

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

        setClientErrors((prev) => ({
            ...prev,
            [name]: undefined,
        }));

        if (error) {
            dispatch(clearAuthError());
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const validationErrors = validateRegisterForm(form);
        setClientErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            return;
        }

        const resultAction = await dispatch(registerThunk(form));

        if (registerThunk.fulfilled.match(resultAction)) {
            alert('Пользователь создан. Требуется войти в систему.');
            navigate('/login', { replace: true });
        }
    };

    if (isAuthenticated) {
        return <Navigate to="/files" replace />;
    }

    return (
        <section className="page">
            <div className="card">
                <h1 className="page__title">Регистрация</h1>

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
                        <small style={{ color: '#6b7280' }}>{usernameHint}</small>
                        {renderFieldErrors(clientErrors.username)}
                    </div>

                    <div className="form__row">
                        <label className="form__label" htmlFor="full_name">
                            Полное имя
                        </label>
                        <input
                            className="form__input"
                            id="full_name"
                            name="full_name"
                            type="text"
                            value={form.full_name}
                            onChange={handleChange}
                        />
                        {renderFieldErrors(clientErrors.full_name)}
                    </div>

                    <div className="form__row">
                        <label className="form__label" htmlFor="email">
                            Email
                        </label>
                        <input
                            className="form__input"
                            id="email"
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={handleChange}
                        />
                        {renderFieldErrors(clientErrors.email)}
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
                        <small style={{ color: '#6b7280' }}>{passwordHint}</small>
                        {renderFieldErrors(clientErrors.password, 'password')}
                    </div>

                    {error?.error && (
                        <div className="message message--error">
                            {error.error}
                        </div>
                    )}

                    {error?.errors && (
                        <div className="message message--error">
                            {Object.entries(error.errors).map(([key, value]) => (
                                <p key={key} style={{ margin: '4px 0' }}>
                                    {value}
                                </p>
                            ))}
                        </div>
                    )}

                    <div className="form__actions">
                        <button className="button" type="submit" disabled={isLoading}>
                            {isLoading ? 'Регистрируем...' : 'Зарегистрироваться'}
                        </button>
                    </div>
                </form>
            </div>
        </section>
    );
}