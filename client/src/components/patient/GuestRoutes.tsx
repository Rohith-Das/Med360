import React, { JSX } from "react";
import { Navigate } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";

export const GuestRoute = ({ children }: { children: JSX.Element }) => {
  const accessToken = useAppSelector((state) => state.patientAuth.auth.accessToken);

  return accessToken ? <Navigate to="/home" /> : children;
};
