/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Form Components Demo Page
 * 
 * Demonstrates the usage of custom form components with React Hook Form
 */

'use client';

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  FormInput,
  FormSelect,
  FormDatePicker,
  FormFileUpload,
  FormTextarea,
  Button,
} from '@/components/ui';
import { ALLOWED_FILE_TYPES } from '@/utils/file-validation';

const demoFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'manager', 'staff'], {
    message: 'Please select a role',
  }),
  startDate: z.string().min(1, 'Start date is required'),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
  avatar: z.array(z.instanceof(File)).optional(),
});

type DemoFormData = z.infer<typeof demoFormSchema>;

export default function FormDemoPage() {
  const methods = useForm<DemoFormData>({
    resolver: zodResolver(demoFormSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'staff',
      startDate: '',
      notes: '',
    },
  });

  const onSubmit = (data: DemoFormData) => {
    console.log('Form submitted:', data);
    alert('Form submitted successfully! Check console for data.');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Form Components Demo
          </h1>
          
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-6">
              <FormInput
                name="name"
                label="Full Name"
                placeholder="Enter your name"
                helperText="Your first and last name"
                required
              />

              <FormInput
                name="email"
                type="email"
                label="Email Address"
                placeholder="you@example.com"
                helperText="We'll never share your email"
                required
              />

              <FormSelect
                name="role"
                label="Role"
                options={[
                  { value: 'admin', label: 'Administrator' },
                  { value: 'manager', label: 'Manager' },
                  { value: 'staff', label: 'Staff' },
                ]}
                placeholder="Select a role"
                helperText="Choose your role in the organization"
                required
              />

              <FormDatePicker
                name="startDate"
                label="Start Date"
                helperText="When will you start?"
                required
              />

              <FormTextarea
                name="notes"
                label="Notes"
                placeholder="Add any additional notes..."
                helperText="Optional notes (max 500 characters)"
                rows={4}
              />

              <FormFileUpload
                name="avatar"
                label="Profile Picture"
                helperText="Upload an image (JPEG, PNG, WebP - max 5MB)"
                allowedTypes={ALLOWED_FILE_TYPES.images}
                maxSize={5 * 1024 * 1024}
                accept="image/*"
              />

              <div className="flex gap-4">
                <Button type="submit">
                  Submit Form
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => methods.reset()}
                >
                  Reset
                </Button>
              </div>
            </form>
          </FormProvider>

          {/* Display form state for debugging */}
          <div className="mt-8 p-4 bg-gray-100 rounded">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">
              Form State (for debugging)
            </h2>
            <pre className="text-xs text-gray-600 overflow-auto">
              {JSON.stringify(methods.watch(), null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
