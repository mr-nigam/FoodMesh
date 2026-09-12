import { useContext } from 'react';
import { SocketContext } from './context';

const useSocket = () => {
    const socket = useContext(SocketContext);
    return socket;
};

export { useSocket };
export default useSocket;