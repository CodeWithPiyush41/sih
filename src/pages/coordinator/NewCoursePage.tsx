import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DashboardLayout } from '@/components/DashboardLayout';
import { Button } from '@/components/Button';
import { Input, Textarea } from '@/components/Input';

const schema = z.object({
  name: z.string().min(3, 'Course name must be at least 3 characters').max(80, 'Course name must be 80 characters or less'),
  description: z.string().max(300, 'Description must be 300 characters or less'),
});

type FormData = z.infer<typeof schema>;

export function NewCoursePage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', description: '' },
  });

  const onSubmit = (_data: FormData) => {
    // Mock: redirect to the upload page for the first course
    // In a real app, this would create the course and get a new ID
    navigate('/teacher/courses/c1/upload');
  };

  return (
    <DashboardLayout role="teacher">
      <h1 className="text-h1 text-ink mb-1">New course</h1>
      <p className="text-body text-ink-muted mb-8">
        Create a course, then upload material to extract topics.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-md flex flex-col gap-5">
        <Input
          label="Course name"
          placeholder="e.g. Introduction to Python"
          error={errors.name?.message}
          {...register('name')}
        />
        <Textarea
          label="Description"
          placeholder="What will students learn in this course?"
          rows={4}
          error={errors.description?.message}
          {...register('description')}
        />
        <div className="flex items-center gap-3">
          <Button type="submit">Create course</Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/teacher')}>
            Cancel
          </Button>
        </div>
      </form>
    </DashboardLayout>
  );
}
