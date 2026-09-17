import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data: FormData) => {
    // Mock: route teacher to /teacher, student to /student
    if (data.email.startsWith('teacher')) {
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
          <h1 className="text-display text-ink mb-2">Sign in</h1>
          <p className="text-body text-ink-muted mb-8">
            Use any email starting with "teacher" for the teacher view, or anything else for the student view.
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
              placeholder="Your password"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit">Sign in</Button>
          </form>
          <p className="text-body-sm text-ink-muted mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-signal hover:text-signal-hover">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
