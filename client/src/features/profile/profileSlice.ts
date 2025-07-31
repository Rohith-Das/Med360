import { createSlice } from "@reduxjs/toolkit";
import { fetchProfile,updateProfile,uploadProfilePicture,removeProfilePicture } from "./profileThunks";

type Gender = 'male' | 'female' | '';

interface ProfileState {
  data: {
    id: string;
    name: string;
    email: string;
    mobile: string;
    gender?: Gender;
    dateOfBirth?: string;
    address?: string;
    profilePicture?: string;
  } | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  data: null,
  loading: false,
  error: null,
};

const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    clearProfile: (state) => {
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch profile";
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        if (state.data) {
          state.data = { ...state.data, ...action.payload };
        }
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update profile";
      })
    .addCase(uploadProfilePicture.pending, (state) => {
    state.loading = true;
    state.error = null;
  })
  .addCase(uploadProfilePicture.fulfilled, (state, action) => {
    state.loading = false;
    if (state.data) {
      state.data.profilePicture = action.payload.profilePicture;
    }
  })
  .addCase(uploadProfilePicture.rejected, (state, action) => {
    state.loading = false;
    state.error = action.error.message || "Failed to upload profile picture";
  })
  .addCase(removeProfilePicture.pending, (state) => {
    state.loading = true;
    state.error = null;
  })
  .addCase(removeProfilePicture.fulfilled, (state) => {
    state.loading = false;
    if (state.data) {
      state.data.profilePicture = undefined;
    }
  })
  .addCase(removeProfilePicture.rejected, (state, action) => {
    state.loading = false;
    state.error = action.error.message || "Failed to remove profile picture";
  });
      
  },
});

export const { clearProfile } = profileSlice.actions;
export default profileSlice.reducer;
