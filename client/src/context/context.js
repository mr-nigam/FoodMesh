import { createContext } from 'react';

const AppContext = createContext(undefined);
const SocketContext = createContext(null);

export {
    AppContext,
    SocketContext
};