import React, { JSX } from "react";
import { useAppSelector } from "../../app/hooks";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

export const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const  accessToken  = useAppSelector((state) => state.patientAuth.auth.accessToken);
  return accessToken ? children : <Navigate to="/login" />;
};
