import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginForm from '../components/LoginForm';
import { login } from '../services/authService';

jest.mock('../services/authService', () => ({
  login: jest.fn(),
}));

describe('LoginForm Component', () => {
  const mockOnLogin = jest.fn();
  const mockSwitchToRegister = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders email, password inputs, submit button, and switch link', () => {
    render(<LoginForm onLogin={mockOnLogin} switchToRegister={mockSwitchToRegister} />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create one/i })).toBeInTheDocument();
  });

  test('calls onLogin with user data upon successful login', async () => {
    const mockUser = { id: 'u1', name: 'Alice', email: 'alice@example.com' };
    login.mockResolvedValueOnce({ success: true, user: mockUser });

    render(<LoginForm onLogin={mockOnLogin} switchToRegister={mockSwitchToRegister} />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'Secret123!' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith('alice@example.com', 'Secret123!');
    });
    expect(mockOnLogin).toHaveBeenCalledWith(mockUser);
  });

  test('displays error message when login fails', async () => {
    login.mockRejectedValueOnce(new Error('Invalid email or password'));

    render(<LoginForm onLogin={mockOnLogin} switchToRegister={mockSwitchToRegister} />);

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'alice@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
    expect(mockOnLogin).not.toHaveBeenCalled();
  });

  test('calls switchToRegister when switch button is clicked', () => {
    render(<LoginForm onLogin={mockOnLogin} switchToRegister={mockSwitchToRegister} />);

    fireEvent.click(screen.getByRole('button', { name: /create one/i }));
    expect(mockSwitchToRegister).toHaveBeenCalledTimes(1);
  });
});
