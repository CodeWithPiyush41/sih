import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/lib/auth/AuthContext';
import type { Role } from '@/lib/types';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

function detectRoleFromEmail(email: string): Role {
  const clean = email.trim().toLowerCase();
  if (
    clean.endsWith('@trainer.org') ||
    clean.endsWith('@tranner.org') ||
    clean.includes('trainer') ||
    clean.includes('coordinator')
  ) {
    return 'teacher';
  }
  return 'student';
}

export function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const onSubmit = async (data: FormData) => {
    setAuthError(null);
    setSubmitting(true);
    const derivedRole = detectRoleFromEmail(data.email);
    const { error, role } = await signUp(data.email, data.password, data.name, derivedRole);
    setSubmitting(false);

    if (error) {
      setAuthError(error);
      return;
    }

    if (role === 'teacher') {
      navigate('/teacher');
    } else {
      navigate('/student');
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="flex items-center gap-2 px-8 py-6">
        <GraduationCap size={20} strokeWidth={1.5} className="text-primary" />
        <span className="text-h3 text-ink">SkillLens AI</span>
      </div>
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h1 className="text-display text-ink mb-2">Create account</h1>
          <p className="text-body text-ink-muted mb-8">
            SkillLens AI Competency System for Official Statistics.
          </p>
          {authError && (
            <div className="p-3 mb-4 rounded bg-red-500/10 border border-red-500/20 text-caption text-danger">
              {authError}
            </div>
          )}
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Full name"
              placeholder="Official Full Name"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Official Email"
              type="email"
              placeholder="Enter official email"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              autoComplete="new-password"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
          <p className="text-body-sm text-ink-muted mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

