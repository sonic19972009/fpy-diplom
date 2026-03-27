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

    const handleUpload = (event) => {
        event.preventDefault();

        if (!file) {
            return;
        }

        const uploadTargetUserId =
            user?.is_admin && selectedUserId ? selectedUserId : null;

        dispatch(uploadFileThunk({
            file,
            comment,
            userId: uploadTargetUserId,
        }));

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

    return (
        <section className="page">
            <h1 className="page__title">{pageTitle}</h1>

            {!isMissingUserError && !isLoading && (
                <div className="card">
                    <form className="form" onSubmit={handleUpload}>
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

                        <div className="form__actions">
                            <button className="button" type="submit">
                                Загрузить
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {error && (
                <div className="message message--error">
                    {error.error || 'Произошла ошибка при работе с файлами.'}
                </div>
            )}

            {isLoading ? (
                <p>Загрузка...</p>
            ) : (
                <ul className="files-list">
                    {items.map((fileItem) => (
                        <li key={fileItem.id} className="file-card">
                            <h2 className="file-card__title">{fileItem.original_name}</h2>

                            <p className="file-card__meta">Размер: {fileItem.size} байт</p>
                            <p className="file-card__meta">
                                Комментарий: {fileItem.comment || '—'}
                            </p>
                            <p className="file-card__meta">
                                Дата загрузки: {fileItem.uploaded_at || '—'}
                            </p>
                            <p className="file-card__meta">
                                Последнее скачивание: {fileItem.last_downloaded_at || '—'}
                            </p>

                            <div className="file-card__section">
                                <div className="form__row">
                                    <label className="form__label">Новое имя файла</label>
                                    <input
                                        className="form__input"
                                        type="text"
                                        value={renameValues[fileItem.id] ?? fileItem.original_name}
                                        onChange={(event) =>
                                            handleRenameChange(fileItem.id, event.target.value)
                                        }
                                    />
                                </div>

                                <div className="form__actions" style={{ marginTop: '10px' }}>
                                    <button
                                        className="button button--secondary"
                                        type="button"
                                        onClick={() =>
                                            handleRenameSubmit(fileItem.id, fileItem.original_name)
                                        }
                                    >
                                        Переименовать
                                    </button>
                                </div>
                            </div>

                            <div className="file-card__section">
                                <div className="form__row">
                                    <label className="form__label">Новый комментарий</label>
                                    <input
                                        className="form__input"
                                        type="text"
                                        value={commentValues[fileItem.id] ?? fileItem.comment}
                                        onChange={(event) =>
                                            handleCommentChange(fileItem.id, event.target.value)
                                        }
                                    />
                                </div>

                                <div className="form__actions" style={{ marginTop: '10px' }}>
                                    <button
                                        className="button button--secondary"
                                        type="button"
                                        onClick={() =>
                                            handleCommentSubmit(fileItem.id, fileItem.comment)
                                        }
                                    >
                                        Сохранить комментарий
                                    </button>
                                </div>
                            </div>

                            <div className="file-card__section">
                                <div className="form__actions">
                                    <button
                                        className="button"
                                        type="button"
                                        onClick={() => downloadFile(fileItem.id)}
                                    >
                                        Скачать
                                    </button>

                                    <button
                                        className="button button--danger"
                                        type="button"
                                        onClick={() => dispatch(deleteFileThunk(fileItem.id))}
                                    >
                                        Удалить
                                    </button>

                                    {fileItem.public_url ? (
                                        <>
                                            <button
                                                className="button button--secondary"
                                                type="button"
                                                onClick={async () => {
                                                    const fullLink = `${window.location.origin}${fileItem.public_url}`;
                                                    try {
                                                        await navigator.clipboard.writeText(fullLink);
                                                        alert('Публичная ссылка скопирована в буфер обмена.');
                                                    } catch {
                                                        alert(`Публичная ссылка: ${fullLink}`);
                                                    }
                                                }}
                                            >
                                                Копировать ссылку
                                            </button>

                                            <button
                                                className="button button--secondary"
                                                type="button"
                                                onClick={() => dispatch(deletePublicLinkThunk(fileItem.id))}
                                            >
                                                Удалить ссылку
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            className="button button--secondary"
                                            type="button"
                                            onClick={() => handleCreatePublicLink(fileItem.id)}
                                        >
                                            Получить публичную ссылку
                                        </button>
                                    )}
                                </div>
                            </div>

                            {fileItem.public_url && (
                                <div className="file-card__section">
                                    <a href={fileItem.public_url} target="_blank" rel="noreferrer">
                                        Открыть публичную ссылку
                                    </a>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}