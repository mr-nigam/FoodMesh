import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAppData } from "../context/useAppData"; // adjust path
import { authService } from "../config/constants"; // adjust path

const allowedRoles = ["customer", "rider", "seller"];

const SetRole = () => {
  const [role, setRole] = useState(null);
  const { setUser } = useAppData();
  const navigate = useNavigate();
  // const [isAuth, setIsAuth] = useState(false);

  const addRole = async()=>{
    console.log("Next clicked");
    console.log("Selected role:", role);

    // if(!role) return;

    try{
      console.log("Sending request...");

      const { data } = await axios.put(`${authService}/auth/set-role`,{role},{
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      console.log("Response:", data);

      localStorage.setItem("token", data.data.token);
      setUser(data.data.user);
      // setIsAuth(true);
      
      navigate("/", { replace: true });

    }catch(error){

      alert("something went wrong");

      console.log(error);
      console.log(error.response);
    }
  }

  return <div className=' flex min-h-screen items-center justify-center bg-white px-4'>
      <div className='w-full max-w-sm space-y-6'>
        <h1 className='text-center text-2xl font-bold'> 
          Choose your role
        </h1>

        <div className='space-y-4'>
          { allowedRoles.map((r) => (
              <button 
                key={r} 
                onClick={()=>setRole(r)}
                className={`w-full rounder-xl border px-4 py-3 text-sm font-medium capitalize transition ${
                role === r
                  ? "border-[#e23744] bg-[#E23344] text-white"
                  :"border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Continue as {r}
              </button>
            ))}
        </div>

          <button 
            disabled={!role}
            onClick={addRole}
            className={`w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
            role
              ? "border-[#e23744] bg-[#E23344] text-white hover:bg-[#d32f3a]"
              :"bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            Next
          </button>
      </div>
  </div>
}


export default SetRole;