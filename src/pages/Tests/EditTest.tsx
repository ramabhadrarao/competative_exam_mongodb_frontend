import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Question, Test } from '../../types';
import { useToast } from '../../hooks/useToast';
import { validateTestForm } from '../../utils/validation';
import { SUBJECTS, GRADE_LEVELS } from '../../utils/constants';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Select from '../../components/UI/Select';
import Modal from '../../components/UI/Modal';
import Loading from '../../components/UI/Loading';
import { Plus, Save, ArrowLeft, Search, X } from 'lucide-react';

const EditTest: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { success, error } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchingQuestions, setSearchingQuestions] = useState(false);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [questionModal, setQuestionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    grade: '',
    questions: [] as Array<{ question: Question; points: number; order: number }>,
    timeLimit: 60,
    attempts: 1,
    startDate: '',
    endDate: '',
    settings: {
      shuffleQuestions: false,
      shuffleOptions: false,
      showResults: true,
      allowReview: true,
      requirePassword: false,
      password: '',
    },
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchTest();
  }, [id]);

  const fetchTest = async () => {
    try {
      const test = await api.getTest(id!);
      
      // Format dates for datetime-local input
      const formatDateForInput = (dateString: string) => {
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
      };
      
      setFormData({
        title: test.title,
        description: test.description || '',
        subject: test.subject,
        grade: test.grade,
        questions: test.questions.map(q => ({
          question: typeof q.question === 'string' ? { _id: q.question } as Question : q.question,
          points: q.points,
          order: q.order,
        })),
        timeLimit: test.timeLimit,
        attempts: test.attempts,
        startDate: formatDateForInput(test.startDate),
        endDate: formatDateForInput(test.endDate),
        settings: test.settings || {
          shuffleQuestions: false,
          shuffleOptions: false,
          showResults: true,
          allowReview: true,
          requirePassword: false,
          password: '',
        },
      });
    } catch (err) {
      error('Failed to fetch test');
      navigate('/tests');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('settings.')) {
      const settingName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingName]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const searchQuestions = async () => {
    if (!formData.subject) {
      error('Please select a subject first');
      return;
    }
    
    setSearchingQuestions(true);
    try {
      const response = await api.getQuestions({
        subject: formData.subject,
        grade: formData.grade,
        search: searchQuery,
        limit: 50,
      });
      setAvailableQuestions(response.questions);
      setQuestionModal(true);
    } catch (err) {
      error('Failed to fetch questions');
    } finally {
      setSearchingQuestions(false);
    }
  };

  const addQuestion = (question: Question) => {
    if (formData.questions.some(q => q.question._id === question._id)) {
      error('Question already added');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question,
          points: question.points,
          order: prev.questions.length + 1,
        },
      ],
    }));
    
    success('Question added');
  };

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index).map((q, i) => ({
        ...q,
        order: i + 1,
      })),
    }));
  };

  const updateQuestionPoints = (index: number, points: number) => {
    const newQuestions = [...formData.questions];
    newQuestions[index].points = points;
    setFormData(prev => ({ ...prev, questions: newQuestions }));
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...formData.questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= newQuestions.length) return;
    
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    
    newQuestions.forEach((q, i) => {
      q.order = i + 1;
    });
    
    setFormData(prev => ({ ...prev, questions: newQuestions }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateTestForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setSaving(true);
    try {
      const testData = {
        ...formData,
        questions: formData.questions.map(q => ({
          question: q.question._id,
          points: q.points,
          order: q.order,
        })),
      };
      
      await api.updateTest(id!, testData);
      success('Test updated successfully');
      navigate('/tests');
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update test');
    } finally {
      setSaving(false);
    }
  };

  const getTotalPoints = () => {
    return formData.questions.reduce((sum, q) => sum + q.points, 0);
  };

  if (loading) {
    return <Loading fullScreen text="Loading test..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={() => navigate('/tests')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tests
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Test</h1>
          <p className="text-gray-600">Update test details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="lg:col-span-2">
              <Input
                label="Test Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                error={errors.title}
                placeholder="Enter test title"
                required
              />
            </div>
            
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="input"
                placeholder="Provide test instructions or description..."
              />
            </div>
            
            <Select
              label="Subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              error={errors.subject}
              options={SUBJECTS.map(s => ({ value: s, label: s }))}
              placeholder="Select subject"
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
              label="Time Limit (minutes)"
              name="timeLimit"
              type="number"
              min="1"
              value={formData.timeLimit}
              onChange={handleChange}
              error={errors.timeLimit}
              required
            />
            
            <Input
              label="Maximum Attempts"
              name="attempts"
              type="number"
              min="1"
              value={formData.attempts}
              onChange={handleChange}
              error={errors.attempts}
              required
            />
            
            <Input
              label="Start Date & Time"
              name="startDate"
              type="datetime-local"
              value={formData.startDate}
              onChange={handleChange}
              error={errors.startDate}
              required
            />
            
            <Input
              label="End Date & Time"
              name="endDate"
              type="datetime-local"
              value={formData.endDate}
              onChange={handleChange}
              error={errors.endDate}
              required
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Questions</h2>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Total Points: <span className="font-semibold">{getTotalPoints()}</span>
              </span>
              <Button
                type="button"
                variant="outline"
                onClick={searchQuestions}
                loading={searchingQuestions}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Questions
              </Button>
            </div>
          </div>
          
          {formData.questions.length > 0 ? (
            <div className="space-y-3">
              {formData.questions.map((item, index) => (
                <div key={item.question._id} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">
                      {index + 1}. {item.question.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {item.question.content}
                    </p>
                    <div className="flex items-center space-x-3 text-xs">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {item.question.type?.replace('-', ' ') || 'N/A'}
                      </span>
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                        {item.question.difficulty || 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      min="1"
                      value={item.points}
                      onChange={(e) => updateQuestionPoints(index, Number(e.target.value))}
                      className="w-20"
                    />
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => moveQuestion(index, 'up')}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => moveQuestion(index, 'down')}
                      disabled={index === formData.questions.length - 1}
                    >
                      ↓
                    </Button>
                    
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => removeQuestion(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No questions added yet. Click "Add Questions" to get started.
            </div>
          )}
          
          {errors.questions && (
            <p className="mt-2 text-sm text-red-600">{errors.questions}</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Test Settings</h2>
          
          <div className="space-y-4">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="settings.shuffleQuestions"
                checked={formData.settings.shuffleQuestions}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-700">Shuffle questions order</span>
            </label>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="settings.shuffleOptions"
                checked={formData.settings.shuffleOptions}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-700">Shuffle answer options</span>
            </label>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="settings.showResults"
                checked={formData.settings.showResults}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-700">Show results after submission</span>
            </label>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                name="settings.allowReview"
                checked={formData.settings.allowReview}
                onChange={handleChange}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-gray-700">Allow students to review answers</span>
            </label>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  name="settings.requirePassword"
                  checked={formData.settings.requirePassword}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-gray-700">Require password to access test</span>
              </label>
              
              {formData.settings.requirePassword && (
                <Input
                  label="Test Password"
                  name="settings.password"
                  type="password"
                  value={formData.settings.password}
                  onChange={handleChange}
                  placeholder="Enter test password"
                  className="ml-7"
                />
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/tests')}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={saving}
          >
            <Save className="w-4 h-4 mr-2" />
            Update Test
          </Button>
        </div>
      </form>

      <Modal
        isOpen={questionModal}
        onClose={() => setQuestionModal(false)}
        title="Add Questions"
        size="xl"
      >
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="max-h-96 overflow-y-auto space-y-3">
            {availableQuestions.map((question) => (
              <div
                key={question._id}
                className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => addQuestion(question)}
              >
                <h4 className="font-medium text-gray-900 mb-1">{question.title}</h4>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{question.content}</p>
                <div className="flex items-center space-x-3 text-xs">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {question.type.replace('-', ' ')}
                  </span>
                  <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                    {question.difficulty}
                  </span>
                  <span className="text-gray-500">{question.points} points</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EditTest;