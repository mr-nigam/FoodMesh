import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
// import {Toaster} from 'react-auth-toast';
import { Toaster } from "react-hot-toast";
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/publicRoute';
import SetRole from './pages/SetRole';


const App = () => {
  return <>
    <BrowserRouter>
      <Toaster/>
      
      <Routes>
        <Route element={ <PublicRoute />} > 
          <Route path="/login" element={<Login/>}/>
        </Route>

        <Route element={ <ProtectedRoute />} >
           <Route path="/" element={<Home/>}/>
        </Route>
        
        <Route path="/" element={<Home/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/set-role" element={<SetRole/>} />
        
        
      </Routes>
    </BrowserRouter>
  </>
}

export default App;
