import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ children }) {
    const { isAuthenticated, isAuthChecked } = useSelector((state) => state.auth);

    if (!isAuthChecked) {
        return null;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}