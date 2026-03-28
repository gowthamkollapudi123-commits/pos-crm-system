/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Dropdown Component
 * 
 * Custom dropdown menu component with keyboard navigation and accessibility
 * Requirements: 18.7, 18.14, 18.15, 26.1, 26.2, 26.3
 */

import * as React from 'react';

export interface DropdownItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  divider?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
  menuClassName?: string;
  onItemSelect?: (value: string) => void;
}

const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(
  (
    {
      trigger,
      items,
      align = 'left',
      className = '',
      menuClassName = '',
      onItemSelect,
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [focusedIndex, setFocusedIndex] = React.useState(-1);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const menuRef = React.useRef<HTMLDivElement>(null);

    // Merge ref
    React.useImperativeHandle(ref, () => dropdownRef.current!);

    const handleItemClick = React.useCallback((item: DropdownItem) => {
      if (item.disabled) return;
      item.onClick?.();
      onItemSelect?.(item.value);
      setIsOpen(false);
      setFocusedIndex(-1);
    }, [onItemSelect]);

    // Close dropdown when clicking outside
    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false);
          setFocusedIndex(-1);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    // Handle keyboard navigation
    React.useEffect(() => {
      if (!isOpen) return;

      const handleKeyDown = (e: KeyboardEvent) => {
        const enabledItems = items.filter((item) => !item.disabled && !item.divider);

        switch (e.key) {
          case 'Escape':
            e.preventDefault();
            setIsOpen(false);
            setFocusedIndex(-1);
            break;

          case 'ArrowDown':
            e.preventDefault();
            setFocusedIndex((prev) => {
              const nextIndex = prev + 1;
              return nextIndex >= enabledItems.length ? 0 : nextIndex;
            });
            break;

          case 'ArrowUp':
            e.preventDefault();
            setFocusedIndex((prev) => {
              const nextIndex = prev - 1;
              return nextIndex < 0 ? enabledItems.length - 1 : nextIndex;
            });
            break;

          case 'Enter':
          case ' ':
            e.preventDefault();
            if (focusedIndex >= 0 && focusedIndex < enabledItems.length) {
              const item = enabledItems[focusedIndex];
              handleItemClick(item);
            }
            break;

          case 'Home':
            e.preventDefault();
            setFocusedIndex(0);
            break;

          case 'End':
            e.preventDefault();
            setFocusedIndex(enabledItems.length - 1);
            break;
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, focusedIndex, items, handleItemClick]);

    // Focus the focused item
    React.useEffect(() => {
      if (isOpen && focusedIndex >= 0 && menuRef.current) {
        const enabledItems = items.filter((item) => !item.disabled && !item.divider);
        const buttons = menuRef.current.querySelectorAll<HTMLButtonElement>(
          'button:not([disabled])'
        );
        buttons[focusedIndex]?.focus();
      }
    }, [focusedIndex, isOpen, items]);

    const toggleDropdown = () => {
      setIsOpen((prev) => !prev);
      if (!isOpen) {
        setFocusedIndex(-1);
      }
    };

    const alignmentStyles = {
      left: 'left-0',
      right: 'right-0',
    };

    return (
      <div
        ref={dropdownRef}
        className={`relative inline-block ${className}`}
      >
        {/* Trigger */}
        <div
          onClick={toggleDropdown}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleDropdown();
            }
          }}
          aria-haspopup="true"
          aria-expanded={isOpen}
          className="cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md"
        >
          {trigger}
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            ref={menuRef}
            className={`
              absolute z-50 mt-2 min-w-[12rem] rounded-md shadow-lg
              bg-white ring-1 ring-black ring-opacity-5
              ${alignmentStyles[align]}
              ${menuClassName}
            `}
            role="menu"
            aria-orientation="vertical"
          >
            <div className="py-1">
              {items.map((item, index) => {
                if (item.divider) {
                  return (
                    <div
                      key={`divider-${index}`}
                      className="my-1 border-t border-gray-200"
                      role="separator"
                    />
                  );
                }

                const enabledItems = items.filter((i) => !i.disabled && !i.divider);
                const itemIndex = enabledItems.indexOf(item);
                const isFocused = itemIndex === focusedIndex;

                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => handleItemClick(item)}
                    disabled={item.disabled}
                    className={`
                      w-full text-left px-4 py-2 text-sm
                      flex items-center gap-2
                      transition-colors
                      ${
                        item.disabled
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100'
                      }
                      ${isFocused ? 'bg-gray-100' : ''}
                      focus:outline-none
                    `}
                    role="menuitem"
                    tabIndex={-1}
                  >
                    {item.icon && (
                      <span className="flex-shrink-0" aria-hidden="true">
                        {item.icon}
                      </span>
                    )}
                    <span className="flex-1">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }
);

Dropdown.displayName = 'Dropdown';

export { Dropdown };
