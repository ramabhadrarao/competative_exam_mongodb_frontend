import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Question, Test } from '../types';
import { formatDate } from '../utils/helpers';
import Loading from '../components/UI/Loading';
import { 
  BookOpen, 
  FileText, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle,
  Award,
  Brain
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [recentQuestions, setRecentQuestions] = useState<Question[]>([]);
  const [recentTests, setRecentTests] = useState<Test[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [questionsResponse, testsResponse] = await Promise.all([
          api.getQuestions({ limit: 5 }),
          api.getTests({ limit: 5 }),
        ]);

        setRecentQuestions(questionsResponse.questions);
        setRecentTests(testsResponse.tests);
        
        // Mock stats - replace with actual API calls
        setStats({
          totalQuestions: questionsResponse.total,
          totalTests: testsResponse.total,
          averageScore: user?.stats?.averageScore || 0,
          testsCompleted: user?.stats?.testsCompleted || 0,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return <Loading fullScreen text="Loading dashboard..." />;
  }

  const getStatsCards = () => {
    if (user?.role === 'student') {
      return [
        {
          title: 'Tests Completed',
          value: stats.testsCompleted,
          icon: CheckCircle,
          color: 'bg-green-500',
          change: '+12%',
        },
        {
          title: 'Average Score',
          value: `${stats.averageScore}%`,
          icon: Award,
          color: 'bg-blue-500',
          change: '+5%',
        },
        {
          title: 'Study Streak',
          value: '7 days',
          icon: TrendingUp,
          color: 'bg-purple-500',
          change: '+2 days',
        },
        {
          title: 'Time Studied',
          value: '24h',
          icon: Clock,
          color: 'bg-orange-500',
          change: '+3h',
        },
      ];
    }

    return [
      {
        title: 'Total Questions',
        value: stats.totalQuestions,
        icon: BookOpen,
        color: 'bg-blue-500',
        change: '+12',
      },
      {
        title: 'Total Tests',
        value: stats.totalTests,
        icon: FileText,
        color: 'bg-green-500',
        change: '+3',
      },
      {
        title: 'Active Students',
        value: '156',
        icon: Users,
        color: 'bg-purple-500',
        change: '+8',
      },
      {
        title: 'AI Generated',
        value: '42',
        icon: Brain,
        color: 'bg-orange-500',
        change: '+15',
      },
    ];
  };

  const statsCards = getStatsCards();

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card) => (
          <div key={card.title} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                <p className="text-green-600 text-sm font-medium mt-1">{card.change} from last week</p>
              </div>
              <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Questions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BookOpen className="w-5 h-5 mr-2 text-primary-600" />
              Recent Questions
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {recentQuestions.length > 0 ? (
              recentQuestions.map((question) => (
                <div key={question._id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{question.title}</h4>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{question.content}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {question.subject}
                      </span>
                      <span className={`px-2 py-1 rounded-full ${
                        question.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                        question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {question.difficulty}
                      </span>
                      <span>{formatDate(question.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No questions available</p>
            )}
          </div>
        </div>

        {/* Recent Tests */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-primary-600" />
              Recent Tests
            </h3>
          </div>
          <div className="p-6 space-y-4">
            {recentTests.length > 0 ? (
              recentTests.map((test) => (
                <div key={test._id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{test.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{test.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                        {test.subject}
                      </span>
                      <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                        Grade {test.grade}
                      </span>
                      <span>{test.questions.length} questions</span>
                      <span>{test.timeLimit} min</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No tests available</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {user?.role !== 'student' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group">
              <BookOpen className="w-8 h-8 text-gray-400 group-hover:text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Create Question</p>
              <p className="text-xs text-gray-500">Add a new question to the library</p>
            </button>
            
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group">
              <FileText className="w-8 h-8 text-gray-400 group-hover:text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">Create Test</p>
              <p className="text-xs text-gray-500">Build a new test from questions</p>
            </button>
            
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors group">
              <Brain className="w-8 h-8 text-gray-400 group-hover:text-primary-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">AI Generate</p>
              <p className="text-xs text-gray-500">Generate questions with AI</p>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;