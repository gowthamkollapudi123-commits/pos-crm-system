# UI Components Documentation

This directory contains custom UI components built with shadcn/ui principles, integrated with React Hook Form and Zod validation.

## Components

### Base Components

- **Input** - Text input with error display and accessibility
- **Select** - Custom dropdown select (replaces native HTML select)
- **DatePicker** - Date input with calendar icon
- **FileUpload** - File upload with drag-and-drop, validation, and preview
- **Textarea** - Multi-line text input
- **Label** - Form label with required indicator
- **Button** - Button component with variants

### Overlay Components

- **Modal** - Custom modal dialog with focus trap and escape key handling
- **Dropdown** - Custom dropdown menu with keyboard navigation
- **Tooltip** - Custom tooltip with keyboard accessibility

### React Hook Form Integration

- **FormInput** - Input integrated with React Hook Form
- **FormSelect** - Select integrated with React Hook Form
- **FormDatePicker** - DatePicker integrated with React Hook Form
- **FormFileUpload** - FileUpload integrated with React Hook Form
- **FormTextarea** - Textarea integrated with React Hook Form

## Usage Examples

### Modal Component

The Modal component provides a dialog overlay with focus trap, escape key handling, and accessibility features.

```tsx
import { useState } from 'react';
import { Modal, Button } from '@/components/ui';

export function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Modal Title"
        description="Optional description"
        size="md" // sm, md, lg, xl
        showCloseButton={true}
        closeOnOverlayClick={true}
        closeOnEscape={true}
        footer={
          <>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => console.log('Confirmed')}>
              Confirm
            </Button>
          </>
        }
      >
        <p>Modal content goes here</p>
      </Modal>
    </>
  );
}
```

**Features:**
- Focus trap - keeps focus within modal
- Escape key handling - closes modal on Esc
- Overlay click handling - optional close on backdrop click
- Customizable size (sm, md, lg, xl)
- Optional header and footer
- Prevents body scroll when open
- Restores focus to trigger element on close

### Dropdown Component

The Dropdown component provides a menu with keyboard navigation and accessibility.

```tsx
import { Dropdown, Button } from '@/components/ui';
import { Settings, User, LogOut } from 'lucide-react';

export function MyComponent() {
  const items = [
    {
      label: 'Profile',
      value: 'profile',
      icon: <User className="h-4 w-4" />,
      onClick: () => console.log('Profile clicked'),
    },
    {
      label: 'Settings',
      value: 'settings',
      icon: <Settings className="h-4 w-4" />,
      disabled: false,
    },
    {
      label: 'Divider',
      value: 'divider-1',
      divider: true, // Renders a divider line
    },
    {
      label: 'Logout',
      value: 'logout',
      icon: <LogOut className="h-4 w-4" />,
    },
  ];

  return (
    <Dropdown
      trigger={<Button>Menu</Button>}
      items={items}
      align="left" // left or right
      onItemSelect={(value) => console.log('Selected:', value)}
    />
  );
}
```

**Features:**
- Keyboard navigation (Arrow keys, Enter, Space, Escape, Home, End)
- Click outside to close
- Optional icons for menu items
- Divider support
- Disabled items
- Left or right alignment
- Full ARIA support

### Tooltip Component

The Tooltip component provides contextual information on hover or focus.

```tsx
import { Tooltip, Button } from '@/components/ui';
import { Info } from 'lucide-react';

export function MyComponent() {
  return (
    <div className="flex gap-4">
      {/* Basic tooltip */}
      <Tooltip content="This is a tooltip" position="top">
        <Button>Hover me</Button>
      </Tooltip>

      {/* Icon with tooltip */}
      <Tooltip content="Additional information" position="right">
        <button className="text-gray-400 hover:text-gray-600">
          <Info className="h-4 w-4" />
        </button>
      </Tooltip>

      {/* Complex content */}
      <Tooltip
        content={
          <div>
            <p className="font-semibold">Title</p>
            <p className="text-xs">Description text</p>
          </div>
        }
        position="bottom"
        delay={300}
      >
        <Button>Complex tooltip</Button>
      </Tooltip>
    </div>
  );
}
```

**Features:**
- Four positions: top, bottom, left, right
- Customizable delay (default 200ms)
- Keyboard accessible (shows on focus)
- Arrow indicator
- Supports complex content (React nodes)
- Auto-positioning with arrow

### Basic Form with React Hook Form

```tsx
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput, FormSelect, FormDatePicker, Button } from '@/components/ui';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'manager', 'staff']),
  startDate: z.string().min(1, 'Start date is required'),
});

type FormData = z.infer<typeof formSchema>;

export function UserForm() {
  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'staff',
      startDate: '',
    },
  });

  const onSubmit = (data: FormData) => {
    console.log(data);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
        <FormInput
          name="name"
          label="Full Name"
          placeholder="Enter your name"
          required
        />

        <FormInput
          name="email"
          type="email"
          label="Email Address"
          placeholder="you@example.com"
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
          required
        />

        <FormDatePicker
          name="startDate"
          label="Start Date"
          required
        />

        <Button type="submit">Submit</Button>
      </form>
    </FormProvider>
  );
}
```

### File Upload Example

```tsx
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormFileUpload, Button } from '@/components/ui';
import { ALLOWED_FILE_TYPES } from '@/utils/file-validation';

const formSchema = z.object({
  csvFile: z.array(z.instanceof(File)).min(1, 'Please select a file'),
});

type FormData = z.infer<typeof formSchema>;

export function ImportForm() {
  const methods = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (data: FormData) => {
    console.log('Files:', data.csvFile);
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
        <FormFileUpload
          name="csvFile"
          label="Import CSV File"
          helperText="Upload a CSV file (max 10MB)"
          allowedTypes={ALLOWED_FILE_TYPES.csv}
          maxSize={10 * 1024 * 1024}
          accept=".csv"
          required
        />

        <Button type="submit">Import</Button>
      </form>
    </FormProvider>
  );
}
```

### Standalone Components (without React Hook Form)

```tsx
import { useState } from 'react';
import { Input, Select, DatePicker, Button } from '@/components/ui';

export function SimpleForm() {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [date, setDate] = useState('');

  return (
    <form className="space-y-4">
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter name"
      />

      <Select
        label="Role"
        value={role}
        onChange={setRole}
        options={[
          { value: 'admin', label: 'Admin' },
          { value: 'user', label: 'User' },
        ]}
        placeholder="Select a role"
      />

      <DatePicker
        label="Date"
        value={date}
        onDateChange={setDate}
      />

      <Button type="submit">Submit</Button>
    </form>
  );
}
```

## Accessibility Features

All components include:

- **ARIA labels and roles** - Proper semantic HTML and ARIA attributes
- **Keyboard navigation** - Full keyboard support (Tab, Enter, Space, Escape)
- **Focus indicators** - Visible focus rings for keyboard users
- **Error announcements** - Screen reader announcements for validation errors
- **Required field indicators** - Visual and semantic indication of required fields
- **Descriptive labels** - Associated labels with form controls

## Requirements Satisfied

- **18.1** - Custom Select component (no native HTML select)
- **18.2** - Custom Modal component (no native browser alert/confirm)
- **18.3** - Custom DatePicker component (no native HTML date input)
- **18.4** - Custom Select with shadcn/ui styling
- **18.5** - Custom Modal with shadcn/ui styling
- **18.6** - Custom DatePicker with shadcn/ui styling
- **18.7** - Custom Dropdown component
- **18.8** - Custom Tooltip component
- **18.9** - Custom FileUpload component with validation
- **18.13** - Custom Form Input components
- **18.14** - ARIA labels on all components
- **18.15** - Keyboard navigation support
- **26.1** - ARIA labels and roles
- **26.2** - Full keyboard navigation
- **26.3** - Visible focus indicators
- **26.8** - Error messages associated with form fields

## Integration with Existing Code

These components integrate seamlessly with:

- **Zod schemas** in `types/forms.ts`
- **File validation utilities** in `utils/file-validation.ts`
- **React Hook Form** for form state management
- **Tailwind CSS** for styling
