// src/App.js
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import OTPVerifyPage from "./pages/OTPVerifyPage";
import ProfilePage from "./pages/ProfilePage";
import StatusPage from "./pages/StatusPage";

import Alert2 from "./sharedComponents/Alert2";

var alertInfo = null

const App = () => {
  const [showAlert, setShowAlert] = useState(false)

  global.alert2 = (title, message, onClick, buttons, options) => {
    alertInfo = {
      title,
      message,
      onClick: (idx) => {
        setShowAlert(false)
        onClick && onClick(idx)
        alertInfo = null
      },
      buttons,
      options
    }
    setShowAlert(true)
  }


  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/otp" element={<OTPVerifyPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/profile/*" element={<ProfilePage />} />
        </Routes>
      </Router>
      {showAlert && alertInfo != null && <Alert2
        title={alertInfo.title}
        message={alertInfo.message}
        buttons={alertInfo.buttons}
        options={alertInfo.options}
        onClick={alertInfo.onClick}
      />}
    </>
  )
}

export default App;
