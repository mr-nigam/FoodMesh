const getAuthHeader = () => {
    const token = localStorage.getItem("token");

    if (!token) {
        return {};
    }

    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

export default getAuthHeader;