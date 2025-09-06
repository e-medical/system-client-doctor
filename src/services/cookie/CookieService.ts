import Cookies from "js-cookie";


const isSecure = () => {
    return window.location.protocol === 'https:';
}

const CookieService = {
    set: (name: string, value: string,domain:any, expires:any) => {

        console.log(isSecure());

        Cookies.set(name,value,{
            domain:domain,
            path:'/',
            secure:isSecure(),
            sameSite:isSecure() ? 'None': 'Lax',
            expires:expires
        })
    },

    remove : (key:any, domain:any) => {
        Cookies.remove(key, {path:'/', domain:domain});
    },

    setAuthBrowser: (key: string, value: string) => {
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 90);

        const domain = CookieService.getDomainForCookie();
        Cookies.set(key, value, {
            expires: expiryDate,
            path: "/",
            domain,
            secure: true,
            sameSite: "Lax",
        });
    },

    getDomainForCookie: (): string => {
        const hostname = window.location.hostname;
        if (hostname === "localhost" || hostname === "192.168.8.105") {
            return hostname;
        }
        const parts = hostname.split(".");
        if (parts.length >= 2) {
            return `.${parts.slice(-2).join(".")}`;
        }
        return hostname;
    },

    tokenIsExists: (name: string): boolean => {
        return !!Cookies.get(name);
    },

    clearToken: (name: string) => {
        if (CookieService.tokenIsExists(name)) {
            Cookies.remove(name, { path: "/" });
        }
    },

    clearAll: () => {
        const allCookies = Cookies.get();
        Object.keys(allCookies).forEach((cookie) => {
            Cookies.remove(cookie, { path: "/" });
        });
    },

    getToken: (name: string): string => {
        return Cookies.get(name) || "";
    },

    tokenIsExistsWithPromise: async (name: string): Promise<boolean> => {
        return Promise.resolve(!!Cookies.get(name));
    },
};

export default CookieService;