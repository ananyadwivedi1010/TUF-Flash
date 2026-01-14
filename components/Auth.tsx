
import React, { useState } from 'react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    onLogin({
      name: name || email.split('@')[0],
      email: email,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name || email}`
    });
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6 font-['Inter'] relative z-50">
      <div className="w-full max-w-md space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="text-center space-y-2">
          <span className="text-red-700 font-black italic text-5xl tracking-tighter block mb-2">⚡TUF-FLASH</span>
          <p className="text-gray-500 font-medium tracking-wide">ELITE DSA TRACKER</p>
        </div>

        <div className="bg-[#0A0A0A] border border-white/10 rounded-[3rem] p-10 shadow-2xl shadow-red-900/5">
          <h2 className="text-2xl font-black text-white mb-8 text-center uppercase tracking-tight">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-red-500 outline-none transition placeholder-gray-700 font-bold"
              />
            )}
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-red-500 outline-none transition placeholder-gray-700 font-bold"
              required
            />
            <button type="submit" className="w-full py-5 bg-[#A91D3A] rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest">
              {isLogin ? 'Log In' : 'Sign Up'}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-500 text-xs font-bold uppercase tracking-widest">
            {isLogin ? "New Learner?" : "Already Practicing?"}{' '}
            <button onClick={() => setIsLogin(!isLogin)} className="text-red-500 font-black hover:underline">
              {isLogin ? 'Register' : 'Access'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
