'use client';
import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../../store/index.js';
import { ThemeProvider } from './ThemeProvider.jsx';
import { Toast } from '../ui/Toast.jsx';

export function StoreProvider({ children }) {
  return (
    <Provider store={store}>
      <ThemeProvider>
        {children}
        <Toast />
      </ThemeProvider>
    </Provider>
  );
}
