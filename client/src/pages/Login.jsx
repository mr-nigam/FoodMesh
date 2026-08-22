import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useGoogleLogin } from '@react-oauth/google';
import { FcGoogle } from 'react-icons/fc';
import { authService } from '../config/constants';
import useAppData from '../context/useAppData';


const Login = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const {setUser, setIsAuth} = useAppData();

    const responseGoogle = async (authResult)=>{
        setLoading(true);
        try{
            const {data} = await axios.post(`${authService}/login`,{
                code : authResult["code"]
            });

            localStorage.setItem("token",data.data.token);
            toast.success(data.message);
            setLoading(false);
            
            setUser(data.data.user);
            setIsAuth(true);

            navigate("/");
            
        }catch(error){
            console.log(error);
            toast.error("Problem while login");
            setLoading(false);
        }
    };

    const googleLogin = useGoogleLogin({
        onSuccess: responseGoogle,
        onError: responseGoogle,
        flow: "auth-code",
    });

  return (
    <div className='flex min-h-screen items-center justify-center bg-white px-4'>
        <div className='w-full max-w-sm space-y-6'>
            <h1 className='text-center text-3xl font-bold text-[#E23774]'>
                FoodMesh
            </h1>
            <p className='text-center text-sm text-gray-500'>
                Log in or sign up to continue
            </p>
            <button onClick={googleLogin} disabled={loading} className="flex w-full items-center justify-center gap-3 rounded-xl border border-grey--300 bg-white px-4 py-3">
                <FcGoogle size={20}/>{loading?"Signin in...":"Continue with Google"}
            </button>

            <p className='text-center text-xs text-gray-400'>
                By continuing, you agree with our {" "} 
                <span className='text-[#E23774]'>Terms of Service</span> &{" "}
                <span className='text-[#E23774]'>Privacy Policy</span>

            </p>
        </div>
    </div>
  )
}


export default Login;