import { useContext } from 'react';
import AppContext from './context';


const useAppData = () => {
    const context = useContext(AppContext);

    if(!context){
        throw new Error("useAppData must be used within AppProvider");
    }

    return context;
};


export default useAppData; 