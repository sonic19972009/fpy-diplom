import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import { downloadFile } from '../../api/files';
import {
    clearCurrentFilesUser,
    clearFilesError,
    createPublicLinkThunk,
    deleteFileThunk,
    deletePublicLinkThunk,
    fetchFiles,
    renameFileThunk,
    updateFileCommentThunk,
    uploadFileThunk,
} from '../../store/slices/filesSlice';

import useDocumentTitle from '../../hooks/useDocumentTitle';

function formatFileDate(dateString) {
    if (!dateString) {
        return '—';
    }

    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return new Intl.DateTimeFormat('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);
}

function formatFileSize(size) {
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

export default function FilesPage() {
    const dispatch = useDispatch();
    const { items, currentUser, isLoading, error } = useSelector((state) => state.files);
    const { user } = useSelector((state) => state.auth);
    const [searchParams] = useSearchParams();

    const selectedUserId = searchParams.get('user_id');

    const [file, setFile] = useState(null);
    const [comment, setComment] = useState('');
    const [renameValues, setRenameValues] = useState({});
    const [commentValues, setCommentValues] = useState({});
    const [openedMenuId, setOpenedMenuId] = useState(null);

    useEffect(() => {
        dispatch(clearFilesError());
        dispatch(clearCurrentFilesUser());

        if (user?.is_admin && selectedUserId) {
            dispatch(fetchFiles(selectedUserId));
        } else {
            dispatch(fetchFiles());
        }
    }, [dispatch, user, selectedUserId]);

    const isMissingUserError = error?.error === 'Пользователь не найден.';
    const isViewingForeignStorage = Boolean(user?.is_admin && selectedUserId);

    const pageTitle = useMemo(() => {
        if (!isViewingForeignStorage) {
            return 'Мои файлы';
        }

        if (isLoading) {
            return 'Загрузка хранилища пользователя...';
        }

        if (isMissingUserError) {
            return 'Хранилище пользователя недоступно';
        }

        if (currentUser?.username) {
            return `Файлы пользователя ${currentUser.username} (ID: ${currentUser.id})`;
        }

        return 'Файлы пользователя';
    }, [isViewingForeignStorage, isLoading, isMissingUserError, currentUser]);

    useDocumentTitle(
    pageTitle === 'Мои файлы'
        ? 'My Cloud — Мои файлы'
        : `My Cloud — ${pageTitle}`,
);

    const handleUpload = (event) => {
        event.preventDefault();

        if (!file) {
            return;
        }

        const uploadTargetUserId =
            user?.is_admin && selectedUserId ? selectedUserId : null;

        dispatch(
            uploadFileThunk({
                file,
                comment,
                userId: uploadTargetUserId,
            }),
        );

        setFile(null);
        setComment('');

        const fileInput = document.getElementById('file-upload-input');
        if (fileInput) {
            fileInput.value = '';
        }
    };

    const handleRenameChange = (fileId, value) => {
        setRenameValues((prev) => ({
            ...prev,
            [fileId]: value,
        }));
    };

    const handleCommentChange = (fileId, value) => {
        setCommentValues((prev) => ({
            ...prev,
            [fileId]: value,
        }));
    };

    const handleRenameSubmit = (fileId, currentName) => {
        const newName = (renameValues[fileId] ?? currentName).trim();

        if (!newName) {
            return;
        }

        dispatch(renameFileThunk({ fileId, originalName: newName }));
    };

    const handleCommentSubmit = (fileId, currentComment) => {
        const newComment = (commentValues[fileId] ?? currentComment).trim();

        dispatch(updateFileCommentThunk({ fileId, comment: newComment }));
    };

    const handleCreatePublicLink = async (fileId) => {
        const resultAction = await dispatch(createPublicLinkThunk(fileId));

        if (createPublicLinkThunk.fulfilled.match(resultAction)) {
            const fullLink = `${window.location.origin}${resultAction.payload.public_url}`;
            try {
                await navigator.clipboard.writeText(fullLink);
                alert('Публичная ссылка скопирована в буфер обмена.');
            } catch {
                alert(`Публичная ссылка: ${fullLink}`);
            }
        }
    };

    const handleCopyPublicLink = async (publicUrl) => {
        const fullLink = `${window.location.origin}${publicUrl}`;
        try {
            await navigator.clipboard.writeText(fullLink);
            alert('Публичная ссылка скопирована в буфер обмена.');
        } catch {
            alert(`Публичная ссылка: ${fullLink}`);
        }
    };

    return (
        <section className="page">
            {!isMissingUserError && !isLoading && (
                <div className="card">
                    <form className="form" onSubmit={handleUpload}>
                        <div className="files-upload-grid">
                            <div className="form__row">
                                <label className="form__label" htmlFor="file-upload-input">
                                    Файл
                                </label>
                                <input
                                    className="form__input"
                                    id="file-upload-input"
                                    type="file"
                                    onChange={(event) => setFile(event.target.files[0])}
                                />
                            </div>

                            <div className="form__row">
                                <label className="form__label" htmlFor="upload-comment">
                                    Комментарий
                                </label>
                                <input
                                    className="form__input"
                                    id="upload-comment"
                                    type="text"
                                    placeholder="Комментарий"
                                    value={comment}
                                    onChange={(event) => setComment(event.target.value)}
                                />
                            </div>

                            <div className="form__row files-upload-actions">
                                <label className="form__label files-upload-actions__label">
                                    Действие
                                </label>
                                <button className="button" type="submit">
                                    Загрузить
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            <h1 className="page__title" style={{ marginTop: '24px' }}>
                {pageTitle}
            </h1>

            {error && (
                <div className="message message--error">
                    {error.error || 'Произошла ошибка при работе с файлами.'}
                </div>
            )}

            {isLoading ? (
                <p>Загрузка...</p>
            ) : items.length === 0 ? (
                <div className="card">
                    <p className="page__subtitle" style={{ marginBottom: 0 }}>
                        Файлы отсутствуют.
                    </p>
                </div>
            ) : (
                <div className="files-grid">
                    {items.map((fileItem) => {
                        const isMenuOpen = openedMenuId === fileItem.id;

                        return (
                            <div key={fileItem.id} className="file-tile">
                                <div className="file-tile__top">
                                    <div className="file-tile__icon">📄</div>

                                    <div className="file-tile__main">
                                        <div className="file-tile__name">
                                            {fileItem.original_name}
                                        </div>
                                        <div className="file-tile__meta">
                                            {formatFileSize(fileItem.size)} •{' '}
                                            {formatFileDate(fileItem.uploaded_at)}
                                        </div>
                                        <div className="file-tile__comment">
                                            {fileItem.comment || 'Без комментария'}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className="file-tile__menu-button"
                                        onClick={() =>
                                            setOpenedMenuId((prev) =>
                                                prev === fileItem.id ? null : fileItem.id,
                                            )
                                        }
                                    >
                                        ⋯
                                    </button>
                                </div>

                                <div className="file-tile__actions">
                                    <button
                                        className="button"
                                        type="button"
                                        onClick={() => downloadFile(fileItem.id)}
                                    >
                                        Скачать
                                    </button>

                                    {fileItem.public_url ? (
                                        <button
                                            className="button button--secondary"
                                            type="button"
                                            onClick={() =>
                                                handleCopyPublicLink(fileItem.public_url)
                                            }
                                        >
                                            Поделиться
                                        </button>
                                    ) : (
                                        <button
                                            className="button button--secondary"
                                            type="button"
                                            onClick={() => handleCreatePublicLink(fileItem.id)}
                                        >
                                            Создать ссылку
                                        </button>
                                    )}
                                </div>

                                {isMenuOpen && (
                                    <div className="file-tile__menu">
                                        <div className="file-tile__menu-section">
                                            <label className="form__label">
                                                Переименовать
                                            </label>
                                            <input
                                                className="form__input"
                                                type="text"
                                                value={
                                                    renameValues[fileItem.id] ??
                                                    fileItem.original_name
                                                }
                                                onChange={(event) =>
                                                    handleRenameChange(
                                                        fileItem.id,
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            <button
                                                className="button button--secondary"
                                                type="button"
                                                onClick={() =>
                                                    handleRenameSubmit(
                                                        fileItem.id,
                                                        fileItem.original_name,
                                                    )
                                                }
                                            >
                                                Сохранить имя
                                            </button>
                                        </div>

                                        <div className="file-tile__menu-section">
                                            <label className="form__label">
                                                Комментарий
                                            </label>
                                            <input
                                                className="form__input"
                                                type="text"
                                                value={
                                                    commentValues[fileItem.id] ??
                                                    fileItem.comment
                                                }
                                                onChange={(event) =>
                                                    handleCommentChange(
                                                        fileItem.id,
                                                        event.target.value,
                                                    )
                                                }
                                            />
                                            <button
                                                className="button button--secondary"
                                                type="button"
                                                onClick={() =>
                                                    handleCommentSubmit(
                                                        fileItem.id,
                                                        fileItem.comment,
                                                    )
                                                }
                                            >
                                                Сохранить комментарий
                                            </button>
                                        </div>

                                        <div className="file-tile__menu-links">
                                            {fileItem.public_url ? (
                                                <>
                                                    <button
                                                        className="file-tile__text-action"
                                                        type="button"
                                                        onClick={() =>
                                                            handleCopyPublicLink(
                                                                fileItem.public_url,
                                                            )
                                                        }
                                                    >
                                                        Копировать ссылку
                                                    </button>

                                                    <button
                                                        className="file-tile__text-action"
                                                        type="button"
                                                        onClick={() =>
                                                            dispatch(
                                                                deletePublicLinkThunk(
                                                                    fileItem.id,
                                                                ),
                                                            )
                                                        }
                                                    >
                                                        Удалить ссылку
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    className="file-tile__text-action"
                                                    type="button"
                                                    onClick={() =>
                                                        handleCreatePublicLink(fileItem.id)
                                                    }
                                                >
                                                    Создать ссылку
                                                </button>
                                            )}

                                            <button
                                                className="file-tile__text-action file-tile__text-action--danger"
                                                type="button"
                                                onClick={() =>
                                                    dispatch(deleteFileThunk(fileItem.id))
                                                }
                                            >
                                                Удалить файл
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
}