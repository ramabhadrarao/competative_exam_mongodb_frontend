import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User } from '../types';
import { useToast } from '../hooks/useToast';
import { useDebounce } from '../hooks/useDebounce';
import { formatDate } from '../utils/helpers';
import Loading from '../components/UI/Loading';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Select from '../components/UI/Select';
import Modal from '../components/UI/Modal';
import { 
  Users as UsersIcon, 
  Search, 
  Edit, 
  Trash2, 
  UserCheck,
  UserX,
  Shield
} from 'lucide-react';

const Users: React.FC = () => {
  const { success, error } = useToast();
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionModal, setActionModal] = useState<{ type: 'activate' | 'deactivate' | 'delete', user: User } | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState('true');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    fetchUsers();
  }, [debouncedSearch, role, isActive, currentPage]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.getUsers({
        page: currentPage,
        limit: 20,
        search: debouncedSearch,
        role: role || undefined,
        isActive: isActive === 'all' ? undefined : isActive === 'true',
      });
      
      setUsers(response.users);
      setTotalPages(response.totalPages);
      setTotal(response.total);
    } catch (err) {
      error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async () => {
    if (!actionModal) return;
    
    try {
      if (actionModal.type === 'activate') {
        await api.activateUser(actionModal.user.id);
        success('User activated successfully');
      } else if (actionModal.type === 'deactivate') {
        await api.deactivateUser(actionModal.user.id);
        success('User deactivated successfully');
      } else if (actionModal.type === 'delete') {
        await api.deleteUser(actionModal.user.id);
        success('User deleted successfully');
      }
      
      setActionModal(null);
      fetchUsers();
    } catch (err) {
      error('Failed to perform action');
    }
  };

  const clearFilters = () => {
    setSearch('');
    setRole('');
    setIsActive('true');
    setCurrentPage(1);
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      admin: 'bg-purple-100 text-purple-800',
      teacher: 'bg-blue-100 text-blue-800',
      student: 'bg-green-100 text-green-800',
    };
    return badges[role as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  if (loading && users.length === 0) {
    return <Loading fullScreen text="Loading users..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">Manage all platform users</p>
        </div>
        <div className="text-sm text-gray-600">
          Total Users: <span className="font-semibold">{total}</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select
            placeholder="All Roles"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: 'admin', label: 'Admin' },
              { value: 'teacher', label: 'Teacher' },
              { value: 'student', label: 'Student' },
            ]}
          />
          
          <Select
            placeholder="Status"
            value={isActive}
            onChange={(e) => setIsActive(e.target.value)}
            options={[
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
              { value: 'all', label: 'All' },
            ]}
          />
        </div>
        
        {(search || role || isActive !== 'true') && (
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grade/Subject
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.firstName[0]}{user.lastName[0]}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                    {user.role === 'admin' && <Shield className="w-3 h-3 mr-1" />}
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {user.role === 'student' ? `Grade ${user.grade}` : user.subject || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.isActive ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <UserCheck className="w-3 h-3 mr-1" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <UserX className="w-3 h-3 mr-1" />
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedUser(user)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {user.isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActionModal({ type: 'deactivate', user })}
                      >
                        <UserX className="w-4 h-4" />
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setActionModal({ type: 'activate', user })}
                      >
                        <UserCheck className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setActionModal({ type: 'delete', user })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {users.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg">
          <UsersIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-600">
            {search || role || isActive !== 'true' ? 'Try adjusting your filters' : 'No users registered yet'}
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

      {/* Action Modal */}
      <Modal
        isOpen={!!actionModal}
        onClose={() => setActionModal(null)}
        title={
          actionModal?.type === 'activate' ? 'Activate User' :
          actionModal?.type === 'deactivate' ? 'Deactivate User' :
          'Delete User'
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            {actionModal?.type === 'activate' && 
              `Are you sure you want to activate ${actionModal.user.firstName} ${actionModal.user.lastName}?`}
            {actionModal?.type === 'deactivate' && 
              `Are you sure you want to deactivate ${actionModal.user.firstName} ${actionModal.user.lastName}? They will no longer be able to access the platform.`}
            {actionModal?.type === 'delete' && 
              `Are you sure you want to permanently delete ${actionModal.user.firstName} ${actionModal.user.lastName}? This action cannot be undone.`}
          </p>
          
          <div className="flex items-center justify-end space-x-3">
            <Button
              variant="outline"
              onClick={() => setActionModal(null)}
            >
              Cancel
            </Button>
            <Button
              variant={actionModal?.type === 'delete' ? 'danger' : 'primary'}
              onClick={handleUserAction}
            >
              {actionModal?.type === 'activate' && 'Activate'}
              {actionModal?.type === 'deactivate' && 'Deactivate'}
              {actionModal?.type === 'delete' && 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Users;