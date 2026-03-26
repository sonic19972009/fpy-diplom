import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

import ForbiddenPage from '../pages/ForbiddenPage/ForbiddenPage';

export default function AdminRoute({ children }) {
    const { isAuthenticated, user, isAuthChecked } = useSelector((state) => state.auth);

    if (!isAuthChecked) {
        return null;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!user?.is_admin) {
        return <ForbiddenPage />;
    }

    return children;
}