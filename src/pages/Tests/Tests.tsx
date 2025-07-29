import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Test } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/useToast';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDate, formatDateTime } from '../../utils/helpers';
import { SUBJECTS, GRADE_LEVELS } from '../../utils/constants';
import Loading from '../../components/UI/Loading';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Select from '../../components/UI/Select';
import Modal from '../../components/UI/Modal';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Clock,
  Calendar,
  Users
} from 'lucide-react';

const Tests: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();
  
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<Test | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [status, setStatus] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    fetchTests();
  }, [debouncedSearch, subject, grade, status, currentPage]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await api.getTests({
        page: currentPage,
        limit: 10,
        subject: subject || undefined,
        grade: grade || undefined,
        status: status || undefined,
      });
      
      setTests(response.tests);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (err) {
      error('Failed to fetch tests');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (test: Test) => {
    try {
      setDeleting(test._id);
      await api.deleteTest(test._id);
      success('Test deleted successfully');
      setDeleteModal(null);
      fetchTests();
    } catch (err) {
      error('Failed to delete test');
    } finally {
      setDeleting(null);
    }
  };

  const getTestStatus = (test: Test) => {
    const now = new Date();
    const startDate = new Date(test.startDate);
    const endDate = new Date(test.endDate);
    
    if (now < startDate) return 'upcoming';
    if (now > endDate) return 'completed';
    return 'active';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSubject('');
    setGrade('');
    setStatus('');
    setCurrentPage(1);
  };

  if (loading && tests.length === 0) {
    return <Loading fullScreen text="Loading tests..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tests</h1>
          <p className="text-gray-600">
            {user?.role === 'student' ? 'Available tests' : 'Manage your tests'}
          </p>
        </div>
        {user?.role !== 'student' && (
          <Button onClick={() => navigate('/tests/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Test
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search tests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select
            placeholder="All Subjects"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            options={SUBJECTS.map(s => ({ value: s, label: s }))}
          />
          
          <Select
            placeholder="All Grades"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            options={GRADE_LEVELS}
          />
          
          {user?.role === 'student' && (
            <Select
              placeholder="All Statuses"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'upcoming', label: 'Upcoming' },
                { value: 'completed', label: 'Completed' },
              ]}
            />
          )}
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-600">
            {total} test{total !== 1 ? 's' : ''} found
          </p>
          
          {(search || subject || grade || status) && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Tests List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {tests.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {tests.map((test) => {
              const testStatus = getTestStatus(test);
              const isStudent = user?.role === 'student';
              
              return (
                <div key={test._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {test.title}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(testStatus)}`}>
                          {testStatus}
                        </span>
                        {test.submissionStatus && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {test.submissionStatus}
                          </span>
                        )}
                      </div>
                      
                      {test.description && (
                        <p className="text-gray-600 mb-3">{test.description}</p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <FileText className="w-4 h-4 mr-1" />
                          {test.questions.length} questions
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {test.timeLimit} minutes
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(test.startDate)} - {formatDate(test.endDate)}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {test.subject}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">
                          Grade {test.grade}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      {isStudent ? (
                        <>
                          {testStatus === 'active' && test.submissionStatus !== 'completed' && (
                            <Button
                              onClick={() => navigate(`/tests/${test._id}/take`)}
                            >
                              Take Test
                            </Button>
                          )}
                          {test.submissionStatus === 'completed' && (
                            <Button
                              variant="outline"
                              onClick={() => navigate(`/tests/${test._id}/results`)}
                            >
                              View Results
                            </Button>
                          )}
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/tests/${test._id}/results`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/tests/${test._id}/edit`)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setDeleteModal(test)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tests found</h3>
            <p className="text-gray-600 mb-4">
              {search || subject || grade || status
                ? 'Try adjusting your filters'
                : user?.role === 'student'
                ? 'No tests are available at the moment'
                : 'Get started by creating your first test'
              }
            </p>
            {!search && !subject && !grade && !status && user?.role !== 'student' && (
              <Button onClick={() => navigate('/tests/create')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Test
              </Button>
            )}
          </div>
        )}
      </div>

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

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="Delete Test"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete "{deleteModal?.title}"? This action cannot be undone.
          </p>
          
          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setDeleteModal(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleting === deleteModal?._id}
              onClick={() => deleteModal && handleDelete(deleteModal)}
            >
              Delete Test
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Tests;