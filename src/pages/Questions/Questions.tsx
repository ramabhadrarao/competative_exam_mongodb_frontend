import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Question } from '../../types';
import { useToast } from '../../hooks/useToast';
import { useDebounce } from '../../hooks/useDebounce';
import { formatDate, getDifficultyColor } from '../../utils/helpers';
import { SUBJECTS, DIFFICULTY_LEVELS, QUESTION_TYPES, GRADE_LEVELS } from '../../utils/constants';
import Loading from '../../components/UI/Loading';
import Button from '../../components/UI/Button';
import Input from '../../components/UI/Input';
import Select from '../../components/UI/Select';
import Modal from '../../components/UI/Modal';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  Brain,
  Download
} from 'lucide-react';

const Questions: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<Question | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [type, setType] = useState('');
  const [grade, setGrade] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    fetchQuestions();
  }, [debouncedSearch, subject, difficulty, type, grade, currentPage]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const response = await api.getQuestions({
        page: currentPage,
        limit: 10,
        search: debouncedSearch,
        subject: subject || undefined,
        difficulty: difficulty || undefined,
        type: type || undefined,
      });
      
      setQuestions(response.questions);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (err) {
      error('Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (question: Question) => {
    try {
      setDeleting(question._id);
      await api.deleteQuestion(question._id);
      success('Question deleted successfully');
      setDeleteModal(null);
      fetchQuestions();
    } catch (err) {
      error('Failed to delete question');
    } finally {
      setDeleting(null);
    }
  };

  const clearFilters = () => {
    setSearch('');
    setSubject('');
    setDifficulty('');
    setType('');
    setGrade('');
    setCurrentPage(1);
  };

  if (loading && questions.length === 0) {
    return <Loading fullScreen text="Loading questions..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Questions</h1>
          <p className="text-gray-600">Manage your question library</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline"
            onClick={() => navigate('/questions/generate')}
          >
            <Brain className="w-4 h-4 mr-2" />
            AI Generate
          </Button>
          <Button onClick={() => navigate('/questions/create')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Question
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search questions..."
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
            placeholder="All Difficulties"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            options={DIFFICULTY_LEVELS}
          />
          
          <Select
            placeholder="All Types"
            value={type}
            onChange={(e) => setType(e.target.value)}
            options={QUESTION_TYPES}
          />
          
          <Select
            placeholder="All Grades"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            options={GRADE_LEVELS}
          />
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-600">
            {total} question{total !== 1 ? 's' : ''} found
          </p>
          
          {(search || subject || difficulty || type || grade) && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Questions List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {questions.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {questions.map((question) => (
              <div key={question._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {question.title}
                      </h3>
                      {question.isAIGenerated && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <Brain className="w-3 h-3 mr-1" />
                          AI Generated
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-600 mb-3 line-clamp-2">{question.content}</p>
                    
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                        {question.subject}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-800">
                        {question.type.replace('-', ' ')}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full ${getDifficultyColor(question.difficulty)}`}>
                        {question.difficulty}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-100 text-green-800">
                        Grade {question.grade}
                      </span>
                      <span className="text-gray-500">
                        {question.points} point{question.points !== 1 ? 's' : ''}
                      </span>
                      <span className="text-gray-500">
                        Created {formatDate(question.createdAt)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/questions/${question._id}/view`)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/questions/${question._id}/edit`)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeleteModal(question)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
            <p className="text-gray-600 mb-4">
              {search || subject || difficulty || type || grade
                ? 'Try adjusting your filters'
                : 'Get started by creating your first question'
              }
            </p>
            {!search && !subject && !difficulty && !type && !grade && (
              <Button onClick={() => navigate('/questions/create')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Question
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
        title="Delete Question"
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
              Delete Question
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Questions;