import axios from "axios";

/**
 * Extracts a user-friendly error message from API errors.
 */
export const getApiErrorMessage = (error, fallbackMessage = "An unexpected error occurred") => {
    if (axios.isAxiosError(error)) {
        return (
            error.response?.data?.message ||
            error.response?.data?.error ||
            error.message ||
            fallbackMessage
        );
    }

    if (error instanceof Error) {
        return error.message || fallbackMessage;
    }

    if (typeof error === "string") {
        return error;
    }

    return fallbackMessage;
};