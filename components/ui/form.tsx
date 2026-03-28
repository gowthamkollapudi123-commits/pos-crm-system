/**
 * Form Components
 * 
 * Form wrapper components that integrate with React Hook Form
 * Requirements: 21.1, 21.2, 21.3, 21.4, 21.5, 26.1, 26.2, 26.8
 */

import * as React from 'react';
import { useFormContext, Controller, type FieldValues, type Path, type ControllerProps } from 'react-hook-form';
import { Input, type InputProps } from './input';
import { Select, type SelectProps } from './select';
import { DatePicker, type DatePickerProps } from './date-picker';
import { FileUpload, type FileUploadProps } from './file-upload';
import { Textarea, type TextareaProps } from './textarea';

/**
 * FormField - Wrapper for form fields with React Hook Form integration
 */
interface FormFieldProps<TFieldValues extends FieldValues> {
  name: Path<TFieldValues>;
  render: ControllerProps<TFieldValues>['render'];
  rules?: ControllerProps<TFieldValues>['rules'];
  defaultValue?: ControllerProps<TFieldValues>['defaultValue'];
}

export function FormField<TFieldValues extends FieldValues>({
  name,
  render,
  rules,
  defaultValue,
}: FormFieldProps<TFieldValues>) {
  return (
    <Controller
      name={name}
      render={render}
      rules={rules}
      defaultValue={defaultValue}
    />
  );
}

/**
 * FormInput - Input field integrated with React Hook Form
 */
interface FormInputProps<TFieldValues extends FieldValues> extends Omit<InputProps, 'name'> {
  name: Path<TFieldValues>;
}

export function FormInput<TFieldValues extends FieldValues>({
  name,
  ...props
}: FormInputProps<TFieldValues>) {
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const error = errors[name]?.message as string | undefined;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Input
          {...props}
          {...field}
          error={error}
        />
      )}
    />
  );
}

/**
 * FormSelect - Select field integrated with React Hook Form
 */
interface FormSelectProps<TFieldValues extends FieldValues> extends Omit<SelectProps, 'name' | 'onChange'> {
  name: Path<TFieldValues>;
}

export function FormSelect<TFieldValues extends FieldValues>({
  name,
  ...props
}: FormSelectProps<TFieldValues>) {
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const error = errors[name]?.message as string | undefined;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Select
          {...props}
          {...field}
          error={error}
          onChange={(value) => field.onChange(value)}
        />
      )}
    />
  );
}

/**
 * FormDatePicker - DatePicker field integrated with React Hook Form
 */
interface FormDatePickerProps<TFieldValues extends FieldValues> extends Omit<DatePickerProps, 'name' | 'onDateChange'> {
  name: Path<TFieldValues>;
}

export function FormDatePicker<TFieldValues extends FieldValues>({
  name,
  ...props
}: FormDatePickerProps<TFieldValues>) {
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const error = errors[name]?.message as string | undefined;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <DatePicker
          {...props}
          {...field}
          error={error}
          onDateChange={(date) => field.onChange(date)}
        />
      )}
    />
  );
}

/**
 * FormFileUpload - FileUpload field integrated with React Hook Form
 */
interface FormFileUploadProps<TFieldValues extends FieldValues> extends Omit<FileUploadProps, 'name' | 'onChange'> {
  name: Path<TFieldValues>;
}

export function FormFileUpload<TFieldValues extends FieldValues>({
  name,
  ...props
}: FormFileUploadProps<TFieldValues>) {
  const { control, formState: { errors }, setError } = useFormContext<TFieldValues>();
  const error = errors[name]?.message as string | undefined;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field: { onChange, ...field } }) => (
        <FileUpload
          {...props}
          {...field}
          error={error}
          onChange={(files) => onChange(files)}
          onValidationError={(validationError) => {
            setError(name, { type: 'manual', message: validationError });
          }}
        />
      )}
    />
  );
}

/**
 * FormTextarea - Textarea field integrated with React Hook Form
 */
interface FormTextareaProps<TFieldValues extends FieldValues> extends Omit<TextareaProps, 'name'> {
  name: Path<TFieldValues>;
}

export function FormTextarea<TFieldValues extends FieldValues>({
  name,
  ...props
}: FormTextareaProps<TFieldValues>) {
  const { control, formState: { errors } } = useFormContext<TFieldValues>();
  const error = errors[name]?.message as string | undefined;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Textarea
          {...props}
          {...field}
          error={error}
        />
      )}
    />
  );
}
