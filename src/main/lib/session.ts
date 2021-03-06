import { Cookie, Filter, session } from "electron";

// Based on: stackoverflow.com/questions/41314826/delete-all-cookies-in-electron-desktop-app
export const deleteCookie = async (cookie: Cookie): Promise<void> => {
  return new Promise((resolve, reject) => {
    const sesh = session.defaultSession;
    if (!sesh) {
      reject(new Error("No default session exists"));
    } else {
      let url = "";
      // get prefix, like https://www.
      url += cookie.secure ? "https://" : "http://";
      url += cookie.domain && cookie.domain.charAt(0) === "." ? "www" : "";
      // append domain and path
      url += cookie.domain;
      url += cookie.path;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sesh.cookies.remove(url, cookie.name, (err: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    }
  });
};

export const fetchCookies = async (filter?: Filter): Promise<Cookie[]> => {
  return new Promise((resolve, reject) => {
    const sesh = session.defaultSession;
    if (sesh) {
      const cookieFilter = filter ? filter : {};
      sesh.cookies.get(cookieFilter, (err, cookies) => {
        if (err) {
          reject(err);
        } else {
          resolve(cookies);
        }
      });
    } else {
      resolve([]);
    }
  });
};
