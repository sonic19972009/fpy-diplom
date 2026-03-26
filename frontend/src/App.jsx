import { useEffect } from 'react';
import { useDispatch } from 'react-redux';

import AppRouter from './app/router';
import { fetchCurrentUser } from './store/slices/authSlice';

export default function App() {
    const dispatch = useDispatch();

    useEffect(() => {
        dispatch(fetchCurrentUser());
    }, [dispatch]);

    return <AppRouter />;
}