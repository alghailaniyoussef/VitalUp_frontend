'use client';

import { ChangeEvent, ReactNode } from 'react';

interface BaseFormFieldProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  helpText?: string;
}

interface TextFieldProps extends BaseFormFieldProps {
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'tel' | 'url';
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
}

interface TextareaFieldProps extends BaseFormFieldProps {
  type: 'textarea';
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
}

interface SelectFieldProps extends BaseFormFieldProps {
  type: 'select';
  value: string | number;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: Array<{ value: string | number; label: string }>;
  placeholder?: string;
}

interface CheckboxFieldProps extends BaseFormFieldProps {
  type: 'checkbox';
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

interface RadioFieldProps extends BaseFormFieldProps {
  type: 'radio';
  options: Array<{ value: string | number; label: string }>;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  inline?: boolean;
}

interface CustomFieldProps extends BaseFormFieldProps {
  type: 'custom';
  children: ReactNode;
}

type FormFieldProps =
  | TextFieldProps
  | TextareaFieldProps
  | SelectFieldProps
  | CheckboxFieldProps
  | RadioFieldProps
  | CustomFieldProps;

export default function FormField(props: FormFieldProps) {
  const { id, label, error, required, disabled, className, helpText } = props;

  const renderField = () => {
    switch (props.type) {
      case 'text':
      case 'email':
      case 'password':
      case 'number':
      case 'date':
      case 'tel':
      case 'url':
        return (
          <input
            id={id}
            type={props.type}
            value={props.value}
            onChange={props.onChange}
            placeholder={props.placeholder}
            required={required}
            disabled={disabled}
            min={props.min}
            max={props.max}
            step={props.step}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm ${error ? 'border-red-300' : ''} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          />
        );

      case 'textarea':
        return (
          <textarea
            id={id}
            value={props.value}
            onChange={props.onChange}
            placeholder={props.placeholder}
            rows={props.rows || 3}
            required={required}
            disabled={disabled}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm ${error ? 'border-red-300' : ''} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          />
        );

      case 'select':
        return (
          <select
            id={id}
            value={props.value}
            onChange={props.onChange}
            required={required}
            disabled={disabled}
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm ${error ? 'border-red-300' : ''} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          >
            {props.placeholder && (
              <option value="" disabled>
                {props.placeholder}
              </option>
            )}
            {props.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <div className="mt-1 flex items-center">
            <input
              id={id}
              type="checkbox"
              checked={props.checked}
              onChange={props.onChange}
              required={required}
              disabled={disabled}
              className={`h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            <label htmlFor={id} className="ml-2 block text-sm text-gray-900">
              {label}
            </label>
          </div>
        );

      case 'radio':
        return (
          <div className={`mt-1 ${props.inline ? 'flex space-x-6' : 'space-y-2'}`}>
            {props.options.map((option) => (
              <div key={option.value} className="flex items-center">
                <input
                  id={`${id}-${option.value}`}
                  name={id}
                  type="radio"
                  value={option.value}
                  checked={props.value === option.value}
                  onChange={props.onChange}
                  required={required}
                  disabled={disabled}
                  className={`h-4 w-4 border-gray-300 text-teal-600 focus:ring-teal-500 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
                <label
                  htmlFor={`${id}-${option.value}`}
                  className="ml-2 block text-sm text-gray-900"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );

      case 'custom':
        return props.children;

      default:
        return null;
    }
  };

  return (
    <div className={`${className || ''}`}>
      {props.type !== 'checkbox' && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {renderField()}

      {helpText && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}