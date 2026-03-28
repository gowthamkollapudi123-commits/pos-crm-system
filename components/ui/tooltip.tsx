/**
 * Tooltip Component
 * 
 * Custom tooltip component with keyboard accessibility
 * Requirements: 18.8, 18.14, 18.15, 26.1, 26.2, 26.3
 */

import * as React from 'react';

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
  contentClassName?: string;
}

const Tooltip = React.forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      content,
      children,
      position = 'top',
      delay = 200,
      className = '',
      contentClassName = '',
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    const tooltipId = React.useId();

    const showTooltip = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delay);
    };

    const hideTooltip = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsVisible(false);
    };

    const handleMouseEnter = () => {
      showTooltip();
    };

    const handleMouseLeave = () => {
      if (!isFocused) {
        hideTooltip();
      }
    };

    const handleFocus = () => {
      setIsFocused(true);
      showTooltip();
    };

    const handleBlur = () => {
      setIsFocused(false);
      hideTooltip();
    };

    // Cleanup timeout on unmount
    React.useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    // Position styles
    const positionStyles = {
      top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    };

    // Arrow styles
    const arrowStyles = {
      top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-900',
      bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-900',
      left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-900',
      right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-900',
    };

    return (
      <div
        ref={ref}
        className={`relative inline-block ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {/* Trigger Element */}
        <div
          aria-describedby={isVisible ? tooltipId : undefined}
          tabIndex={0}
          className="focus:outline-none"
        >
          {children}
        </div>

        {/* Tooltip Content */}
        {isVisible && (
          <div
            id={tooltipId}
            role="tooltip"
            className={`
              absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-md
              shadow-lg whitespace-nowrap pointer-events-none
              ${positionStyles[position]}
              ${contentClassName}
            `}
          >
            {content}
            {/* Arrow */}
            <div
              className={`
                absolute w-0 h-0 border-4
                ${arrowStyles[position]}
              `}
              aria-hidden="true"
            />
          </div>
        )}
      </div>
    );
  }
);

Tooltip.displayName = 'Tooltip';

export { Tooltip };
