import { LoginForm } from './LoginForm';

export function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm p-6 bg-white rounded shadow">
        <h1 className="text-xl font-bold mb-4 text-center">Writing Service</h1>
        <LoginForm />
      </div>
    </div>
  );
}
