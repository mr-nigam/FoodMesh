import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
// import {Toaster} from 'react-auth-toast';
import { Toaster } from "react-hot-toast";
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/publicRoute';
import SetRole from './pages/SetRole';
import NavBar from './components/navBar';
import Account from './pages/Account';


const App = () => {
  return <>
    <BrowserRouter>
        <Toaster />
        <NavBar />
        <Routes>
            <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
            </Route>

            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Home />} />
                <Route path="/set-role" element={<SetRole />} />
                <Route path="/account" element={<Account />} />
            </Route>
        </Routes>
  </BrowserRouter>
  </>
}


export default App;
