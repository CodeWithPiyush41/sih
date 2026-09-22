import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth/AuthContext';

const schema = z.object({
  email: z.string().email('Enter a valid organization email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: FormData) => {
    setAuthError(null);
    setSubmitting(true);
    
    try {
      const { error, role } = await signIn(data.email, data.password);

      if (error) {
        setAuthError(error);
        return;
      }

      if (role === 'teacher' || role === 'training_coordinator') {
        navigate('/teacher');
      } else if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setAuthError(err.message || 'An unexpected error occurred during sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoAccount = (email: string) => {
    setValue('email', email);
    setValue('password', '123456');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden p-4">
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-md">
          <ShieldCheck size={22} />
        </div>
        <div>
          <span className="text-xl font-bold text-white tracking-tight block">SkillLens AI</span>
          <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Official Statistical System (SIH26101)</span>
        </div>
      </div>

      <div className="w-full max-w-md px-4 relative z-10 space-y-6">
        <div className="bg-white/95 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-slate-200">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Sign in to SkillLens AI</h1>
          <p className="text-xs text-slate-500 mb-4">
            AI Competency Intelligence & Personalized Learning Pathway
          </p>

          {/* Quick Demo Credentials selector */}
          <div className="mb-5 p-3 bg-slate-100/80 border border-slate-200 rounded-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Quick Demo Accounts</span>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => fillDemoAccount('ppanchariya93@officer.org')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-primary text-xs font-semibold shadow-xs"
              >
                Officer
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('trainer@tranner.org')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-primary text-xs font-semibold shadow-xs"
              >
                Coordinator
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('skill@gmail.com')}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-primary text-xs font-semibold shadow-xs"
              >
                Admin
              </button>
            </div>
          </div>

          {authError && (
            <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-600 font-medium leading-relaxed">
              {authError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email</label>
              <input
                type="email"
                placeholder="Enter official email"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 text-sm"
                {...register('email')}
              />
              {errors.email && <p className="text-xs text-rose-500 mt-1">{errors.email.message}</p>}
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 text-sm"
                {...register('password')}
              />
              {errors.password && <p className="text-xs text-rose-500 mt-1">{errors.password.message}</p>}
            </div>

            <Button type="submit" isLoading={submitting} className="mt-2 w-full py-2.5 rounded-xl">
              Sign in with Supabase
            </Button>
          </form>

          <p className="text-xs text-slate-500 mt-6 text-center">
            Need an organization account?{' '}
            <Link to="/signup" className="text-primary hover:underline font-semibold">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
