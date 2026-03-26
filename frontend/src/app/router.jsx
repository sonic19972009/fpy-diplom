import { Routes, Route } from 'react-router-dom';

import Layout from '../components/Layout/Layout';
import HomePage from '../pages/HomePage/HomePage';
import LoginPage from '../pages/LoginPage/LoginPage';
import RegisterPage from '../pages/RegisterPage/RegisterPage';
import FilesPage from '../pages/FilesPage/FilesPage';
import AdminPage from '../pages/AdminPage/AdminPage';
import NotFoundPage from '../pages/NotFoundPage/NotFoundPage';

import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';

export default function AppRouter() {
    return (
        <Routes>
            <Route path="/" element={<Layout />}>
                <Route index element={<HomePage />} />

                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />

                <Route
                    path="files"
                    element={
                        <ProtectedRoute>
                            <FilesPage />
                        </ProtectedRoute>
                    }
                />

                <Route
                    path="admin"
                    element={
                        <AdminRoute>
                            <AdminPage />
                        </AdminRoute>
                    }
                />

                <Route path="*" element={<NotFoundPage />} />
            </Route>
        </Routes>
    );
}