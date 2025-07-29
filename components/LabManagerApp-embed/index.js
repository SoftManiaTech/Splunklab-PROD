import React from "react";
import ReactDOM from "react-dom/client";
import App from "./LabManagerClient";
import './index.css';
import { GoogleOAuthProvider } from "@react-oauth/google";

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <GoogleOAuthProvider>
    <App />
  </GoogleOAuthProvider>
);
