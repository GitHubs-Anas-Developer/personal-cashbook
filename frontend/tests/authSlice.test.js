import { describe, it, expect } from 'vitest';
import authReducer, { setCredentials, updateUser, logout } from '../src/store/slices/authSlice.js';

describe('Redux authSlice', () => {
  const initialState = {
    user: null,
    token: null,
    isAuthenticated: false
  };

  it('sets user credentials on successful login/registration', () => {
    const user = { name: 'Sunita Rao', email: 'sunita@example.com' };
    const token = 'sample_test_jwt_token';
    const nextState = authReducer(initialState, setCredentials({ user, token }));

    expect(nextState.isAuthenticated).toBe(true);
    expect(nextState.user.name).toBe('Sunita Rao');
    expect(nextState.token).toBe('sample_test_jwt_token');
  });

  it('updates user profile details', () => {
    const loggedInState = {
      user: { name: 'Sunita Rao', preferences: { currency: 'INR' } },
      token: 'jwt',
      isAuthenticated: true
    };

    const nextState = authReducer(
      loggedInState,
      updateUser({ preferences: { currency: 'USD' } })
    );

    expect(nextState.user.preferences.currency).toBe('USD');
  });

  it('clears credentials on logout', () => {
    const loggedInState = {
      user: { name: 'Sunita Rao' },
      token: 'jwt',
      isAuthenticated: true
    };

    const nextState = authReducer(loggedInState, logout());
    expect(nextState.isAuthenticated).toBe(false);
    expect(nextState.user).toBeNull();
    expect(nextState.token).toBeNull();
  });
});
