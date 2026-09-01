import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { LogIn } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Accesso effettuato con successo!');
    } catch (error: any) {
      console.error(error);
      toast.error('Errore durante il login.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center text-[#1e5b99]">
          <LogIn size={48} />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Accesso Operatori
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Accedi con il tuo account Google aziendale
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1e5b99] hover:bg-[#1a4f85] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1e5b99] transition-colors"
          >
            Accedi con Google
          </button>
        </div>
      </div>
    </div>
  );
}
