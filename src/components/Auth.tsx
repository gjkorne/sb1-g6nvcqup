import React, { useState } from 'react';
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom'; // Assuming you're using React Router

interface AuthError {
  message: string;
}

interface AuthProps {
  redirectTo?: string; // Path to redirect to after successful auth
}

export default function Auth({ redirectTo = '/' }: AuthProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' | 'info' } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [resetPassword, setResetPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0); // 0-100
  const [loginAttempts, setLoginAttempts] = useState(0);
  
  const navigate = useNavigate();

  // Email validation regex
  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  };

  // Password strength checker
  const checkPasswordStrength = (password: string) => {
    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 25;
    else if (password.length >= 6) score += 10;
    
    // Complexity checks
    if (/[A-Z]/.test(password)) score += 20; // Has uppercase
    if (/[a-z]/.test(password)) score += 15; // Has lowercase
    if (/[0-9]/.test(password)) score += 20; // Has number
    if (/[^A-Za-z0-9]/.test(password)) score += 20; // Has special char
    
    setPasswordStrength(score);
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      setMessage({ text: 'Please enter a valid email address', type: 'error' });
      return;
    }
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      setMessage({ 
        text: 'Password reset instructions have been sent to your email', 
        type: 'success' 
      });
      
      // Reset UI state
      setResetPassword(false);
      
    } catch (err) {
      const error = err as AuthError;
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Rate limiting
    if (loginAttempts >= 5) {
      setMessage({ 
        text: 'Too many login attempts. Please try again later.', 
        type: 'error' 
      });
      setLoading(false);
      return;
    }

    try {
      // Email validation
      if (!validateEmail(email)) {
        throw new Error('Please enter a valid email address');
      }
      
      // Password validation
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      if (isSignUp) {
        // Additional password strength check for new accounts
        if (passwordStrength < 50) {
          throw new Error('Please use a stronger password (include uppercase, numbers, and special characters)');
        }
        
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        
        if (error) throw error;
        
        setMessage({ 
          text: 'Account created! Check your email for the confirmation link.', 
          type: 'success' 
        });
        return;
        
      } else {
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        // On successful login, redirect
        if (data?.user) {
          // Reset attempts counter on successful login
          setLoginAttempts(0);
          navigate(redirectTo);
        }
      }
    } catch (err) {
      const error = err as AuthError;
      
      // Increment login attempts for failed logins
      if (!isSignUp) {
        setLoginAttempts(prev => prev + 1);
      }
      
      // Custom error messages based on Supabase error types
      if (error.message.includes('Invalid login credentials')) {
        setMessage({ text: 'Invalid email or password. Please try again.', type: 'error' });
      } else if (error.message.includes('Email not confirmed')) {
        setMessage({ text: 'Please confirm your email address before signing in.', type: 'error' });
      } else if (error.message.includes('Password should be')) {
        setMessage({ text: 'Password is too weak. Please use a stronger password.', type: 'error' });
      } else {
        setMessage({ text: error.message, type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle password input changes
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (isSignUp) {
      checkPasswordStrength(newPassword);
    }
  };

  if (resetPassword) {
    return (
      <div className="w-full max-w-md mx-auto p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Reset your password</h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        {message && (
          <div className={`flex items-center gap-2 text-sm p-3 rounded ${
            message.type === 'success' ? 'bg-green-50 text-green-700' :
            message.type === 'info' ? 'bg-blue-50 text-blue-700' :
            'bg-red-50 text-red-700'
          }`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handlePasswordReset} className="space-y-6">
          <div>
            <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="reset-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
                disabled={loading}
                placeholder="you@example.com"
                aria-describedby="email-description"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Sending reset link...</span>
                </>
              ) : (
                'Send reset link'
              )}
            </button>
            
            <button
              type="button"
              onClick={() => setResetPassword(false)}
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              Back to sign in
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setMessage(null);
              setPassword('');
              setPasswordStrength(0);
            }}
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </button>
        </p>
      </div>

      {message && (
        <div className={`flex items-center gap-2 text-sm p-3 rounded ${
          message.type === 'success' ? 'bg-green-50 text-green-700' :
          message.type === 'info' ? 'bg-blue-50 text-blue-700' :
          'bg-red-50 text-red-700'
        }`}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email address
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
              disabled={loading}
              placeholder="you@example.com"
              aria-invalid={message?.text.includes('email') ? 'true' : 'false'}
              aria-describedby="email-description"
            />
          </div>
          <p id="email-description" className="mt-1 text-xs text-gray-500">
            {isSignUp ? 'We\'ll send a confirmation link to this address' : ''}
          </p>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Password
          </label>
          <div className="mt-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete={isSignUp ? "new-password" : "current-password"}
              value={password}
              onChange={handlePasswordChange}
              className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50 disabled:text-gray-500"
              disabled={loading}
              placeholder="••••••••"
              minLength={6}
              aria-invalid={message?.text.includes('password') ? 'true' : 'false'}
              aria-describedby="password-description"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
              ) : (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" />
              )}
            </button>
          </div>
          
          {isSignUp && (
            <>
              <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    passwordStrength >= 80 ? 'bg-green-500' : 
                    passwordStrength >= 50 ? 'bg-yellow-500' : 
                    passwordStrength >= 30 ? 'bg-orange-500' : 
                    'bg-red-500'
                  }`} 
                  style={{ width: `${passwordStrength}%` }}
                  role="progressbar"
                  aria-valuenow={passwordStrength}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <p id="password-description" className="mt-1 text-xs text-gray-500">
                Password strength: {
                  passwordStrength >= 80 ? 'Strong' : 
                  passwordStrength >= 50 ? 'Good' : 
                  passwordStrength >= 30 ? 'Fair' : 
                  'Weak'
                }
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Include uppercase letters, numbers, and special characters for a stronger password
              </p>
            </>
          )}
          
          {!isSignUp && (
            <p className="mt-1 text-right">
              <button
                type="button"
                onClick={() => setResetPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Forgot password?
              </button>
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || (isSignUp && passwordStrength < 30)}
          className="w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-busy={loading}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>{isSignUp ? 'Creating account...' : 'Signing in...'}</span>
            </>
          ) : isSignUp ? (
            'Sign up'
          ) : (
            'Sign in'
          )}
        </button>
      </form>
    </div>
  );
}