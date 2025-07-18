import { createSlice,PayloadAction } from "@reduxjs/toolkit";
import { adminLoginUser,adminRefreshToken } from "./adminAuthThunk";

interface AdminAuthState {
  admin: any | null;
  adminAccessToken: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: AdminAuthState = {
  admin: null,
  adminAccessToken: localStorage.getItem("adminAccessToken"),
  status: "idle",
  error: null,
};
const adminAuthSlice = createSlice({
  name: "adminAuth",
  initialState,
  reducers: {
    adminLogout: (state) => {
      state.admin = null;
      state.adminAccessToken = null;
      state.status = "idle";
      state.error = null;
      localStorage.removeItem("adminAccessToken");
    },
    setAdminAccessToken: (state, action: PayloadAction<string>) => {
      state.adminAccessToken = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(adminLoginUser.pending, (state) => {
        state.status = "loading";
      })
      .addCase(adminLoginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.admin = action.payload.admin;
        state.adminAccessToken = action.payload.adminAccessToken;
        localStorage.setItem("adminAccessToken", action.payload.adminAccessToken);
      })
      .addCase(adminLoginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Admin login failed";
      })
      .addCase(adminRefreshToken.fulfilled, (state, action) => {
        state.adminAccessToken = action.payload.adminAccessToken;
        localStorage.setItem("adminAccessToken", action.payload.adminAccessToken);
      });
  },
});

export const { adminLogout, setAdminAccessToken } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;