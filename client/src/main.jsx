import { createRoot } from 'react-dom/client';
import './index.css';
import App from '../src/app/App.jsx';
import AppProvider from './context/AppContext.jsx';
import SocketProvider from './context/SocketContext.jsx';
import 'leaflet/dist/leaflet.css';


createRoot(document.getElementById("root")).render(
    <AppProvider>
        <SocketProvider>
            <App />
        </SocketProvider>
    </AppProvider>
);