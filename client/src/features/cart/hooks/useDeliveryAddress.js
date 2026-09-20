import { 
    useCallback,
    useEffect,
    useState
} from "react";

import { getApiErrorMessage } from "../utils/error";
import{
    getDefaultAddress
} from '../services/cartService.js';


const useDeliveryAddress = () => {
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [addressLoading, setAddressLoading] = useState(true);
    const [addressError, setAddressError] = useState(null);

    useEffect(() => {
        let mounted = true;

        const loadDefaultAddress = async () => {
            const token = localStorage.getItem("token");
            if(!token){
                setAddressLoading(false);
                return;
            }

            setAddressLoading(true);
            setAddressError(null);

            try{

               const address = await getDefaultAddress();

                if(!mounted) return;

                setSelectedAddress(address);
            
            }catch(error){
                if (!mounted) return;

                console.error("Failed to load default address:", error);

                setAddressError(
                    getApiErrorMessage(error, "Unable to load delivery address")
                );

            }finally{
                if(mounted){
                    setAddressLoading(false);
                }
            }
        };

        loadDefaultAddress();

        return () => {
            mounted = false;
        };
    }, []);

    const openAddressSelector = useCallback(() => {
        setIsAddressModalOpen(true);
    }, []);

    const closeAddressSelector = useCallback(() => {
        setIsAddressModalOpen(false);
    }, []);

    const selectAddress = useCallback((address) => {
        setSelectedAddress(address);
        setAddressError(null);
        setIsAddressModalOpen(false);
    }, []);

    return {
        selectedAddress,
        addressLoading,
        addressError,
        isAddressModalOpen,
        openAddressSelector,
        closeAddressSelector,
        selectAddress,
    };
};


export default useDeliveryAddress;