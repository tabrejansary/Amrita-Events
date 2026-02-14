'use client';

import { useState } from 'react';
import { FormField } from './FormBuilder';
import { FaCheckCircle, FaSpinner } from 'react-icons/fa';

interface FormRendererProps {
    fields: FormField[];
    onSubmit: (answers: { label: string; value: any }[]) => Promise<void>;
    isLoading?: boolean;
    footer?: React.ReactNode;
}

export default function FormRenderer({ fields, onSubmit, isLoading = false, footer }: FormRendererProps) {
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleAnswerChange = (label: string, value: any) => {
        setAnswers(prev => ({ ...prev, [label]: value }));
        if (errors[label]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[label];
                return newErrors;
            });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        fields.forEach(field => {
            if (field.required && !answers[field.label]) {
                newErrors[field.label] = 'This field is required';
            }
            if (field.type === 'email' && answers[field.label] && !/^\S+@\S+\.\S+$/.test(answers[field.label])) {
                newErrors[field.label] = 'Invalid email address';
            }
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            const formattedAnswers = fields.map(field => ({
                label: field.label,
                value: answers[field.label] || ''
            }));
            await onSubmit(formattedAnswers);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {fields.map((field) => (
                <div key={field.id || (field as any)._id} className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="block text-sm font-black uppercase tracking-widest text-amrita-maroon/70">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                    </div>

                    {field.helpText && (
                        <p className="text-[10px] text-amrita-textGray font-medium leading-relaxed">{field.helpText}</p>
                    )}

                    <div className="mt-2">
                        {renderField(field, answers[field.label], (val) => handleAnswerChange(field.label, val))}
                    </div>

                    {errors[field.label] && (
                        <p className="text-[10px] text-red-500 font-black uppercase tracking-tighter animate-pulse">{errors[field.label]}</p>
                    )}
                </div>
            ))}

            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-[2] bg-amrita-maroon text-white font-black uppercase tracking-[0.2em] py-4 rounded-2xl shadow-lg hover:shadow-amrita-maroon/20 hover:scale-[0.99] active:scale-95 transition-all flex items-center justify-center space-x-3 disabled:opacity-50"
                >
                    {isLoading ? (
                        <FaSpinner className="animate-spin" />
                    ) : (
                        <>
                            <FaCheckCircle className="text-amrita-yellow" />
                            <span>Confirm Registration</span>
                        </>
                    )}
                </button>
                {footer}
            </div>
        </form>
    );
}

function renderField(field: FormField, value: any, onChange: (val: any) => void) {
    const commonClasses = "w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-amrita-maroon/5 focus:border-amrita-maroon outline-none transition-all font-medium text-amrita-textDark placeholder:text-gray-300";

    switch (field.type) {
        case 'text':
        case 'email':
        case 'phone':
        case 'number':
            return (
                <input
                    type={field.type === 'phone' ? 'tel' : field.type}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.placeholder || `Enter your ${field.label.toLowerCase()}...`}
                    className={commonClasses}
                />
            );

        case 'longText':
            return (
                <textarea
                    rows={4}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={field.placeholder || 'Type your answer here...'}
                    className={commonClasses}
                />
            );

        case 'date':
            return (
                <input
                    type="date"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className={commonClasses}
                />
            );

        case 'time':
            return (
                <input
                    type="time"
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className={commonClasses}
                />
            );

        case 'select':
            return (
                <div className="relative">
                    <select
                        value={value || ''}
                        onChange={(e) => onChange(e.target.value)}
                        className={`${commonClasses} appearance-none cursor-pointer`}
                    >
                        <option value="">Choose one...</option>
                        {field.options.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                    </div>
                </div>
            );

        case 'radio':
            return (
                <div className="grid gap-3">
                    {field.options.map((opt, i) => (
                        <label key={i} className={`flex items-center space-x-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${value === opt
                            ? 'border-amrita-maroon bg-amrita-maroon/5 ring-4 ring-amrita-maroon/5'
                            : 'border-gray-50 bg-gray-50/50 hover:border-gray-100'
                            }`}>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${value === opt ? 'border-amrita-maroon' : 'border-gray-300'
                                }`}>
                                {value === opt && <div className="w-2.5 h-2.5 rounded-full bg-amrita-maroon" />}
                            </div>
                            <input
                                type="radio"
                                name={field.id}
                                checked={value === opt}
                                onChange={() => onChange(opt)}
                                className="sr-only"
                            />
                            <span className={`text-sm font-bold ${value === opt ? 'text-amrita-maroon' : 'text-amrita-textGray'}`}>{opt}</span>
                        </label>
                    ))}
                </div>
            );

        case 'checkbox':
            const currentValues = Array.isArray(value) ? value : [];
            const handleCheckbox = (opt: string) => {
                const nextValues = currentValues.includes(opt)
                    ? currentValues.filter(v => v !== opt)
                    : [...currentValues, opt];
                onChange(nextValues);
            };
            return (
                <div className="grid gap-3">
                    {field.options.map((opt, i) => (
                        <label key={i} className={`flex items-center space-x-4 p-4 rounded-xl border-2 transition-all cursor-pointer ${currentValues.includes(opt)
                            ? 'border-amrita-maroon bg-amrita-maroon/5 ring-4 ring-amrita-maroon/5'
                            : 'border-gray-50 bg-gray-50/50 hover:border-gray-100'
                            }`}>
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${currentValues.includes(opt) ? 'border-amrita-maroon bg-amrita-maroon text-white' : 'border-gray-300'
                                }`}>
                                {currentValues.includes(opt) && <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20"><path d="M0 11l2-2 5 5L18 3l2 2L7 18z" /></svg>}
                            </div>
                            <input
                                type="checkbox"
                                checked={currentValues.includes(opt)}
                                onChange={() => handleCheckbox(opt)}
                                className="sr-only"
                            />
                            <span className={`text-sm font-bold ${currentValues.includes(opt) ? 'text-amrita-maroon' : 'text-amrita-textGray'}`}>{opt}</span>
                        </label>
                    ))}
                </div>
            );

        default:
            return null;
    }
}
