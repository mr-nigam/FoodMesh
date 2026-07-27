import {BrowserRouter, Routes, Route} from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
// import {Toaster} from 'react-auth-toast';
import { Toaster } from "react-hot-toast";


const App = () => {
  return <>
    <BrowserRouter>
      <Toaster/>
      
      <Routes>
      
        <Route path="/" element={<Home/>}/>
        <Route path="/login" element={<Login/>}/>
        
        
      </Routes>
    </BrowserRouter>
  </>
}

export default App;
