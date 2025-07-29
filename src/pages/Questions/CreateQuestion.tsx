import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { QuestionOption } from '../../types';
import { useToast } from '../../hooks/useToast';
import { validateQuestionForm } from '../../utils/validation';
import { SUBJECTS, DIFFICULTY_LEVELS, QUESTION_TYPES, GRADE_LEVELS } from '../../utils/constants';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Select from '../../components/UI/Select';
import { Plus, Minus, Save, ArrowLeft } from 'lucide-react';

const CreateQuestion: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'multiple-choice',
    subject: '',
    topic: '',
    difficulty: 'medium',
    grade: '',
    points: 1,
    explanation: '',
    correctAnswer: '',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ] as QuestionOption[],
    tags: [] as string[],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleOptionChange = (index: number, field: keyof QuestionOption, value: string | boolean) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    
    // If setting this option as correct, unset others for single-correct questions
    if (field === 'isCorrect' && value === true && formData.type === 'multiple-choice') {
      newOptions.forEach((option, i) => {
        if (i !== index) option.isCorrect = false;
      });
    }
    
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { text: '', isCorrect: false }]
    }));
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateQuestionForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setLoading(true);
    try {
      await api.createQuestion(formData);
      success('Question created successfully');
      navigate('/questions');
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create question');
    } finally {
      setLoading(false);
    }
  };

  const renderQuestionTypeFields = () => {
    switch (formData.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Options</label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOption}
                disabled={formData.options.length >= 6}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Option
              </Button>
            </div>
            
            <div className="space-y-3">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="correctOption"
                    checked={option.isCorrect}
                    onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <input
                      type="text"
                      value={option.text}
                      onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                      placeholder={`Option ${index + 1}`}
                      className="input"
                      required
                    />
                  </div>
                  {formData.options.length > 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(index)}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {errors.options && (
              <p className="text-sm text-red-600">{errors.options}</p>
            )}
          </div>
        );

      case 'true-false':
        return (
          <Select
            label="Correct Answer"
            name="correctAnswer"
            value={formData.correctAnswer}
            onChange={handleChange}
            error={errors.correctAnswer}
            options={[
              { value: 'true', label: 'True' },
              { value: 'false', label: 'False' },
            ]}
            placeholder="Select correct answer"
          />
        );

      case 'short-answer':
      case 'essay':
        return (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sample Answer (Optional)
            </label>
            <textarea
              name="correctAnswer"
              value={formData.correctAnswer}
              onChange={handleChange}
              rows={3}
              className="input"
              placeholder="Provide a sample answer or key points..."
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={() => navigate('/questions')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Questions
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Question</h1>
          <p className="text-gray-600">Add a new question to your library</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <Input
                label="Question Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={errors.title}
                placeholder="Enter a descriptive title"
                required
              />
            </div>
            
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Content
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                rows={4}
                className={`input ${errors.content ? 'border-red-300' : ''}`}
                placeholder="Enter the question content..."
                required
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content}</p>
              )}
            </div>
            
            <Select
              label="Question Type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              error={errors.type}
              options={QUESTION_TYPES}
            />
            
            <Select
              label="Subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              error={errors.subject}
              options={SUBJECTS.map(s => ({ value: s, label: s }))}
              placeholder="Select subject"
            />
            
            <Input
              label="Topic"
              name="topic"
              value={formData.topic}
              onChange={handleChange}
              error={errors.topic}
              placeholder="e.g., Quadratic Equations"
              required
            />
            
            <Select
              label="Difficulty"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              error={errors.difficulty}
              options={DIFFICULTY_LEVELS}
            />
            
            <Select
              label="Grade Level"
              name="grade"
              value={formData.grade}
              onChange={handleChange}
              error={errors.grade}
              options={GRADE_LEVELS}
              placeholder="Select grade"
            />
            
            <Input
              label="Points"
              name="points"
              type="number"
              min="1"
              value={formData.points}
              onChange={handleChange}
              error={errors.points}
              required
            />
          </div>
        </div>

        {/* Question Type Specific Fields */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Answer Configuration</h2>
          {renderQuestionTypeFields()}
        </div>

        {/* Additional Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Additional Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Explanation (Optional)
              </label>
              <textarea
                name="explanation"
                value={formData.explanation}
                onChange={handleChange}
                rows={3}
                className="input"
                placeholder="Provide an explanation for the correct answer..."
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/questions')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
          >
            <Save className="w-4 h-4 mr-2" />
            Create Question
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateQuestion;