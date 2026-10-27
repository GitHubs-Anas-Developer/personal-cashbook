import { createSlice } from '@reduxjs/toolkit';

const getInitialState = () => {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('cashbook_user');
    const token = localStorage.getItem('cashbook_token');
    return {
      user: userStr ? JSON.parse(userStr) : null,
      token: token || null,
      isAuthenticated: !!token
    };
  }
  return {
    user: null,
    token: null,
    isAuthenticated: false
  };
};

const authSlice = createSlice({
  name: 'auth',
  initialState: getInitialState(),
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;

      if (typeof window !== 'undefined') {
        if (user) localStorage.setItem('cashbook_user', JSON.stringify(user));
        if (token) localStorage.setItem('cashbook_token', token);
      }
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      if (typeof window !== 'undefined' && state.user) {
        localStorage.setItem('cashbook_user', JSON.stringify(state.user));
      }
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      if (typeof window !== 'undefined') {
        localStorage.removeItem('cashbook_user');
        localStorage.removeItem('cashbook_token');
      }
    }
  }
});

export const { setCredentials, updateUser, logout } = authSlice.actions;
export default authSlice.reducer;
