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
import CartPage from './pages/CartPage';
import AddressPage from './pages/AddressPage';
import AddAddressPage from './pages/AddAddressPage';
import Checkout from './pages/Checkout';


const App = () => {
    const {user} = useAppData();
    
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
                                : <Home />
                        }
                    />

                    <Route path="/set-role" element={<SetRole />} />
                    
                    <Route path="/account" element={<Account />} />

                    <Route path="/checkout" element={<Checkout />} />
                    
                    <Route path="/address" element={<AddressPage />} />
                    <Route path="/add-address" element={<AddAddressPage />} />

                    <Route path="/cart" element={<CartPage/>}/>
                    
                    <Route path="/restaurant/:restaurantId" element={<RestaurantPages />}/>

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