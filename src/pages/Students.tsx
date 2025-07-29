import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { useToast } from '../hooks/useToast';
import { useDebounce } from '../hooks/useDebounce';
import { formatDate } from '../utils/helpers';
import { GRADE_LEVELS } from '../utils/constants';
import Loading from '../components/UI/Loading';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import { 
  Users as UsersIcon, 
  Search, 
  UserCheck, 
  TrendingUp,
  Award
} from 'lucide-react';

const Students: React.FC = () => {
  const { error } = useToast();
  
  const [students, setStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [grade, setGrade] = useState('');
  const [sortBy, setSortBy] = useState('name');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    fetchStudents();
  }, [debouncedSearch, grade, sortBy, currentPage]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await api.getUsers({
        page: currentPage,
        limit: 20,
        role: 'student',
        search: debouncedSearch,
        grade: grade || undefined,
        sortBy,
      });
      
      setStudents(response.users);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (err) {
      error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentStats = async (studentId: string) => {
    try {
      const stats = await api.getUserStats(studentId);
      setSelectedStudent(students.find(s => s.id === studentId) || null);
      // Handle stats display
    } catch (err) {
      error('Failed to fetch student statistics');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setGrade('');
    setSortBy('name');
    setCurrentPage(1);
  };

  if (loading && students.length === 0) {
    return <Loading fullScreen text="Loading students..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600">View and manage student information</p>
        </div>
        <div className="text-sm text-gray-600">
          Total Students: <span className="font-semibold">{total}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search students by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select
            placeholder="All Grades"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            options={GRADE_LEVELS}
          />
          
          <Select
            placeholder="Sort by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={[
              { value: 'name', label: 'Name' },
              { value: 'grade', label: 'Grade' },
              { value: 'performance', label: 'Performance' },
              { value: 'recent', label: 'Recent Activity' },
            ]}
          />
        </div>
        
        {(search || grade) && (
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {students.map((student) => (
          <div
            key={student.id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => fetchStudentStats(student.id)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {student.firstName[0]}{student.lastName[0]}
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">
                    {student.firstName} {student.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">{student.email}</p>
                </div>
              </div>
              <UserCheck className="w-5 h-5 text-green-500" />
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Grade</span>
                <span className="font-medium">{student.grade}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tests Completed</span>
                <span className="font-medium">{student.stats?.testsCompleted || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Average Score</span>
                <span className="font-medium text-primary-600">
                  {student.stats?.averageScore || 0}%
                </span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-sm text-gray-500">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  <span>View Details</span>
                </div>
                <Award className="w-5 h-5 text-yellow-500" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {students.length === 0 && !loading && (
        <div className="text-center py-12">
          <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No students found</h3>
          <p className="text-gray-600">
            {search || grade ? 'Try adjusting your filters' : 'No students have registered yet'}
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing page {currentPage} of {totalPages}
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;