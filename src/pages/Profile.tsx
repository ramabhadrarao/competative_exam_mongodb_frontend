import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { useToast } from '../hooks/useToast';
import { validatePassword } from '../utils/validation';
import { LANGUAGES, DIFFICULTY_LEVELS, SUBJECTS } from '../utils/constants';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import { User, Lock, Settings, Award } from 'lucide-react';

const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { success, error } = useToast();
  
  const [activeTab, setActiveTab] = useState('personal');
  const [loading, setLoading] = useState(false);
  
  // Personal Information
  const [personalInfo, setPersonalInfo] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
  });
  
  // Preferences
  const [preferences, setPreferences] = useState({
    language: user?.preferences?.language || 'en',
    difficulty: user?.preferences?.difficulty || 'medium',
    subjects: user?.preferences?.subjects || [],
  });
  
  // Password Change
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePersonalInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPersonalInfo(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePreferencesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPreferences(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handlePersonalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    if (!personalInfo.firstName) newErrors.firstName = 'First name is required';
    if (!personalInfo.lastName) newErrors.lastName = 'Last name is required';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    try {
      // Update user profile via API
      await api.updateProfile({
        firstName: personalInfo.firstName,
        lastName: personalInfo.lastName,
      });
      
      // Update local user state
      if (user) {
        updateUser({
          ...user,
          firstName: personalInfo.firstName,
          lastName: personalInfo.lastName,
        });
      }
      
      success('Profile updated successfully');
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      await api.updateProfile({ preferences });
      
      if (user) {
        updateUser({
          ...user,
          preferences,
        });
      }
      
      success('Preferences updated successfully');
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (!validatePassword(passwordData.newPassword)) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    try {
      await api.changePassword(passwordData.currentPassword, passwordData.newPassword);
      success('Password changed successfully');
      
      // Clear password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Personal Information', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'stats', label: 'Statistics', icon: Award },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors
                    ${activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <form onSubmit={handlePersonalInfoSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="First Name"
                  name="firstName"
                  value={personalInfo.firstName}
                  onChange={handlePersonalInfoChange}
                  error={errors.firstName}
                  required
                />
                
                <Input
                  label="Last Name"
                  name="lastName"
                  value={personalInfo.lastName}
                  onChange={handlePersonalInfoChange}
                  error={errors.lastName}
                  required
                />
                
                <div className="md:col-span-2">
                  <Input
                    label="Email Address"
                    type="email"
                    name="email"
                    value={personalInfo.email}
                    disabled
                    helperText="Email cannot be changed"
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <Button type="submit" loading={loading}>
                  Save Changes
                </Button>
              </div>
            </form>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <form onSubmit={handlePreferencesSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="Preferred Language"
                  name="language"
                  value={preferences.language}
                  onChange={handlePreferencesChange}
                  options={LANGUAGES}
                />
                
                <Select
                  label="Preferred Difficulty"
                  name="difficulty"
                  value={preferences.difficulty}
                  onChange={handlePreferencesChange}
                  options={DIFFICULTY_LEVELS}
                />
              </div>
              
              <div className="pt-4">
                <Button type="submit" loading={loading}>
                  Save Preferences
                </Button>
              </div>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div className="max-w-md">
                <Input
                  label="Current Password"
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  error={errors.currentPassword}
                  required
                />
                
                <div className="mt-4">
                  <Input
                    label="New Password"
                    type="password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    error={errors.newPassword}
                    helperText="Minimum 6 characters"
                    required
                  />
                </div>
                
                <div className="mt-4">
                  <Input
                    label="Confirm New Password"
                    type="password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    error={errors.confirmPassword}
                    required
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <Button type="submit" loading={loading}>
                  Change Password
                </Button>
              </div>
            </form>
          )}

          {/* Statistics Tab */}
          {activeTab === 'stats' && user?.role === 'student' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {user.stats?.testsCompleted || 0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Tests Completed</div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {user.stats?.averageScore || 0}%
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Average Score</div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {user.stats?.totalQuestions || 0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Questions Answered</div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {user.stats?.correctAnswers || 0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Correct Answers</div>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">Performance Summary</h3>
                <p className="text-blue-700">
                  You have completed {user.stats?.testsCompleted || 0} tests with an average score of{' '}
                  {user.stats?.averageScore || 0}%. Keep up the good work!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;