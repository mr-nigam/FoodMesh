import axios from "axios";
import { addressService, userService } from "../../../config/constants";
import getAuthHeader from "../../../config/getAuthHeader.js";

const getErrorMessage = (error, fallbackMessage) => {
    if (axios.isAxiosError(error)) {
        return (
            error.response?.data?.message ||
            error.response?.data?.error ||
            fallbackMessage
        );
    }
    return error?.message || fallbackMessage;
};

const getDefaultAddress = async () => {
    try {
        const { data } = await axios.get(
            `${addressService}/default`,
            {
                headers: getAuthHeader(),
                withCredentials: true
            }
        );
        return data;
    } catch (error) {
        const message = getErrorMessage(
            error,
            "Unable to load your default address. Please try again."
        );
        console.error("Error fetching default address:", error);
        throw new Error(message, { cause: error });
    }
};

const getAllAddresses = async () => {
    try {
        const { data } = await axios.get(
            `${userService}/address/all`,
            {
                headers: getAuthHeader(),
                withCredentials: true
            }
        );
        return data;
    } catch (error) {
        console.error("Error fetching addresses:", error);
        throw error;
    }
};

const addressApi = {
    getDefault: getDefaultAddress,
    getAll: getAllAddresses,
};

export {
    getDefaultAddress,
    getAllAddresses,
    addressApi
};

export default addressApi;