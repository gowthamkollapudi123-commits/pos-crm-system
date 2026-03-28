/**
 * Overlay Components Usage Examples
 * 
 * This file demonstrates how to use Modal, Dropdown, and Tooltip components
 */

'use client';

import * as React from 'react';
import { Modal, Dropdown, Tooltip, Button, Input } from './index';
import { Settings, User, LogOut, Edit, Trash2, Info } from 'lucide-react';

// ============================================================================
// Modal Examples
// ============================================================================

export function BasicModalExample() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Basic Modal"
        description="This is a simple modal dialog"
      >
        <p className="text-gray-700">
          This is the modal content. You can put any React components here.
        </p>
      </Modal>
    </div>
  );
}

export function ModalWithFooterExample() {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSave = () => {
    console.log('Saving...');
    setIsOpen(false);
  };

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Open Modal with Footer</Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Confirm Action"
        description="Are you sure you want to proceed?"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Confirm
            </Button>
          </>
        }
      >
        <p className="text-gray-700">
          This action cannot be undone. Please confirm that you want to continue.
        </p>
      </Modal>
    </div>
  );
}

export function FormModalExample() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', { name, email });
    setIsOpen(false);
    setName('');
    setEmail('');
  };

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Add User</Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Add New User"
        description="Enter the user details below"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="user-form">
              Save User
            </Button>
          </>
        }
      >
        <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter name"
            required
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
            required
          />
        </form>
      </Modal>
    </div>
  );
}

export function DeleteConfirmationModalExample() {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleDelete = () => {
    console.log('Deleting item...');
    setIsOpen(false);
  };

  return (
    <div>
      <Button variant="outline" onClick={() => setIsOpen(true)}>
        Delete Item
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Delete Item"
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
        <p className="text-gray-700">
          Are you sure you want to delete this item? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}

// ============================================================================
// Dropdown Examples
// ============================================================================

export function BasicDropdownExample() {
  const items = [
    { label: 'Profile', value: 'profile', icon: <User className="h-4 w-4" /> },
    { label: 'Settings', value: 'settings', icon: <Settings className="h-4 w-4" /> },
    { label: 'Divider', value: 'divider', divider: true },
    { label: 'Logout', value: 'logout', icon: <LogOut className="h-4 w-4" /> },
  ];

  const handleSelect = (value: string) => {
    console.log('Selected:', value);
  };

  return (
    <Dropdown
      trigger={
        <Button variant="outline">
          Menu
        </Button>
      }
      items={items}
      onItemSelect={handleSelect}
    />
  );
}

export function ActionsDropdownExample() {
  const [selectedItem, setSelectedItem] = React.useState<string | null>(null);

  const items = [
    {
      label: 'Edit',
      value: 'edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: () => console.log('Edit clicked'),
    },
    {
      label: 'Delete',
      value: 'delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => console.log('Delete clicked'),
    },
    {
      label: 'Disabled Action',
      value: 'disabled',
      disabled: true,
    },
  ];

  return (
    <div>
      <Dropdown
        trigger={
          <Button variant="ghost">
            Actions
          </Button>
        }
        items={items}
        align="right"
        onItemSelect={setSelectedItem}
      />
      {selectedItem && (
        <p className="mt-2 text-sm text-gray-600">
          Last selected: {selectedItem}
        </p>
      )}
    </div>
  );
}

export function UserMenuDropdownExample() {
  const items = [
    {
      label: 'John Doe',
      value: 'user-name',
      disabled: true,
    },
    {
      label: 'john@example.com',
      value: 'user-email',
      disabled: true,
    },
    { label: 'Divider', value: 'divider-1', divider: true },
    {
      label: 'Profile',
      value: 'profile',
      icon: <User className="h-4 w-4" />,
    },
    {
      label: 'Settings',
      value: 'settings',
      icon: <Settings className="h-4 w-4" />,
    },
    { label: 'Divider', value: 'divider-2', divider: true },
    {
      label: 'Logout',
      value: 'logout',
      icon: <LogOut className="h-4 w-4" />,
    },
  ];

  return (
    <Dropdown
      trigger={
        <button className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100">
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
            JD
          </div>
        </button>
      }
      items={items}
      align="right"
    />
  );
}

// ============================================================================
// Tooltip Examples
// ============================================================================

export function BasicTooltipExample() {
  return (
    <div className="flex gap-4">
      <Tooltip content="This is a tooltip" position="top">
        <Button>Hover me (top)</Button>
      </Tooltip>

      <Tooltip content="This is a tooltip" position="bottom">
        <Button>Hover me (bottom)</Button>
      </Tooltip>

      <Tooltip content="This is a tooltip" position="left">
        <Button>Hover me (left)</Button>
      </Tooltip>

      <Tooltip content="This is a tooltip" position="right">
        <Button>Hover me (right)</Button>
      </Tooltip>
    </div>
  );
}

export function IconTooltipExample() {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-700">User Information</span>
      <Tooltip content="Additional information about the user" position="top">
        <button className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded">
          <Info className="h-4 w-4" />
        </button>
      </Tooltip>
    </div>
  );
}

export function CustomDelayTooltipExample() {
  return (
    <div className="flex gap-4">
      <Tooltip content="Fast tooltip (100ms)" delay={100}>
        <Button variant="outline">Fast</Button>
      </Tooltip>

      <Tooltip content="Normal tooltip (200ms)" delay={200}>
        <Button variant="outline">Normal</Button>
      </Tooltip>

      <Tooltip content="Slow tooltip (500ms)" delay={500}>
        <Button variant="outline">Slow</Button>
      </Tooltip>
    </div>
  );
}

export function ComplexTooltipExample() {
  return (
    <Tooltip
      content={
        <div className="max-w-xs">
          <p className="font-semibold mb-1">Complex Tooltip</p>
          <p className="text-xs">
            This tooltip contains multiple lines of text and more complex content.
          </p>
        </div>
      }
      position="top"
      contentClassName="whitespace-normal"
    >
      <Button>Hover for details</Button>
    </Tooltip>
  );
}

// ============================================================================
// Combined Example
// ============================================================================

export function CombinedExample() {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const dropdownItems = [
    {
      label: 'Open Modal',
      value: 'modal',
      onClick: () => setIsModalOpen(true),
    },
    {
      label: 'Other Action',
      value: 'other',
      onClick: () => console.log('Other action'),
    },
  ];

  return (
    <div className="flex items-center gap-4">
      <Tooltip content="Click to see options" position="top">
        <Dropdown
          trigger={<Button>Actions</Button>}
          items={dropdownItems}
        />
      </Tooltip>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Modal from Dropdown"
        description="This modal was opened from a dropdown menu"
        footer={
          <Button onClick={() => setIsModalOpen(false)}>
            Close
          </Button>
        }
      >
        <p className="text-gray-700">
          This demonstrates how Modal, Dropdown, and Tooltip components can work together.
        </p>
      </Modal>
    </div>
  );
}

// ============================================================================
// Demo Page Component
// ============================================================================

export function OverlayComponentsDemo() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-12">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Overlay Components Demo
        </h1>
        <p className="text-gray-600">
          Examples of Modal, Dropdown, and Tooltip components
        </p>
      </div>

      {/* Modal Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Modal Examples</h2>
        <div className="flex flex-wrap gap-4">
          <BasicModalExample />
          <ModalWithFooterExample />
          <FormModalExample />
          <DeleteConfirmationModalExample />
        </div>
      </section>

      {/* Dropdown Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Dropdown Examples</h2>
        <div className="flex flex-wrap gap-4">
          <BasicDropdownExample />
          <ActionsDropdownExample />
          <UserMenuDropdownExample />
        </div>
      </section>

      {/* Tooltip Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Tooltip Examples</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Positions</h3>
            <BasicTooltipExample />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Icon Tooltip</h3>
            <IconTooltipExample />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Custom Delay</h3>
            <CustomDelayTooltipExample />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">Complex Content</h3>
            <ComplexTooltipExample />
          </div>
        </div>
      </section>

      {/* Combined Example */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900">Combined Example</h2>
        <CombinedExample />
      </section>
    </div>
  );
}
