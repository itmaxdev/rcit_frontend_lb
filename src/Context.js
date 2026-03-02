// src/Context.js
import React, { createContext, useState, useEffect } from "react";
import { handleLogin } from "./functions/login";
import { getToken, deleteToken, parseJwt } from "./functions/token";
import { handleSignup } from "./functions/signup";

export const Context = createContext();

export const ContextProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [accountType, setAccountType] = useState("Unknown");
  const [accountState, setAccountState] = useState("Unknown");
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

  // Check for token on initial load and set login state
  useEffect(() => {
    const storedToken = getToken();
    if (storedToken) {
      const decodedToken = parseJwt(storedToken);
      if (decodedToken) {
        const authority = decodedToken.authorities?.[0]?.authority;
        if (authority) {
          setAccountType(authority); // Save the authority in state
        }
        setIsLoggedIn(true);
        setAccountState("Enabled");
      }
    }
    // eslint-disable-next-line
  }, []);

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
