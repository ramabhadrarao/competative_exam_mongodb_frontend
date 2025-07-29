import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { useToast } from '../../hooks/useToast';
import { SUBJECTS, DIFFICULTY_LEVELS, QUESTION_TYPES, GRADE_LEVELS } from '../../utils/constants';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Select from '../../components/UI/Select';
import Loading from '../../components/UI/Loading';
import { Brain, ArrowLeft, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const GenerateQuestions: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  
  const [formData, setFormData] = useState({
    prompt: '',
    subject: '',
    topic: '',
    difficulty: 'medium',
    grade: '',
    type: 'multiple-choice',
    count: 3,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (jobId && jobStatus?.state !== 'completed' && jobStatus?.state !== 'failed') {
      interval = setInterval(checkJobStatus, 2000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [jobId, jobStatus]);

  const checkJobStatus = async () => {
    if (!jobId || checkingStatus) return;
    
    setCheckingStatus(true);
    try {
      const status = await api.getGenerationStatus(jobId);
      setJobStatus(status);
      
      if (status.state === 'completed') {
        success('Questions generated successfully!');
      } else if (status.state === 'failed') {
        error(status.failedReason || 'Generation failed');
      }
    } catch (err) {
      console.error('Error checking job status:', err);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.prompt) newErrors.prompt = 'Topic or prompt is required';
    if (!formData.subject) newErrors.subject = 'Subject is required';
    if (!formData.topic) newErrors.topic = 'Topic is required';
    if (!formData.grade) newErrors.grade = 'Grade is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const response = await api.generateQuestions({
        ...formData,
        count: Number(formData.count),
      });
      setJobId(response.jobId);
      setJobStatus({ state: 'waiting' });
      success('Generation started! This may take 2-5 minutes.');
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to start generation');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!jobStatus) return null;
    
    switch (jobStatus.state) {
      case 'completed':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'failed':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      case 'active':
      case 'waiting':
      default:
        return <Clock className="w-8 h-8 text-blue-500 animate-pulse" />;
    }
  };

  const getStatusText = () => {
    if (!jobStatus) return '';
    
    switch (jobStatus.state) {
      case 'completed':
        return 'Questions generated successfully!';
      case 'failed':
        return 'Generation failed. Please try again.';
      case 'active':
        return 'Generating questions...';
      case 'waiting':
      default:
        return 'Starting generation...';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          onClick={() => navigate('/questions')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Questions
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Question Generation</h1>
          <p className="text-gray-600">Generate high-quality questions using AI</p>
        </div>
      </div>

      {!jobId ? (
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Generation Parameters</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Topic or Prompt
                </label>
                <textarea
                  name="prompt"
                  value={formData.prompt}
                  onChange={handleChange}
                  rows={4}
                  className={`input ${errors.prompt ? 'border-red-300' : ''}`}
                  placeholder="Describe the topic or content you want questions about. Be specific for better results."
                  required
                />
                {errors.prompt && (
                  <p className="mt-1 text-sm text-red-600">{errors.prompt}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                
                <Select
                  label="Question Type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  options={QUESTION_TYPES}
                />
                
                <Select
                  label="Number of Questions"
                  name="count"
                  value={formData.count.toString()}
                  onChange={handleChange}
                  options={[
                    { value: '1', label: '1 Question' },
                    { value: '3', label: '3 Questions' },
                    { value: '5', label: '5 Questions' },
                    { value: '10', label: '10 Questions' },
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <div className="flex items-start space-x-3">
              <Brain className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-medium text-blue-900 mb-2">
                  AI-Powered Generation
                </h3>
                <p className="text-blue-700">
                  Our AI will generate high-quality questions based on your specifications. 
                  This process may take 2-5 minutes depending on the number of questions.
                </p>
              </div>
            </div>
          </div>

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
              <Brain className="w-4 h-4 mr-2" />
              Generate Questions
            </Button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              {getStatusIcon()}
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {getStatusText()}
            </h3>
            
            {jobStatus?.progress && (
              <div className="mt-4">
                <div className="bg-gray-200 rounded-full h-2 mb-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${jobStatus.progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">{jobStatus.progress}% complete</p>
              </div>
            )}
            
            {jobStatus?.state === 'completed' && (
              <div className="mt-6 space-y-4">
                <p className="text-gray-600">
                  Successfully generated {jobStatus.result?.count || 0} questions!
                </p>
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    onClick={() => navigate('/questions')}
                  >
                    View Questions
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setJobId(null);
                      setJobStatus(null);
                    }}
                  >
                    Generate More
                  </Button>
                </div>
              </div>
            )}
            
            {jobStatus?.state === 'failed' && (
              <div className="mt-6 space-y-4">
                <p className="text-red-600">
                  {jobStatus.failedReason || 'An error occurred during generation.'}
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setJobId(null);
                    setJobStatus(null);
                  }}
                >
                  Try Again
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateQuestions;