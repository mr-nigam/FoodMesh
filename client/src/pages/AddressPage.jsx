import { useEffect, useState } from "react"; 
import { useNavigate } from "react-router-dom"; 
import axios from "axios"; 
import toast from "react-hot-toast"; 
import { addressService } from '../config/constants.js'; 
import { BiLoader, BiPlus, BiTrash, BiHome, BiBriefcase, BiMapPin, BiCheckCircle } from "react-icons/bi"; 
import { LuArrowLeft } from "react-icons/lu"; 


const AddressPage = () => { 
  const navigate = useNavigate(); 
  const [addresses, setAddresses] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [deletingId, setDeletingId] = useState(null); 

  // Fetch all saved user addresses 
  const fetchAddresses = async () => { 
    try { 
      setLoading(true); 
      const token = localStorage.getItem("token"); 

      const { data } = await axios.get(`${addressService}/all`, { 
        headers: { 
          Authorization: `Bearer ${token}`, 
        }, 
      }); 

      const list = data?.data?.addresses || data?.addresses || []; 
      setAddresses(list); 
    } catch (error) { 
      console.error("Failed to load addresses:", error);
      toast.error("Failed to load addresses"); 
    } finally { 
      setLoading(false); 
    } 
  }; 

  useEffect(() => { 
    fetchAddresses(); 
  }, []); 

  // Delete address 
  const deleteAddress = async (id) => { 
    if (!window.confirm("Are you sure you want to delete this address?")) return; 

    try { 
      setDeletingId(id); 

      await axios.delete(`${addressService}/${id}`, { 
        headers: { 
          Authorization: `Bearer ${localStorage.getItem("token")}`, 
        }, 
      }); 

      toast.success("Address deleted successfully"); 
      setAddresses((prev) => prev.filter((item) => item.id !== id && item._id !== id)); 
    } catch (error) { 
      toast.error(error.response?.data?.message || "Failed to delete address"); 
    } finally { 
      setDeletingId(null); 
    } 
  }; 

  const getLabelIcon = (label) => { 
    const l = (label || "").toLowerCase(); 
    if (l === "home") return <BiHome className="text-[#E23744]" size={16} />; 
    if (l === "work") return <BiBriefcase className="text-[#E23744]" size={16} />; 
    return <BiMapPin className="text-[#E23744]" size={16} />; 
  }; 

  return ( 
    <div className="min-h-screen bg-gray-50 px-4 py-6"> 
      <div className="mx-auto max-w-2xl space-y-6"> 
        {/* Header */} 
        <div className="flex items-center gap-3"> 
          <button 
            onClick={() => navigate("/account")} 
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow hover:bg-gray-100 cursor-pointer" 
          > 
            <LuArrowLeft size={18} className="text-gray-700" /> 
          </button> 
          <div> 
            <h1 className="text-xl font-bold text-gray-900">Your Saved Addresses</h1> 
            <p className="text-xs text-gray-500">Manage delivery addresses for your orders</p> 
          </div> 
        </div> 

        {/* Address List */} 
        <div className="space-y-4"> 
          {loading ? ( 
            <div className="flex flex-col items-center justify-center py-12 rounded-xl bg-white shadow-sm space-y-3"> 
              <BiLoader className="animate-spin text-[#E23744]" size={32} /> 
              <p className="text-sm font-medium text-gray-500">Loading your addresses...</p> 
            </div> 
          ) : addresses.length === 0 ? ( 
            <div className="flex flex-col items-center justify-center py-12 rounded-xl bg-white shadow-sm text-center px-4 py-10 space-y-3"> 
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-[#E23744]"> 
                <BiMapPin size={28} /> 
              </div> 
              <h3 className="text-base font-semibold text-gray-800">No Addresses Found</h3> 
              <p className="text-xs text-gray-500 max-w-sm"> 
                You don't have any saved delivery addresses yet. Click below to add your first address! 
              </p> 
            </div> 
          ) : ( 
            addresses.map((addr) => { 
              const addrId = addr.id || addr._id; 
              return ( 
                <div 
                  key={addrId} 
                  className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md ${ 
                    addr.is_default ? "border-[#E23744]/40 bg-red-50/20" : "border-gray-200" 
                  }`} 
                > 
                  <div className="space-y-1.5 pr-8"> 
                    <div className="flex items-center gap-2"> 
                      <span className="flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700"> 
                        {getLabelIcon(addr.label)} 
                        {addr.label || "Address"} 
                      </span> 
                      {addr.is_default && ( 
                        <span className="flex items-center gap-1 rounded-md bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-700"> 
                          <BiCheckCircle size={12} /> Default 
                        </span> 
                      )} 
                    </div> 

                    <h4 className="text-sm font-bold text-gray-900"> 
                      {addr.recipient_name || addr.recipientName || "Recipient"} 
                      {(addr.phone || addr.mobile) && (
                        <span className="ml-2 font-normal text-gray-500 text-xs"> 
                          📞 {addr.phone || addr.mobile} 
                        </span> 
                      )}
                    </h4> 

                    <p className="text-xs text-gray-600 leading-relaxed"> 
                      {addr.formatted_address || addr.formattedAddress || ( 
                        [ 
                          addr.address_line_1 || addr.addressLine1, 
                          addr.address_line_2 || addr.addressLine2, 
                          addr.landmark, 
                          addr.city, 
                          addr.state, 
                          addr.postal_code || addr.postalCode 
                        ].filter(Boolean).join(", ") 
                      )} 
                    </p> 
                  </div> 

                  <div className="flex items-center gap-2 self-end sm:self-center"> 
                    <button 
                      onClick={() => deleteAddress(addrId)} 
                      disabled={deletingId === addrId} 
                      className="flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition cursor-pointer" 
                    > 
                      {deletingId === addrId ? ( 
                        <BiLoader size={14} className="animate-spin" /> 
                      ) : ( 
                        <BiTrash size={14} /> 
                      )} 
                      Delete 
                    </button> 
                  </div> 
                </div> 
              ); 
            }) 
          )} 
        </div> 

        {/* Add New Address Button */} 
        <div className="pt-2"> 
          <button 
            onClick={() => navigate("/add-address")} 
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E23744] py-3.5 px-4 text-sm font-semibold text-white shadow-md hover:bg-[#d32f3a] active:scale-[0.99] transition cursor-pointer" 
          > 
            <BiPlus size={20} /> 
            Add New Address 
          </button> 
        </div> 
      </div> 
    </div> 
  ); 
}; 


export default AddressPage;