import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';

export function AuthPage() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm p-6 bg-white rounded shadow">
        <h1 className="text-xl font-bold mb-4 text-center">Writing Service</h1>
        <div className="flex mb-4 border-b">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 pb-2 text-center ${
              tab === 'login' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-500'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab('signup')}
            className={`flex-1 pb-2 text-center ${
              tab === 'signup' ? 'border-b-2 border-blue-600 font-semibold' : 'text-gray-500'
            }`}
          >
            Sign Up
          </button>
        </div>
        {tab === 'login' ? <LoginForm /> : <SignupForm />}
      </div>
    </div>
  );
}
