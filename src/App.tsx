import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import ToastContainer from './components/UI/Toast';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

// Question pages
import Questions from './pages/Questions/Questions';
import CreateQuestion from './pages/Questions/CreateQuestion';
import EditQuestion from './pages/Questions/EditQuestion';
import GenerateQuestions from './pages/Questions/GenerateQuestions';

// Test pages
import Tests from './pages/Tests/Tests';
import CreateTest from './pages/Tests/CreateTest';
import EditTest from './pages/Tests/EditTest';
import TakeTest from './pages/Tests/TakeTest';
import TestResults from './pages/Tests/TestResults';

// Other pages
import Profile from './pages/Profile';
import Students from './pages/Students';
import Users from './pages/Users';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route 
              path="/login" 
              element={
                <Layout requireAuth={false}>
                  <Login />
                </Layout>
              } 
            />
            <Route 
              path="/register" 
              element={
                <Layout requireAuth={false}>
                  <Register />
                </Layout>
              } 
            />

            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <Layout>
                  <Dashboard />
                </Layout>
              } 
            />

            {/* Question routes - Teacher/Admin only */}
            <Route 
              path="/questions" 
              element={
                <Layout allowedRoles={['teacher', 'admin']}>
                  <Questions />
                </Layout>
              } 
            />
            <Route 
              path="/questions/create" 
              element={
                <Layout allowedRoles={['teacher', 'admin']}>
                  <CreateQuestion />
                </Layout>
              } 
            />
            <Route 
              path="/questions/:id/edit" 
              element={
                <Layout allowedRoles={['teacher', 'admin']}>
                  <EditQuestion />
                </Layout>
              } 
            />
            <Route 
              path="/questions/generate" 
              element={
                <Layout allowedRoles={['teacher', 'admin']}>
                  <GenerateQuestions />
                </Layout>
              } 
            />

            {/* Test routes */}
            <Route 
              path="/tests" 
              element={
                <Layout>
                  <Tests />
                </Layout>
              } 
            />
            <Route 
              path="/tests/create" 
              element={
                <Layout allowedRoles={['teacher', 'admin']}>
                  <CreateTest />
                </Layout>
              } 
            />
            <Route 
              path="/tests/:id/edit" 
              element={
                <Layout allowedRoles={['teacher', 'admin']}>
                  <EditTest />
                </Layout>
              } 
            />
            <Route 
              path="/tests/:id/take" 
              element={
                <Layout allowedRoles={['student']}>
                  <TakeTest />
                </Layout>
              } 
            />
            <Route 
              path="/tests/:id/results" 
              element={
                <Layout>
                  <TestResults />
                </Layout>
              } 
            />

            {/* Other routes */}
            <Route 
              path="/profile" 
              element={
                <Layout>
                  <Profile />
                </Layout>
              } 
            />
            <Route 
              path="/students" 
              element={
                <Layout allowedRoles={['teacher', 'admin']}>
                  <Students />
                </Layout>
              } 
            />
            <Route 
              path="/users" 
              element={
                <Layout allowedRoles={['admin']}>
                  <Users />
                </Layout>
              } 
            />

            {/* Redirects */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>

          <ToastContainer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;