import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from 'react-router-dom';

import { Toaster } from "react-hot-toast";

import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

import useAppData from '../context/useAppData';

import Home from '../features/home/pages/Home';

import Login from '../features/auth/Login';
import SetRole from '../features/auth/SetRole';

import RestaurantPages from '../features/restaurant/pages/RestaurantPages';
import Restaurant from '../features/restaurant/pages/Restaurant';
import RestaurantOrderDetail from '../features/restaurant/pages/RestaurantOrderDetail';

import CartPage from '../features/cart/pages/CartPage';
import Checkout from "../features/checkout/Checkout";

import AddressPage from '../features/user/pages/AddressPage';
import AddAddressPage from '../features/user/pages/AddAddressPage';
import Orders from '../features/user/pages/Orders';
import UserOrderDetail from '../features/user/pages/UserOrderDetail';

import RiderDashboard from '../features/rider/pages/RiderDashboard';
import RiderOnboarding from '../features/rider/pages/RiderOnboarding';
import RiderVehiclesPage from '../features/rider/pages/RiderVehiclesPage';
import RiderAddVehiclePage from '../features/rider/pages/RiderAddVehiclePage';

import NavBar from '../shared/components/NavBar';
import Account from '../shared/pages/Account';


const App = () => {
    const {user, loading} = useAppData();
    
    if(loading){
        return <h1 className='text-2xl font-bold text-red-500 text-center mt-56'>
            Loading...
        </h1>
    }

    return <>
        <BrowserRouter>
            <Toaster />
            <NavBar />
            <Routes>
               
                <Route element={<PublicRoute />}>
                    <Route path="/login" element={<Login />} />    
                </Route>

                <Route element={<ProtectedRoute />}>
                    <Route
                        path="/"
                        element={
                            user?.role === "seller"
                                ? <Navigate to="/restaurant" replace />
                                : user?.role === "rider"
                                    ? <Navigate to="/rider" replace />
                                    : <Home />
                        }
                    />
                    
                    <Route
                        path="/rider"
                        element={
                            user?.role === "rider"
                                ? <RiderDashboard />
                                : <Navigate to="/" replace />
                        }
                    />
                    
                    <Route 
                        path="/rider-registration"
                        element={<RiderOnboarding />}
                    />

                    <Route
                        path="/rider/dashboard"
                        element={
                            user?.role === "rider"
                                ? <RiderDashboard />
                                : <Navigate to="/" replace />
                        }
                    />

                    <Route
                        path="/rider/vehicles"
                        element={
                            user?.role === "rider"
                                ? <RiderVehiclesPage />
                                : <Navigate to="/" replace />
                        }
                    />

                    <Route
                        path="/rider/vehicles/add"
                        element={
                            user?.role === "rider"
                                ? <RiderAddVehiclePage />
                                : <Navigate to="/" replace />
                        }
                    />

                    <Route path="/set-role" element={<SetRole />} />
                    
                    <Route path="/account" element={<Account />} />
                    
                    <Route path="/orders" element={<Orders />}/>
                    
                    <Route path="/orders/:orderId" element={<UserOrderDetail />}/>

                    <Route path="/checkout/:orderId" element={<Checkout />} />
                    
                    <Route path="/address" element={<AddressPage />} />
                    
                    <Route path="/add-address" element={<AddAddressPage />} />

                    <Route path="/cart" element={<CartPage/>}/>
                    
                    <Route path="/restaurant/:restaurantId" element={<RestaurantPages />}/>

                    <Route
                        path="/restaurant/orders/:orderId"
                        element={
                            user?.role === "seller"
                                ? <RestaurantOrderDetail />
                                : <Navigate to="/" replace />
                        }
                    />

                    <Route
                        path="/restaurant"
                        element={
                            user?.role === "seller"
                                ? <Restaurant />
                                : <Navigate to="/" replace />
                        }
                    />

                </Route>
            </Routes>
        </BrowserRouter>
    </>
}


export default App;