const isProduction =
    process.env.NODE_ENV === "production";

const baseCookieOptions = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
};

const getAccessTokenCookieOptions = () => ({
    ...baseCookieOptions,
    maxAge: 30 * 60 * 1000, // 15 min
});

const getRefreshTokenCookieOptions = () => ({
    ...baseCookieOptions,
    maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
});

const setAuthCookies = (
    res,
    accessToken,
    refreshToken
) => {

    res.cookie(
        "accessToken",
        accessToken,
        getAccessTokenCookieOptions()
    );
    res.cookie(
        "refreshToken",
        refreshToken,
        getRefreshTokenCookieOptions()
    );
};

const clearAuthCookies = (res) => {
    res.clearCookie(
        "accessToken",
        getAccessTokenCookieOptions()
    );
    res.clearCookie(
        "refreshToken",
        getRefreshTokenCookieOptions()
    );
};


export {
    getAccessTokenCookieOptions,
    getRefreshTokenCookieOptions,
    setAuthCookies,
    clearAuthCookies
};