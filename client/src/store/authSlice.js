import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/client.js';

const storedUser = localStorage.getItem('cryo_erp_user') ? JSON.parse(localStorage.getItem('cryo_erp_user')) : null;
const storedToken = localStorage.getItem('cryo_erp_token') || null;

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', credentials);
    const data = res.data;
    localStorage.setItem('cryo_erp_token', data.token);
    localStorage.setItem('cryo_erp_user', JSON.stringify(data));
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: storedUser,
    token: storedToken,
    loading: false,
    error: null
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('cryo_erp_token');
      localStorage.removeItem('cryo_erp_user');
    },
    switchRoleDemo: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, role: action.payload };
        localStorage.setItem('cryo_erp_user', JSON.stringify(state.user));
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { logout, switchRoleDemo } = authSlice.actions;
export default authSlice.reducer;
