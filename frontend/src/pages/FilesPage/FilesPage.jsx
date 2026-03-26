import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import { downloadFile } from '../../api/files';
import {
    clearFilesError,
    createPublicLinkThunk,
    deleteFileThunk,
    fetchFiles,
    renameFileThunk,
    updateFileCommentThunk,
    uploadFileThunk,
} from '../../store/slices/filesSlice';

export default function FilesPage() {
    const dispatch = useDispatch();
    const { items, isLoading, error } = useSelector((state) => state.files);
    const { user } = useSelector((state) => state.auth);
    const [searchParams] = useSearchParams();

    const selectedUserId = searchParams.get('user_id');

    const [file, setFile] = useState(null);
    const [comment, setComment] = useState('');
    const [renameValues, setRenameValues] = useState({});
    const [commentValues, setCommentValues] = useState({});

    useEffect(() => {
        dispatch(clearFilesError());

        if (user?.is_admin && selectedUserId) {
            dispatch(fetchFiles(selectedUserId));
        } else {
            dispatch(fetchFiles());
        }
    }, [dispatch, user, selectedUserId]);

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
        <section>
            <h1>
                {user?.is_admin && selectedUserId
                    ? `Файлы пользователя #${selectedUserId}`
                    : 'Мои файлы'}
            </h1>

            <form onSubmit={handleUpload}>
                <input
                    id="file-upload-input"
                    type="file"
                    onChange={(event) => setFile(event.target.files[0])}
                />

                <input
                    type="text"
                    placeholder="Комментарий"
                    value={comment}
                    onChange={(event) => setComment(event.target.value)}
                />

                <button type="submit">Загрузить</button>
            </form>

            {error && (
                <p style={{ color: 'crimson', marginTop: '12px' }}>
                    {error.error || 'Произошла ошибка при работе с файлами.'}
                </p>
            )}

            {isLoading ? (
                <p>Загрузка...</p>
            ) : (
                <ul>
                    {items.map((fileItem) => (
                        <li key={fileItem.id} style={{ marginTop: '20px' }}>
                            <strong>{fileItem.original_name}</strong>
                            <br />
                            Размер: {fileItem.size} байт
                            <br />
                            Комментарий: {fileItem.comment || '—'}
                            <br />
                            Дата загрузки: {fileItem.uploaded_at || '—'}
                            <br />
                            Последнее скачивание: {fileItem.last_downloaded_at || '—'}

                            <div style={{ marginTop: '10px' }}>
                                <input
                                    type="text"
                                    placeholder="Новое имя файла"
                                    value={renameValues[fileItem.id] ?? fileItem.original_name}
                                    onChange={(event) =>
                                        handleRenameChange(fileItem.id, event.target.value)
                                    }
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleRenameSubmit(fileItem.id, fileItem.original_name)
                                    }
                                    style={{ marginLeft: '8px' }}
                                >
                                    Переименовать
                                </button>
                            </div>

                            <div style={{ marginTop: '10px' }}>
                                <input
                                    type="text"
                                    placeholder="Новый комментарий"
                                    value={commentValues[fileItem.id] ?? fileItem.comment}
                                    onChange={(event) =>
                                        handleCommentChange(fileItem.id, event.target.value)
                                    }
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        handleCommentSubmit(fileItem.id, fileItem.comment)
                                    }
                                    style={{ marginLeft: '8px' }}
                                >
                                    Сохранить комментарий
                                </button>
                            </div>

                            <div style={{ marginTop: '10px' }}>
                                <button type="button" onClick={() => downloadFile(fileItem.id)}>
                                    Скачать
                                </button>

                                <button
                                    type="button"
                                    onClick={() => dispatch(deleteFileThunk(fileItem.id))}
                                    style={{ marginLeft: '8px' }}
                                >
                                    Удалить
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleCreatePublicLink(fileItem.id)}
                                    style={{ marginLeft: '8px' }}
                                >
                                    Получить публичную ссылку
                                </button>
                            </div>

                            {fileItem.public_url && (
                                <div style={{ marginTop: '10px' }}>
                                    <a
                                        href={fileItem.public_url}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
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