// src/Context.js
import React, { createContext, useState } from "react";
import { handleLogin } from "./functions/login";
import { getToken, deleteToken, parseJwt } from "./functions/token";
import { handleSignup } from "./functions/signup";

export const Context = createContext();

// Resolve the auth state from a stored token synchronously, so the first
// render already reflects the logged-in user. Doing this in an effect instead
// caused a refresh to briefly render as logged-out, bouncing the user to
// /login and then to their default landing page (losing the current route).
const resolveStoredAuth = () => {
  const storedToken = getToken();
  if (storedToken) {
    const decodedToken = parseJwt(storedToken);
    if (decodedToken) {
      const authority = decodedToken.authorities?.[0]?.authority;
      return {
        isLoggedIn: true,
        accountType: authority || "Unknown",
        accountState: "Enabled",
      };
    }
  }
  return { isLoggedIn: false, accountType: "Unknown", accountState: "Unknown" };
};

export const ContextProvider = ({ children }) => {
  const initialAuth = resolveStoredAuth();
  const [isLoggedIn, setIsLoggedIn] = useState(initialAuth.isLoggedIn);
  const [accountType, setAccountType] = useState(initialAuth.accountType);
  const [accountState, setAccountState] = useState(initialAuth.accountState);
  const [userEmail, setUserEmail] = useState("");
  const [userPhone, setUserPhone] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const triggerLogIn = (username, password) => {
    handleLogin(
      setIsLoggedIn,
      setAccountType,
      setAccountState,
      setPhoneVerified,
      setEmailVerified,
      username,
      password
    );
  };

  const triggerLogOut = () => {
    setIsLoggedIn(false);
    setAccountType("Unknown");
    setAccountState("Unknown");
    setUserEmail("");
    setUserPhone("");
    setEmailVerified(false);
    setPhoneVerified(false);
    deleteToken();
  };

  const triggerSignUp = (data, accountType) => {
    handleSignup(
      data,
      accountType,
      setAccountType,
      setAccountState,
      setIsLoggedIn
    );
    setUserEmail(data.email);
    setUserPhone(data.phoneNumber);
    if (accountState !== "Enabled") {
      setEmailVerified(false);
      setPhoneVerified(false);
    }
  };

  return (
    <Context.Provider
      value={{
        isLoggedIn,
        triggerLogIn,
        triggerLogOut,
        accountType,
        accountState,
        triggerSignUp,
        userEmail,
        setUserEmail,
        userPhone,
        setUserPhone,
        setIsLoggedIn,
        emailVerified,
        setEmailVerified,
        phoneVerified,
        setPhoneVerified,
        setAccountState,
      }}
    >
      {children}
    </Context.Provider>
  );
};
