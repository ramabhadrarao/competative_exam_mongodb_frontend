import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Test, Question } from '../../types';
import { useToast } from '../../hooks/useToast';
import { calculateTimeRemaining } from '../../utils/helpers';
import Button from '../../components/UI/Button';
import Loading from '../../components/UI/Loading';
import Modal from '../../components/UI/Modal';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface TestQuestion extends Question {
  _id: string;
  points: number;
  order: number;
}

const TakeTest: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { success, error } = useToast();
  const [test, setTest] = useState<Test | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<{ minutes: number; seconds: number; isExpired: boolean }>({
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [testPassword, setTestPassword] = useState('');
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [endTime, setEndTime] = useState<Date | null>(null);

  useEffect(() => {
    fetchTest();
  }, [id]);

  useEffect(() => {
    if (!testStarted || !endTime) return;

    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(endTime, new Date());
      setTimeRemaining(remaining);

      if (remaining.isExpired) {
        handleSubmit(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [testStarted, endTime]);

  const fetchTest = async () => {
    try {
      const testData = await api.getTest(id!);
      setTest(testData);
      
      if (testData.settings?.requirePassword) {
        setShowPasswordModal(true);
      }
    } catch (err) {
      error('Failed to fetch test');
      navigate('/tests');
    } finally {
      setLoading(false);
    }
  };

  const startTest = async (password?: string) => {
    if (!test) return;

    setStarting(true);
    try {
      const response = await api.startTest(test._id, password);
      setSubmissionId(response.submission.id);
      
      // Calculate end time
      const end = new Date();
      end.setMinutes(end.getMinutes() + response.submission.timeLimit);
      setEndTime(end);
      
      setTestStarted(true);
      setShowPasswordModal(false);
      success('Test started! Good luck!');
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to start test');
    } finally {
      setStarting(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!test || !submissionId) return;

    if (!autoSubmit) {
      const unanswered = test.questions.filter(q => {
        const question = typeof q.question === 'object' ? q.question : null;
        return question && !answers[question._id];
      });

      if (unanswered.length > 0) {
        const confirmSubmit = window.confirm(
          `You have ${unanswered.length} unanswered question(s). Are you sure you want to submit?`
        );
        if (!confirmSubmit) return;
      }
    }

    setSubmitting(true);
    try {
      const submissionAnswers = test.questions.map(q => {
        const question = typeof q.question === 'object' ? q.question : null;
        if (!question) return null;
        
        return {
          question: question._id,
          answer: answers[question._id] || '',
          timeSpent: 0, // You could track this per question if needed
        };
      }).filter(Boolean);

      const result = await api.submitTest(test._id, submissionAnswers);
      
      if (autoSubmit) {
        success('Time\'s up! Test submitted automatically.');
      } else {
        success('Test submitted successfully!');
      }
      
      // Navigate to results if allowed
      if (test.settings?.showResults) {
        navigate(`/tests/${test._id}/results`);
      } else {
        navigate('/tests');
      }
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to submit test');
    } finally {
      setSubmitting(false);
    }
  };

  const goToQuestion = (index: number) => {
    if (index >= 0 && index < test!.questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  if (loading) {
    return <Loading fullScreen text="Loading test..." />;
  }

  if (!test) {
    return <div>Test not found</div>;
  }

  const currentTestQuestion = test.questions[currentQuestionIndex];
  const currentQuestion = typeof currentTestQuestion?.question === 'object' 
    ? currentTestQuestion.question 
    : null;

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => (
              <label
                key={index}
                className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion._id}`}
                  value={option.text}
                  checked={answers[currentQuestion._id] === option.text}
                  onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-gray-700">{option.text}</span>
              </label>
            ))}
          </div>
        );

      case 'true-false':
        return (
          <div className="space-y-3">
            {['True', 'False'].map((option) => (
              <label
                key={option}
                className="flex items-center space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion._id}`}
                  value={option.toLowerCase()}
                  checked={answers[currentQuestion._id] === option.toLowerCase()}
                  onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
                  className="text-primary-600 focus:ring-primary-500"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'short-answer':
        return (
          <textarea
            value={answers[currentQuestion._id] || ''}
            onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Enter your answer..."
          />
        );

      case 'essay':
        return (
          <textarea
            value={answers[currentQuestion._id] || ''}
            onChange={(e) => handleAnswerChange(currentQuestion._id, e.target.value)}
            rows={8}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="Write your essay..."
          />
        );

      default:
        return null;
    }
  };

  if (!testStarted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{test.title}</h1>
          {test.description && (
            <p className="text-gray-600 mb-6">{test.description}</p>
          )}
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-600">Subject</span>
              <span className="font-medium">{test.subject}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-600">Total Questions</span>
              <span className="font-medium">{test.questions.length}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-600">Total Points</span>
              <span className="font-medium">{test.totalPoints}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-600">Time Limit</span>
              <span className="font-medium">{test.timeLimit} minutes</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-600">Attempts Allowed</span>
              <span className="font-medium">{test.attempts}</span>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Important Instructions:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Once you start the test, the timer will begin immediately</li>
                  <li>You cannot pause or restart the test</li>
                  <li>Make sure you have a stable internet connection</li>
                  <li>The test will auto-submit when time expires</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate('/tests')}
            >
              Cancel
            </Button>
            <Button
              onClick={() => startTest()}
              loading={starting}
            >
              Start Test
            </Button>
          </div>
        </div>

        <Modal
          isOpen={showPasswordModal}
          onClose={() => {
            setShowPasswordModal(false);
            navigate('/tests');
          }}
          title="Test Password Required"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              This test requires a password to access. Please enter the password provided by your instructor.
            </p>
            <input
              type="password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Enter test password"
              autoFocus
            />
            <div className="flex items-center justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPasswordModal(false);
                  navigate('/tests');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => startTest(testPassword)}
                loading={starting}
                disabled={!testPassword}
              >
                Start Test
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Test Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
            <p className="text-gray-600 mt-1">
              Question {currentQuestionIndex + 1} of {test.questions.length}
            </p>
          </div>
          <div className={`flex items-center space-x-2 text-lg font-semibold ${
            timeRemaining.minutes < 5 ? 'text-red-600' : 'text-gray-700'
          }`}>
            <Clock className="w-5 h-5" />
            <span>
              {String(timeRemaining.minutes).padStart(2, '0')}:
              {String(timeRemaining.seconds).padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>

      {/* Question Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {test.questions.map((q, index) => {
            const question = typeof q.question === 'object' ? q.question : null;
            const isAnswered = question && !!answers[question._id];
            const isCurrent = index === currentQuestionIndex;
            
            return (
              <button
                key={index}
                onClick={() => goToQuestion(index)}
                className={`
                  w-10 h-10 rounded-lg font-medium transition-colors
                  ${isCurrent ? 'bg-primary-600 text-white' : 
                    isAnswered ? 'bg-green-100 text-green-800 hover:bg-green-200' : 
                    'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                `}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Current Question */}
      {currentQuestion && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="mb-6">
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex-1">
                {currentQuestion.content}
              </h2>
              <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {currentTestQuestion.points} point{currentTestQuestion.points !== 1 ? 's' : ''}
              </span>
            </div>
            
            {renderQuestion()}
          </div>

          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => goToQuestion(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>
            
            {currentQuestionIndex < test.questions.length - 1 ? (
              <Button
                onClick={() => goToQuestion(currentQuestionIndex + 1)}
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={() => handleSubmit()}
                loading={submitting}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Test
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TakeTest;