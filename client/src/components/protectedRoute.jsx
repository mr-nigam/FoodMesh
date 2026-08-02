import { Navigate, Outlet, useLocation} from 'react-router-dom';
import useAppData from '../context/useAppData.js';


const ProtectedRoute = ()=> {
    const {isAuth, user, loading } = useAppData();
    
    const location = useLocation();

    if(loading) return null;

    if(!isAuth){
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if(!isAuth){
        return <Navigate to={"/login"} state={{ from: location }} replace />
    }

    // // Force role selection only if they don't have one
    // if (!user?.role && location.pathname !== "/set-role") {
    //     return <Navigate to="/set-role" replace />;
    // }

    if(!user?.role){
        if(location.pathname !== "/set-role"){
            return <Navigate to="/set-role" replace />;
        }
    }else{
        if(location.pathname === "/set-role"){
            return <Navigate to="/" replace />;
        }
    }
    
    return <Outlet />
};


export default ProtectedRoute;