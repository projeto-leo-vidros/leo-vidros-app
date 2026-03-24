import { createContext, useContext, useState, useCallback } from "react";
import DefaultAvatar from "../assets/Avatar.jpg";

const UserContext = createContext(null);

function readInitialState() {
  const id =
    sessionStorage.getItem("userId") ?? localStorage.getItem("userId") ?? null;
  const name =
    sessionStorage.getItem("userName") ??
    localStorage.getItem("userName") ??
    "";
  const email =
    sessionStorage.getItem("userEmail") ??
    localStorage.getItem("userEmail") ??
    "";
  const isAuthenticated = sessionStorage.getItem("isAuthenticated") === "true";
  const photo = id
    ? (localStorage.getItem(`leoVidros_userPhoto_${id}`) ?? null)
    : null;

  return { id, name, email, isAuthenticated, photo };
}

export function UserProvider({ children }) {
  const [user, setUser] = useState(readInitialState);

  const login = useCallback(({ id, nome, email, firstLogin }) => {
    sessionStorage.setItem("isAuthenticated", "true");
    sessionStorage.setItem("userId", String(id));
    sessionStorage.setItem("userName", nome);
    sessionStorage.setItem("userEmail", email);
    sessionStorage.setItem("userFirstLogin", String(firstLogin));
    localStorage.setItem("userName", nome);
    localStorage.setItem("userFirstLogin", String(firstLogin));

    const photo = localStorage.getItem(`leoVidros_userPhoto_${id}`) ?? null;
    setUser({
      id: String(id),
      name: nome,
      email,
      isAuthenticated: true,
      photo,
    });
  }, []);

  const logout = useCallback(() => {
    sessionStorage.clear();
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    setUser({
      id: null,
      name: "",
      email: "",
      isAuthenticated: false,
      photo: null,
    });
  }, []);

  const updatePhoto = useCallback((base64) => {
    setUser((prev) => {
      if (prev.id) {
        localStorage.setItem(`leoVidros_userPhoto_${prev.id}`, base64);
      }
      return { ...prev, photo: base64 };
    });
  }, []);

  const clearPhoto = useCallback(() => {
    setUser((prev) => {
      if (prev.id) {
        localStorage.removeItem(`leoVidros_userPhoto_${prev.id}`);
      }
      return { ...prev, photo: null };
    });
  }, []);

  const updateUser = useCallback((fields) => {
    setUser((prev) => {
      const updated = { ...prev, ...fields };
      if (fields.name !== undefined) {
        sessionStorage.setItem("userName", fields.name);
        localStorage.setItem("userName", fields.name);
      }
      if (fields.email !== undefined) {
        sessionStorage.setItem("userEmail", fields.email);
      }
      return updated;
    });
  }, []);

  return (
    <UserContext.Provider
      value={{
        user,
        login,
        logout,
        updatePhoto,
        clearPhoto,
        updateUser,
        DefaultAvatar,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser() deve ser usado dentro de <UserProvider>");
  }
  return ctx;
}
