/**
 * FileUpload Component
 * 
 * Custom file upload component with validation and accessibility features
 * Requirements: 18.9, 18.14, 18.15, 26.1, 26.2, 26.3
 */

import * as React from 'react';
import { Upload, X, File } from 'lucide-react';
import { validateFile, formatFileSize, type FileValidationResult } from '@/utils/file-validation';

export interface FileUploadProps {
  label?: string;
  error?: string;
  helperText?: string;
  accept?: string;
  allowedTypes?: readonly string[];
  maxSize?: number;
  multiple?: boolean;
  disabled?: boolean;
  required?: boolean;
  onChange?: (files: File[]) => void;
  onValidationError?: (error: string) => void;
  id?: string;
  className?: string;
}

const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      className = '',
      label,
      error,
      helperText,
      accept,
      allowedTypes,
      maxSize,
      multiple = false,
      disabled = false,
      required = false,
      onChange,
      onValidationError,
      id,
    },
    ref
  ) => {
    const [selectedFiles, setSelectedFiles] = React.useState<File[]>([]);
    const [dragActive, setDragActive] = React.useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const generatedId = React.useId();
    const uploadId = id || `file-upload-${generatedId}`;
    const errorId = `${uploadId}-error`;
    const helperId = `${uploadId}-helper`;

    // Merge refs
    React.useImperativeHandle(ref, () => inputRef.current!);

    const validateAndSetFiles = (files: FileList | null) => {
      if (!files || files.length === 0) return;

      const fileArray = Array.from(files);
      
      // Validate each file if allowedTypes is provided
      if (allowedTypes) {
        for (const file of fileArray) {
          const validation: FileValidationResult = validateFile(
            file,
            allowedTypes,
            maxSize
          );
          
          if (!validation.valid) {
            if (onValidationError) {
              onValidationError(validation.error || 'File validation failed');
            }
            return;
          }
        }
      }

      setSelectedFiles(fileArray);
      if (onChange) {
        onChange(fileArray);
      }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      validateAndSetFiles(e.target.files);
    };

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true);
      } else if (e.type === 'dragleave') {
        setDragActive(false);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      validateAndSetFiles(e.dataTransfer.files);
    };

    const handleRemoveFile = (index: number) => {
      const newFiles = selectedFiles.filter((_, i) => i !== index);
      setSelectedFiles(newFiles);
      if (onChange) {
        onChange(newFiles);
      }
      // Reset input value
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    };

    const handleClick = () => {
      inputRef.current?.click();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    };

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label
            htmlFor={uploadId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
          </label>
        )}
        
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6
            transition-colors cursor-pointer
            ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
            ${error ? 'border-red-500' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-400'}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={disabled ? undefined : handleClick}
          onKeyDown={disabled ? undefined : handleKeyDown}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={label || 'Upload file'}
          aria-describedby={
            error ? errorId : helperText ? helperId : undefined
          }
          aria-disabled={disabled}
        >
          <input
            ref={inputRef}
            id={uploadId}
            type="file"
            className="sr-only"
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            required={required}
            onChange={handleFileChange}
            aria-invalid={error ? 'true' : 'false'}
          />
          
          <div className="flex flex-col items-center justify-center text-center">
            <Upload className="h-10 w-10 text-gray-400 mb-3" aria-hidden="true" />
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-semibold text-blue-600">Click to upload</span> or drag and drop
            </p>
            {helperText && !error && (
              <p className="text-xs text-gray-500">{helperText}</p>
            )}
          </div>
        </div>

        {/* Selected files list */}
        {selectedFiles.length > 0 && (
          <div className="mt-3 space-y-2" role="list" aria-label="Selected files">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                role="listitem"
              >
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <File className="h-5 w-5 text-gray-400 flex-shrink-0" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(index);
                  }}
                  className="ml-2 p-1 text-gray-400 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
                  aria-label={`Remove ${file.name}`}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}

        {error && (
          <p
            id={errorId}
            className="mt-1 text-sm text-red-600"
            role="alert"
            aria-live="polite"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);

FileUpload.displayName = 'FileUpload';

export { FileUpload };
