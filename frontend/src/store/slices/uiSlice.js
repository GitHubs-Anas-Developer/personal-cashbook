import { createSlice } from '@reduxjs/toolkit';

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('cashbook_theme') || 'system';
  }
  return 'system';
};

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: getInitialTheme(),
    isSidebarOpen: false,
    toast: null // { type: 'success' | 'error' | 'info', message: string }
  },
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem('cashbook_theme', action.payload);
      }
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen: (state, action) => {
      state.isSidebarOpen = action.payload;
    },
    showToast: (state, action) => {
      state.toast = action.payload;
    },
    clearToast: (state) => {
      state.toast = null;
    }
  }
});

export const { setTheme, toggleSidebar, setSidebarOpen, showToast, clearToast } = uiSlice.actions;
export default uiSlice.reducer;
