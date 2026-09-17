import {BrowserRouter, Routes, Route,Navigate} from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import { Toaster } from "react-hot-toast";
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/publicRoute';
import SetRole from './pages/SetRole';
import NavBar from './components/navBar';
import Account from './pages/Account';
import useAppData from './context/useAppData';
import RestaurantPages from './pages/RestaurantPages';
import Restaurant from './pages/Restaurant';
import CartPage from './pages/cart/CartPage';
import AddressPage from './pages/AddressPage';
import AddAddressPage from './pages/AddAddressPage';
import Checkout from "./pages/Checkout/Checkout";
import Orders from './pages/Orders';
import UserOrderDetail from './pages/UserOrderDetail';
import RestaurantOrderDetail from './pages/RestaurantOrderDetail';
import RiderDashboard from './features/rider/pages/RiderDashboard';
import RiderOnboarding from './features/rider/pages/RiderOnboarding';
import RiderVehiclesPage from './features/rider/pages/RiderVehiclesPage';
import RiderAddVehiclePage from './features/rider/pages/RiderAddVehiclePage';


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