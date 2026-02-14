'use client';

import { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaGripLines, FaChevronDown, FaChevronUp, FaAsterisk, FaAlignLeft, FaCheckSquare, FaDotCircle, FaRegClock, FaCalendarAlt, FaFont, FaHashtag, FaEnvelope, FaPhone, FaList, FaRegSave } from 'react-icons/fa';

export type FieldType = 'text' | 'number' | 'email' | 'longText' | 'radio' | 'checkbox' | 'select' | 'date' | 'time' | 'phone';

const fieldTypeIcons: Record<FieldType, any> = {
    text: <FaFont />,
    longText: <FaAlignLeft />,
    number: <FaHashtag />,
    email: <FaEnvelope />,
    radio: <FaDotCircle />,
    checkbox: <FaCheckSquare />,
    select: <FaList />,
    date: <FaCalendarAlt />,
    time: <FaRegClock />,
    phone: <FaPhone />
};

export interface FormField {
    id: string;
    label: string;
    type: FieldType;
    required: boolean;
    options: string[];
    placeholder: string;
    helpText?: string;
}

interface FormBuilderProps {
    initialFields?: FormField[];
    onSave: (fields: FormField[]) => void;
    onSaveTemplate?: (fields: FormField[], name: string) => void;
}

export default function FormBuilder({ initialFields = [], onSave, onSaveTemplate }: FormBuilderProps) {
    const [fields, setFields] = useState<FormField[]>([]);
    const [activeField, setActiveField] = useState<string | null>(null);
    const [isNamingTemplate, setIsNamingTemplate] = useState(false);
    const [templateName, setTemplateName] = useState('');

    useEffect(() => {
        if (initialFields && initialFields.length > 0) {
            setFields(initialFields.map(f => ({
                ...f,
                id: f.id || (f as any)._id || Date.now().toString() + Math.random()
            })));
        } else if (fields.length === 0) {
            setFields([
                { id: '1', label: 'Full Name', type: 'text', required: true, options: [], placeholder: 'Enter your full name' }
            ]);
        }
    }, [initialFields]);

    const addField = () => {
        const newField: FormField = {
            id: Date.now().toString(),
            label: 'New Question',
            type: 'text',
            required: false,
            options: ['Option 1'],
            placeholder: ''
        };
        setFields([...fields, newField]);
        setActiveField(newField.id);
    };

    const removeField = (id: string) => {
        setFields(fields.filter(f => f.id !== id));
        if (activeField === id) setActiveField(null);
    };

    const updateField = (id: string, updates: Partial<FormField>) => {
        setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const moveField = (index: number, direction: 'up' | 'down') => {
        const newFields = [...fields];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex >= 0 && targetIndex < fields.length) {
            [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
            setFields(newFields);
        }
    };

    const addOption = (fieldId: string) => {
        const field = fields.find(f => f.id === fieldId);
        if (field) {
            updateField(fieldId, { options: [...field.options, `Option ${field.options.length + 1}`] });
        }
    };

    const removeOption = (fieldId: string, optionIndex: number) => {
        const field = fields.find(f => f.id === fieldId);
        if (field) {
            const newOptions = field.options.filter((_, i) => i !== optionIndex);
            updateField(fieldId, { options: newOptions });
        }
    };

    const updateOption = (fieldId: string, optionIndex: number, newValue: string) => {
        const field = fields.find(f => f.id === fieldId);
        if (field) {
            const newOptions = [...field.options];
            newOptions[optionIndex] = newValue;
            updateField(fieldId, { options: newOptions });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div>
                    <h3 className="text-xl font-bold text-amrita-maroon">Form Designer</h3>
                    <p className="text-xs text-amrita-textGray mt-1">Design your registration form precisely as it will appear</p>
                </div>
                <div className="flex items-center gap-3">
                    {onSaveTemplate && (
                        <button
                            type="button"
                            onClick={() => setIsNamingTemplate(true)}
                            className="bg-white text-amrita-maroon border border-amrita-maroon hover:bg-amrita-maroon/5 py-2 px-4 rounded-xl flex items-center gap-2 text-sm font-bold transition-all shadow-sm"
                        >
                            <FaRegSave />
                            <span>Save as Template</span>
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => onSave(fields)}
                        className="btn-primary py-2 px-6 shadow-md hover:shadow-lg transition-all"
                    >
                        Save Design
                    </button>
                </div>
            </div>

            {/* Template Naming Modal */}
            {isNamingTemplate && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6">
                        <div className="space-y-2">
                            <h4 className="text-2xl font-bold text-amrita-maroon">Save Template</h4>
                            <p className="text-sm text-amrita-textGray font-medium">Give this registration form template a name for future use.</p>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-amrita-maroon/60 block">Template Name</label>
                            <input
                                type="text"
                                autoFocus
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-4 focus:ring-amrita-maroon/5 focus:border-amrita-maroon outline-none transition-all font-bold text-amrita-textDark placeholder:text-gray-200"
                                placeholder="e.g., Coding Competition Basic"
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="button"
                                onClick={() => setIsNamingTemplate(false)}
                                className="flex-1 py-3 text-sm font-bold text-amrita-textGray hover:bg-gray-50 rounded-xl transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    if (templateName.trim()) {
                                        onSaveTemplate?.(fields, templateName);
                                        setIsNamingTemplate(false);
                                        setTemplateName('');
                                    }
                                }}
                                disabled={!templateName.trim()}
                                className="flex-1 btn-primary py-3 text-sm rounded-xl shadow-lg disabled:opacity-50"
                            >
                                Save Template
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-6">
                {fields.map((field, index) => (
                    <div
                        key={field.id}
                        onClick={() => setActiveField(field.id)}
                        className={`card transition-all duration-300 relative border-l-4 ${activeField === field.id
                            ? 'border-l-amrita-maroon shadow-xl scale-[1.01] z-10'
                            : 'border-l-transparent hover:border-l-gray-300'
                            }`}
                    >
                        {/* Status Dots */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 flex space-x-1 opacity-20">
                            <div className="w-1 h-1 bg-gray-400 rounded-full" />
                            <div className="w-1 h-1 bg-gray-400 rounded-full" />
                            <div className="w-1 h-1 bg-gray-400 rounded-full" />
                        </div>

                        <div className="flex items-start space-x-6">
                            {/* Reordering Controls */}
                            <div className="flex flex-col space-y-3 pt-4">
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); moveField(index, 'up'); }}
                                    disabled={index === 0}
                                    className="p-1.5 text-gray-300 hover:text-amrita-maroon hover:bg-gray-50 rounded-lg disabled:opacity-0 transition-all"
                                >
                                    <FaChevronUp size={14} />
                                </button>
                                <div className="text-gray-200 flex justify-center cursor-grab active:cursor-grabbing">
                                    <FaGripLines />
                                </div>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); moveField(index, 'down'); }}
                                    disabled={index === fields.length - 1}
                                    className="p-1.5 text-gray-300 hover:text-amrita-maroon hover:bg-gray-50 rounded-lg disabled:opacity-0 transition-all"
                                >
                                    <FaChevronDown size={14} />
                                </button>
                            </div>

                            {/* Field Editor Body */}
                            <div className="flex-1 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                                    <div className="md:col-span-8">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-amrita-maroon/60 mb-1 block">Question Title</label>
                                        <input
                                            type="text"
                                            value={field.label}
                                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                                            className="w-full text-lg font-bold text-amrita-textDark bg-transparent border-b-2 border-gray-100 focus:border-amrita-maroon outline-none py-2 transition-all placeholder:text-gray-200"
                                            placeholder="Question wording..."
                                        />
                                    </div>
                                    <div className="md:col-span-4">
                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-amrita-maroon/60">
                                                {fieldTypeIcons[field.type]}
                                            </div>
                                            <select
                                                value={field.type}
                                                onChange={(e) => updateField(field.id, { type: e.target.value as FieldType })}
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl font-semibold text-sm outline-none focus:ring-2 focus:ring-amrita-maroon/20 focus:bg-white transition-all appearance-none cursor-pointer"
                                            >
                                                <option value="text">Short Answer</option>
                                                <option value="longText">Paragraph</option>
                                                <option value="number">Number</option>
                                                <option value="email">Email</option>
                                                <option value="phone">Phone Number</option>
                                                <option value="radio">Multiple Choice</option>
                                                <option value="checkbox">Checkboxes</option>
                                                <option value="select">Dropdown</option>
                                                <option value="date">Date</option>
                                                <option value="time">Time</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Preview & Configuration */}
                                <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4">Live Preview & Options</h4>

                                    {/* Renderer based on type */}
                                    {renderFieldPreview(field, updateOption, addOption, removeOption)}
                                </div>

                                {/* Action Bar */}
                                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                                    <div className="flex items-center space-x-6">
                                        <label className="flex items-center space-x-2 cursor-pointer group">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={field.required}
                                                    onChange={(e) => updateField(field.id, { required: e.target.checked })}
                                                    className="sr-only"
                                                />
                                                <div className={`w-10 h-5 rounded-full transition-colors ${field.required ? 'bg-amrita-maroon' : 'bg-gray-200'}`} />
                                                <div className={`absolute left-1 w-3 h-3 bg-white rounded-full transition-transform ${field.required ? 'translate-x-5' : 'translate-x-0'}`} />
                                            </div>
                                            <span className="text-xs font-bold text-amrita-textGray group-hover:text-amrita-maroon">Required Field</span>
                                        </label>

                                        <div className="h-4 w-[1px] bg-gray-200" />

                                        <label className="flex items-center space-x-2 cursor-pointer group">
                                            <FaPlus className="text-gray-300 group-hover:text-amrita-maroon transition-colors" size={12} />
                                            <input
                                                type="text"
                                                placeholder="Add Help Text..."
                                                value={field.helpText || ''}
                                                onChange={(e) => updateField(field.id, { helpText: e.target.value })}
                                                className="text-xs font-medium bg-transparent outline-none text-gray-400 focus:text-amrita-textDark transition-all w-32 focus:w-48 placeholder:text-gray-300"
                                            />
                                        </label>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                        title="Delete Question"
                                    >
                                        <FaTrash size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={addField}
                className="w-full py-6 border-2 border-dashed border-gray-200 rounded-3xl text-gray-400 hover:text-amrita-maroon hover:border-amrita-maroon hover:bg-amrita-maroon/5 hover:scale-[0.99] transition-all flex flex-col items-center justify-center space-y-2 group"
            >
                <div className="bg-white p-3 rounded-full shadow-sm group-hover:shadow-md transition-all">
                    <FaPlus className="text-amrita-maroon" />
                </div>
                <span className="text-sm font-black uppercase tracking-widest">Add New Question</span>
            </button>
        </div>
    );
}

function renderFieldPreview(
    field: FormField,
    updateOption: (id: string, idx: number, val: string) => void,
    addOption: (id: string) => void,
    removeOption: (id: string, idx: number) => void
) {
    const textPreviewClass = "w-2/3 border-b border-dashed border-gray-300 py-1 text-gray-400 text-sm";

    switch (field.type) {
        case 'text':
        case 'email':
        case 'phone':
        case 'number':
            return <div className={textPreviewClass}>{field.placeholder || `Visual placeholder for ${field.type} input`}</div>;

        case 'longText':
            return (
                <div className="space-y-1">
                    <div className={textPreviewClass}>Visual placeholder for paragraph text...</div>
                    <div className={textPreviewClass}></div>
                </div>
            );

        case 'date':
            return <div className="flex items-center space-x-2 text-gray-400 text-sm"><FaCalendarAlt /> <span>mm/dd/yyyy</span></div>;

        case 'time':
            return <div className="flex items-center space-x-2 text-gray-400 text-sm"><FaRegClock /> <span>--:-- --</span></div>;

        case 'radio':
        case 'checkbox':
        case 'select':
            return (
                <div className="space-y-4">
                    {field.options.map((option, idx) => (
                        <div key={idx} className="flex items-center space-x-3 group/opt">
                            <div className={`flex-shrink-0 flex items-center justify-center ${field.type === 'radio' ? 'w-4 h-4 rounded-full' : field.type === 'checkbox' ? 'w-4 h-4 rounded-sm' : 'w-4 h-4'} ${field.type === 'select' ? 'text-gray-300' : 'border border-gray-300 text-gray-200 bg-white'}`}>
                                {field.type === 'radio' && <div className="w-2 h-2 rounded-full bg-current opacity-0" />}
                                {field.type === 'checkbox' && <div className="w-2 h-2 bg-current opacity-0" />}
                                {field.type === 'select' && <span className="text-[10px] font-bold">{idx + 1}.</span>}
                            </div>
                            <input
                                type="text"
                                value={option}
                                onChange={(e) => updateOption(field.id, idx, e.target.value)}
                                className="flex-1 bg-transparent border-b border-transparent focus:border-gray-200 outline-none text-sm font-medium text-amrita-textDark py-1 placeholder:text-gray-200"
                                placeholder={`Option ${idx + 1}`}
                            />
                            {field.options.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeOption(field.id, idx)}
                                    className="opacity-0 group-hover/opt:opacity-100 text-gray-300 hover:text-red-500 transition-all p-1"
                                >
                                    <FaTrash size={10} />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => addOption(field.id)}
                        className="flex items-center space-x-2 text-amrita-maroon text-xs font-bold hover:underline pl-7 mt-2"
                    >
                        <FaPlus size={8} />
                        <span>Add Another Option</span>
                    </button>

                    {field.type === 'select' && (
                        <div className="mt-4 flex items-center space-x-2 text-[10px] font-bold text-gray-400 bg-white p-2 border border-gray-100 rounded-lg inline-flex">
                            <FaList />
                            <span>This will appear as a Dropdown Select box</span>
                        </div>
                    )}
                </div>
            );

        default:
            return null;
    }
}
