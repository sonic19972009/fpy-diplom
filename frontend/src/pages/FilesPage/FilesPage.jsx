import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
    fetchFiles,
    uploadFileThunk,
    deleteFileThunk,
} from '../../store/slices/filesSlice';

import { downloadFile } from '../../api/files';

export default function FilesPage() {
    const dispatch = useDispatch();
    const { items, isLoading } = useSelector((state) => state.files);

    const [file, setFile] = useState(null);
    const [comment, setComment] = useState('');

    useEffect(() => {
        dispatch(fetchFiles());
    }, [dispatch]);

    const handleUpload = (e) => {
        e.preventDefault();

        if (!file) return;

        dispatch(uploadFileThunk({ file, comment }));

        setFile(null);
        setComment('');
    };

    return (
        <section>
            <h1>Мои файлы</h1>

            {/* Upload */}
            <form onSubmit={handleUpload}>
                <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                />

                <input
                    type="text"
                    placeholder="Комментарий"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                />

                <button type="submit">Загрузить</button>
            </form>

            {/* List */}
            {isLoading ? (
                <p>Загрузка...</p>
            ) : (
                <ul>
                    {items.map((file) => (
                        <li key={file.id} style={{ marginTop: '12px' }}>
                            <strong>{file.original_name}</strong>
                            <br />
                            Размер: {file.size} байт
                            <br />
                            Комментарий: {file.comment}

                            <div style={{ marginTop: '6px' }}>
                                <button onClick={() => downloadFile(file.id)}>
                                    Скачать
                                </button>

                                <button
                                    onClick={() =>
                                        dispatch(deleteFileThunk(file.id))
                                    }
                                    style={{ marginLeft: '8px' }}
                                >
                                    Удалить
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}