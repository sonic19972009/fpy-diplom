import { Route, Routes } from 'react-router-dom';

import Layout from '../components/Layout/Layout';
import AdminPage from '../pages/AdminPage/AdminPage';
import FilesPage from '../pages/FilesPage/FilesPage';
import HomePage from '../pages/HomePage/HomePage';
import LoginPage from '../pages/LoginPage/LoginPage';
import NotFoundPage from '../pages/NotFoundPage/NotFoundPage';
import RegisterPage from '../pages/RegisterPage/RegisterPage';
import AdminRoute from './AdminRoute';
import ProtectedRoute from './ProtectedRoute';

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