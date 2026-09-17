import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['teacher', 'student'], { message: 'Select a role' }),
});

type FormData = z.infer<typeof schema>;

export function SignupPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
      defaultValues: { name: '', email: '', password: '', role: 'student' },
  });

  const onSubmit = (data: FormData) => {
    if (data.role === 'teacher') {
      navigate('/teacher');
    } else {
      navigate('/student');
    }
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <div className="flex items-center gap-2 px-8 py-6">
        <GraduationCap size={20} strokeWidth={1.5} className="text-signal" />
        <span className="text-h3 text-ink">SkillLens AI</span>
      </div>
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <h1 className="text-display text-ink mb-2">Create account</h1>
          <p className="text-body text-ink-muted mb-8">
            Competency intelligence for schools and colleges.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Full name"
              placeholder="Your name"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@school.edu"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="At least 6 characters"
              error={errors.password?.message}
              {...register('password')}
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="role" className="text-caption text-ink-secondary">
                I am a
              </label>
              <select
                id="role"
                {...register('role')}
                className="w-full bg-surface border border-border rounded-btn px-3 py-2 text-body text-ink cursor-pointer focus:border-signal"
              >
                <option value="student">Student</option>
                <option value="teacher">Teacher</option>
              </select>
              {errors.role && (
                <p className="text-caption text-danger">{errors.role.message}</p>
              )}
            </div>
            <Button type="submit">Create account</Button>
          </form>
          <p className="text-body-sm text-ink-muted mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-signal hover:text-signal-hover">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
