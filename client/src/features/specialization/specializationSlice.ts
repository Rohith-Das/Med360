// client/src/features/specialization/specializationSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import adminAxiosInstance from "@/api/adminAxiosInstance";
interface Specialization {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
}

interface SpecializationState {
  specializations: Specialization[];
  loading: boolean;
  error: string | null;
}

const initialState: SpecializationState = {
  specializations: [],
  loading: false,
  error: null
};

export const fetchSpecializations = createAsyncThunk(
  "specialization/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await adminAxiosInstance.get("/admin/specializations");
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch specializations");
    }
  }
);

export const createSpecialization = createAsyncThunk(
  "specialization/create",
  async (data: FormData, { rejectWithValue }) => {
    try {
      const response = await adminAxiosInstance.post("/admin/specializations", data, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to create specialization");
    }
  }
);

export const updateSpecialization = createAsyncThunk(
  "specialization/update",
  async ({ id, data }: { id: string; data: FormData }, { rejectWithValue }) => {
    try {
      const response = await adminAxiosInstance.put(`/admin/specializations/${id}`, data, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to update specialization");
    }
  }
);

export const deleteSpecialization = createAsyncThunk(
  "specialization/delete",
  async (id: string, { rejectWithValue }) => {
    try {
      await adminAxiosInstance.delete(`/admin/specializations/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete specialization");
    }
  }
);

const specializationSlice = createSlice({
  name: "specialization",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSpecializations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSpecializations.fulfilled, (state, action) => {
        state.loading = false;
        state.specializations = action.payload;
      })
      .addCase(fetchSpecializations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createSpecialization.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSpecialization.fulfilled, (state, action) => {
        state.loading = false;
        state.specializations.push(action.payload);
      })
      .addCase(createSpecialization.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateSpecialization.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSpecialization.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.specializations.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.specializations[index] = action.payload;
        }
      })
      .addCase(updateSpecialization.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteSpecialization.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSpecialization.fulfilled, (state, action) => {
        state.loading = false;
        state.specializations = state.specializations.filter(s => s.id !== action.payload);
      })
      .addCase(deleteSpecialization.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

export default specializationSlice.reducer;