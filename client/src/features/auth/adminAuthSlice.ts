import { createSlice,PayloadAction } from "@reduxjs/toolkit";
import { adminLoginUser,adminRefreshToken } from "./adminAuthThunk";

interface AdminAuthState {
  admin: any | null;
  adminAccessToken: string | null;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AdminAuthState = {
  admin: null,
  adminAccessToken: localStorage.getItem("adminAccessToken"),
  status: "idle",
  error: null,
  isAuthenticated: !!localStorage.getItem("adminAccessToken"),
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
      state.isAuthenticated = false;
      localStorage.removeItem("adminAccessToken");
    },
    setAdminAccessToken: (state, action: PayloadAction<string>) => {
      state.adminAccessToken = action.payload;
      state.isAuthenticated = true;
      localStorage.setItem("adminAccessToken", action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(adminLoginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(adminLoginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.admin = action.payload.admin;
        state.adminAccessToken = action.payload.adminAccessToken;
        state.isAuthenticated = true;
        localStorage.setItem("adminAccessToken", action.payload.adminAccessToken);
      })
      .addCase(adminLoginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || "Admin login failed";
        state.isAuthenticated = false;
      })
      .addCase(adminRefreshToken.fulfilled, (state, action) => {
        state.adminAccessToken = action.payload.adminAccessToken;
        state.isAuthenticated = true;
        localStorage.setItem("adminAccessToken", action.payload.adminAccessToken);
      })
      .addCase(adminRefreshToken.rejected, (state) => {
        // Token refresh failed, logout user
        state.admin = null;
        state.adminAccessToken = null;
        state.isAuthenticated = false;
        localStorage.removeItem("adminAccessToken");
      });
  },
});

export const { adminLogout, setAdminAccessToken,clearError } = adminAuthSlice.actions;
export default adminAuthSlice.reducer;