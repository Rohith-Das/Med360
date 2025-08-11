import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { doctorLoginUser, doctorRefreshToken } from "./doctorAuthThunk";

interface DoctorAuthState {
  doctor: any | null;
  doctorAccessToken: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: DoctorAuthState = {
  doctor: null,
  doctorAccessToken: localStorage.getItem("doctorAccessToken"),
  status: "idle",
  error: null,
  isAuthenticated: !!localStorage.getItem("doctorAccessToken"),
};

const doctorAuthSlice = createSlice({
  name: "doctorAuth",
  initialState,
  reducers: {
    doctorLogout: (state) => {
      state.doctor = null;
      state.doctorAccessToken = null;
      state.status = "idle";
      state.error = null;
      state.isAuthenticated = false;
      localStorage.removeItem("doctorAccessToken");
    },
    setDoctorAccessToken: (state, action: PayloadAction<string>) => {
      state.doctorAccessToken = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem("doctorAccessToken", action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(doctorLoginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(doctorLoginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.doctor = action.payload.doctor;
        state.doctorAccessToken = action.payload.doctorAccessToken;
        state.isAuthenticated = true;
        localStorage.setItem("doctorAccessToken", action.payload.doctorAccessToken);
      })
      .addCase(doctorLoginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Doctor login failed";
        state.isAuthenticated = false;
      })
      .addCase(doctorRefreshToken.fulfilled, (state, action) => {
        state.doctorAccessToken = action.payload.doctorAccessToken;
        state.isAuthenticated = true;
        localStorage.setItem("doctorAccessToken", action.payload.doctorAccessToken);
      })
      .addCase(doctorRefreshToken.rejected, (state) => {
        state.doctor = null;
        state.doctorAccessToken = null;
        state.isAuthenticated = false;
        localStorage.removeItem("doctorAccessToken");
      });
  },
});

export const { doctorLogout, setDoctorAccessToken, clearError } = doctorAuthSlice.actions;
export default doctorAuthSlice.reducer;