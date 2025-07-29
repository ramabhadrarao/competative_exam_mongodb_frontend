import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';
import { Test, TestSubmission } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { formatDateTime, formatRelativeTime } from '../../utils/helpers';
import Loading from '../../components/UI/Loading';
import Button from '../../components/UI/Button';
import { ArrowLeft, CheckCircle, XCircle, Clock, Award } from 'lucide-react';

const TestResults: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [test, setTest] = useState<Test | null>(null);
  const [results, setResults] = useState<TestSubmission[]>([]);

  useEffect(() => {
    fetchResults();
  }, [id]);

  const fetchResults = async () => {
    try {
      const response = await api.getTestResults(id!);
      setTest(response.test);
      setResults(response.results);
    } catch (error) {
      console.error('Failed to fetch results:', error);
      navigate('/tests');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading fullScreen text="Loading results..." />;
  }

  if (!test || results.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">No results found</h2>
        <Button onClick={() => navigate('/tests')}>Back to Tests</Button>
      </div>
    );
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  // For students, show only their results
  const displayResults = user?.role === 'student' 
    ? results.filter(r => (r.student as any)._id === user.id)
    : results;

  const latestResult = displayResults[0];

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
          <h1 className="text-2xl font-bold text-gray-900">{test.title} - Results</h1>
          <p className="text-gray-600">View your test performance</p>
        </div>
      </div>

      {user?.role === 'student' && latestResult && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <div className={`text-6xl font-bold mb-2 ${getScoreColor(latestResult.percentage)}`}>
              {latestResult.percentage.toFixed(1)}%
            </div>
            <div className="text-2xl font-semibold text-gray-700 mb-4">
              Grade: {getGrade(latestResult.percentage)}
            </div>
            
            <div className="flex items-center justify-center space-x-8 mt-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {latestResult.score}/{test.totalPoints}
                </div>
                <div className="text-sm text-gray-600">Points Scored</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {Math.floor(latestResult.timeSpent / 60)}m {latestResult.timeSpent % 60}s
                </div>
                <div className="text-sm text-gray-600">Time Taken</div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">
                  {latestResult.attempt}
                </div>
                <div className="text-sm text-gray-600">Attempt</div>
              </div>
            </div>
          </div>

          {latestResult.answers && test.settings?.showResults && (
            <div className="mt-8 pt-8 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Question Review</h3>
              <div className="space-y-4">
                {latestResult.answers.map((answer, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-start">
                      <div className="mr-3 mt-1">
                        {answer.isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 mb-1">
                          Question {index + 1}
                        </div>
                        <div className="text-sm text-gray-600">
                          Your answer: {answer.answer || 'Not answered'}
                        </div>
                        {answer.points !== undefined && (
                          <div className="text-sm text-gray-500 mt-1">
                            Points: {answer.points} / {(answer.question as any)?.points || 0}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* All attempts or teacher/admin view */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {user?.role === 'student' ? 'Your Attempts' : 'All Submissions'}
          </h3>
        </div>
        
        <div className="divide-y">
          {displayResults.map((result) => (
            <div key={result._id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  {user?.role !== 'student' && (
                    <div className="font-medium text-gray-900 mb-1">
                      {(result.student as any).firstName} {(result.student as any).lastName}
                    </div>
                  )}
                  <div className="text-sm text-gray-600 space-x-4">
                    <span>Attempt #{result.attempt}</span>
                    <span>•</span>
                    <span>{formatDateTime(result.endTime || result.startTime)}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(result.endTime || result.startTime)}</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`text-2xl font-bold ${getScoreColor(result.percentage)}`}>
                    {result.percentage.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {result.score}/{test.totalPoints} points
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TestResults;