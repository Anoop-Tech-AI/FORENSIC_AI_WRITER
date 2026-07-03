import React from "react";
import "./auth.css";
import bgImage from "../assets/auth/auth-bg.png";

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-container">
      
      {/* LEFT IMAGE */}
      <div className="auth-left">
        <img src={bgImage} alt="forensic" />
      </div>

      {/* RIGHT CONTENT */}
      <div className="auth-right">
        {children}
      </div>

    </div>
  );
};

export default AuthLayout;
