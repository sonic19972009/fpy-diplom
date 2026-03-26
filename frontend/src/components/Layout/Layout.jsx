import { Outlet } from 'react-router-dom';
import NavBar from '../NavBar/NavBar';
import './Layout.css';

export default function Layout() {
    return (
        <div className="app">
            <NavBar />
            <main className="app__content">
                <Outlet />
            </main>
        </div>
    );
}