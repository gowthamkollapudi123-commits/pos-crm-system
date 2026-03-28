# Overlay Components Documentation

This document provides detailed information about the Modal, Dropdown, and Tooltip components.

## Overview

The overlay components (Modal, Dropdown, Tooltip) are custom-built UI components that provide accessible, keyboard-navigable overlays without using native browser dialogs. They follow shadcn/ui design principles and are fully integrated with the application's design system.

## Components

### 1. Modal Component

A dialog overlay component with focus trap, escape key handling, and full accessibility support.

#### Features

- **Focus Trap**: Automatically traps focus within the modal when open
- **Escape Key Handling**: Closes modal when Escape key is pressed (configurable)
- **Overlay Click**: Optionally closes modal when clicking outside (configurable)
- **Body Scroll Prevention**: Prevents page scrolling when modal is open
- **Focus Restoration**: Returns focus to the trigger element when modal closes
- **Keyboard Navigation**: Full Tab/Shift+Tab support within modal
- **Customizable Sizes**: sm, md, lg, xl
- **Optional Header/Footer**: Flexible layout options
- **ARIA Compliant**: Proper role, aria-modal, aria-labelledby, aria-describedby

#### Props

```typescript
interface ModalProps {
  isOpen: boolean;              // Controls modal visibility
  onClose: () => void;          // Callback when modal should close
  title?: string;               // Modal title (displayed in header)
  description?: string;         // Modal description (displayed below title)
  children: React.ReactNode;    // Modal body content
  size?: 'sm' | 'md' | 'lg' | 'xl'; // Modal width (default: 'md')
  showCloseButton?: boolean;    // Show X button in header (default: true)
  closeOnOverlayClick?: boolean; // Close on backdrop click (default: true)
  closeOnEscape?: boolean;      // Close on Escape key (default: true)
  footer?: React.ReactNode;     // Footer content (typically buttons)
  className?: string;           // Additional CSS classes for modal
}
```

#### Usage Examples

**Basic Modal**
```tsx
const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Basic Modal"
  description="This is a simple modal"
>
  <p>Modal content goes here</p>
</Modal>
```

**Confirmation Modal**
```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Action"
  size="sm"
  closeOnOverlayClick={false}
  footer={
    <>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleConfirm}>
        Confirm
      </Button>
    </>
  }
>
  <p>Are you sure you want to proceed?</p>
</Modal>
```

**Form Modal**
```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Add User"
  size="lg"
  footer={
    <>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button type="submit" form="user-form">
        Save
      </Button>
    </>
  }
>
  <form id="user-form" onSubmit={handleSubmit}>
    <Input label="Name" name="name" required />
    <Input label="Email" name="email" type="email" required />
  </form>
</Modal>
```

#### Accessibility

- Uses `role="dialog"` and `aria-modal="true"`
- Associates title with `aria-labelledby`
- Associates description with `aria-describedby`
- Traps focus within modal
- Restores focus on close
- Supports keyboard navigation (Tab, Shift+Tab, Escape)
- Close button has `aria-label="Close modal"`

#### Requirements Satisfied

- **18.2**: Custom Modal component (no native browser alert/confirm)
- **18.5**: Modal built with shadcn/ui styling
- **18.14**: ARIA labels and proper semantic HTML
- **18.15**: Full keyboard navigation support
- **26.1**: ARIA labels and roles
- **26.2**: Keyboard navigation
- **26.3**: Visible focus indicators

---

### 2. Dropdown Component

A custom dropdown menu component with keyboard navigation and accessibility features.

#### Features

- **Keyboard Navigation**: Arrow keys, Enter, Space, Escape, Home, End
- **Click Outside to Close**: Automatically closes when clicking outside
- **Icon Support**: Optional icons for menu items
- **Dividers**: Visual separators between menu items
- **Disabled Items**: Support for disabled menu items
- **Alignment**: Left or right alignment relative to trigger
- **Focus Management**: Tracks and highlights focused items
- **ARIA Compliant**: Proper role, aria-haspopup, aria-expanded

#### Props

```typescript
interface DropdownItem {
  label: string;           // Item label text
  value: string;           // Unique item value
  icon?: React.ReactNode;  // Optional icon (e.g., Lucide icon)
  disabled?: boolean;      // Whether item is disabled
  onClick?: () => void;    // Click handler for this item
  divider?: boolean;       // Render as divider instead of item
}

interface DropdownProps {
  trigger: React.ReactNode;        // Element that opens dropdown
  items: DropdownItem[];           // Menu items
  align?: 'left' | 'right';        // Menu alignment (default: 'left')
  className?: string;              // Additional CSS for container
  menuClassName?: string;          // Additional CSS for menu
  onItemSelect?: (value: string) => void; // Callback when item selected
}
```

#### Usage Examples

**Basic Dropdown**
```tsx
const items = [
  { label: 'Profile', value: 'profile', icon: <User className="h-4 w-4" /> },
  { label: 'Settings', value: 'settings', icon: <Settings className="h-4 w-4" /> },
  { label: 'Divider', value: 'divider', divider: true },
  { label: 'Logout', value: 'logout', icon: <LogOut className="h-4 w-4" /> },
];

<Dropdown
  trigger={<Button>Menu</Button>}
  items={items}
  onItemSelect={(value) => console.log('Selected:', value)}
/>
```

**Actions Dropdown**
```tsx
const items = [
  {
    label: 'Edit',
    value: 'edit',
    icon: <Edit className="h-4 w-4" />,
    onClick: () => handleEdit(),
  },
  {
    label: 'Delete',
    value: 'delete',
    icon: <Trash2 className="h-4 w-4" />,
    onClick: () => handleDelete(),
  },
  {
    label: 'Disabled',
    value: 'disabled',
    disabled: true,
  },
];

<Dropdown
  trigger={<Button variant="ghost">Actions</Button>}
  items={items}
  align="right"
/>
```

**User Menu**
```tsx
<Dropdown
  trigger={
    <button className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-blue-600 text-white">
        JD
      </div>
    </button>
  }
  items={[
    { label: 'John Doe', value: 'name', disabled: true },
    { label: 'john@example.com', value: 'email', disabled: true },
    { label: 'Divider', value: 'div1', divider: true },
    { label: 'Profile', value: 'profile', icon: <User /> },
    { label: 'Settings', value: 'settings', icon: <Settings /> },
    { label: 'Divider', value: 'div2', divider: true },
    { label: 'Logout', value: 'logout', icon: <LogOut /> },
  ]}
  align="right"
/>
```

#### Keyboard Navigation

- **Enter/Space**: Open dropdown or select focused item
- **Escape**: Close dropdown
- **Arrow Down**: Move focus to next item
- **Arrow Up**: Move focus to previous item
- **Home**: Move focus to first item
- **End**: Move focus to last item
- **Tab**: Close dropdown and move to next focusable element

#### Accessibility

- Uses `role="menu"` and `role="menuitem"`
- Trigger has `aria-haspopup="true"` and `aria-expanded`
- Disabled items have `disabled` attribute
- Dividers use `role="separator"`
- Focus management with keyboard navigation
- Click outside to close

#### Requirements Satisfied

- **18.7**: Custom Dropdown component
- **18.14**: ARIA labels and proper semantic HTML
- **18.15**: Full keyboard navigation support
- **26.1**: ARIA labels and roles
- **26.2**: Keyboard navigation
- **26.3**: Visible focus indicators

---

### 3. Tooltip Component

A custom tooltip component that displays contextual information on hover or focus.

#### Features

- **Four Positions**: top, bottom, left, right
- **Customizable Delay**: Configurable show delay (default 200ms)
- **Keyboard Accessible**: Shows on focus, not just hover
- **Arrow Indicator**: Visual arrow pointing to trigger element
- **Complex Content**: Supports React nodes, not just strings
- **Focus Management**: Stays visible while trigger is focused
- **ARIA Compliant**: Uses role="tooltip" and aria-describedby

#### Props

```typescript
interface TooltipProps {
  content: React.ReactNode;     // Tooltip content (text or React nodes)
  children: React.ReactNode;    // Trigger element
  position?: 'top' | 'bottom' | 'left' | 'right'; // Position (default: 'top')
  delay?: number;               // Show delay in ms (default: 200)
  className?: string;           // Additional CSS for container
  contentClassName?: string;    // Additional CSS for tooltip content
}
```

#### Usage Examples

**Basic Tooltip**
```tsx
<Tooltip content="This is a tooltip" position="top">
  <Button>Hover me</Button>
</Tooltip>
```

**Icon with Tooltip**
```tsx
<Tooltip content="Additional information" position="right">
  <button className="text-gray-400 hover:text-gray-600">
    <Info className="h-4 w-4" />
  </button>
</Tooltip>
```

**Complex Content**
```tsx
<Tooltip
  content={
    <div className="max-w-xs">
      <p className="font-semibold mb-1">Title</p>
      <p className="text-xs">
        This tooltip contains multiple lines and complex content.
      </p>
    </div>
  }
  position="bottom"
  contentClassName="whitespace-normal"
>
  <Button>Hover for details</Button>
</Tooltip>
```

**Custom Delay**
```tsx
<Tooltip content="Fast tooltip" delay={100}>
  <Button>Fast</Button>
</Tooltip>

<Tooltip content="Slow tooltip" delay={500}>
  <Button>Slow</Button>
</Tooltip>
```

#### Behavior

- **Mouse Hover**: Shows after delay, hides when mouse leaves
- **Keyboard Focus**: Shows when element receives focus, hides on blur
- **Combined**: If focused and hovered, stays visible until both are gone
- **Positioning**: Automatically positions based on `position` prop
- **Arrow**: Visual arrow points to trigger element

#### Accessibility

- Uses `role="tooltip"`
- Trigger has `aria-describedby` pointing to tooltip
- Trigger is focusable with `tabIndex={0}`
- Shows on both hover and focus
- Keyboard accessible

#### Requirements Satisfied

- **18.8**: Custom Tooltip component
- **18.14**: ARIA labels and proper semantic HTML
- **18.15**: Keyboard navigation support
- **26.1**: ARIA labels and roles
- **26.2**: Keyboard navigation
- **26.3**: Visible focus indicators

---

## Integration with Existing Components

All overlay components integrate seamlessly with:

- **Tailwind CSS**: Styled using Tailwind utility classes
- **Lucide Icons**: Support for Lucide React icons
- **Button Component**: Works with existing Button component
- **Form Components**: Can be used with Input, Select, etc.
- **TypeScript**: Full type safety with TypeScript interfaces

## Testing

A test page is available at `/test-overlay-components` that demonstrates all components with various configurations and use cases.

## Best Practices

### Modal

1. Always provide a `title` for accessibility
2. Use `closeOnOverlayClick={false}` for critical actions
3. Include clear action buttons in the footer
4. Keep modal content focused and concise
5. Use appropriate size for content (don't make it too large)

### Dropdown

1. Use icons to improve visual scanning
2. Group related items with dividers
3. Disable items that aren't currently available (don't hide them)
4. Align dropdown appropriately (right-align for user menus)
5. Keep menu items concise and action-oriented

### Tooltip

1. Keep tooltip content brief and informative
2. Use tooltips for supplementary information, not critical content
3. Don't put interactive elements inside tooltips
4. Choose appropriate position to avoid covering important content
5. Use consistent delay across the application

## Common Patterns

### Confirmation Dialog

```tsx
const [isOpen, setIsOpen] = useState(false);

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm Delete"
  size="sm"
  closeOnOverlayClick={false}
  footer={
    <>
      <Button variant="outline" onClick={() => setIsOpen(false)}>
        Cancel
      </Button>
      <Button onClick={handleDelete}>
        Delete
      </Button>
    </>
  }
>
  <p>Are you sure? This action cannot be undone.</p>
</Modal>
```

### Context Menu

```tsx
<Dropdown
  trigger={<Button variant="ghost">⋮</Button>}
  items={[
    { label: 'Edit', value: 'edit', icon: <Edit />, onClick: handleEdit },
    { label: 'Duplicate', value: 'duplicate', icon: <Copy />, onClick: handleDuplicate },
    { label: 'Divider', value: 'div', divider: true },
    { label: 'Delete', value: 'delete', icon: <Trash2 />, onClick: handleDelete },
  ]}
  align="right"
/>
```

### Help Icon with Tooltip

```tsx
<div className="flex items-center gap-2">
  <label>Field Name</label>
  <Tooltip content="Additional help text" position="top">
    <button className="text-gray-400 hover:text-gray-600">
      <Info className="h-4 w-4" />
    </button>
  </Tooltip>
</div>
```

## Browser Support

All components work in modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Performance Considerations

- Modal: Prevents body scroll and manages focus efficiently
- Dropdown: Uses event delegation for click outside detection
- Tooltip: Debounces show/hide with configurable delay
- All components clean up event listeners on unmount

## Future Enhancements

Potential improvements for future versions:
- Modal: Animation transitions
- Dropdown: Nested submenus
- Tooltip: Auto-positioning to stay in viewport
- All: Theme customization support
