import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import Board from './components/Board';
import Column from './components/Column';
import Dashboard from './components/Dashboard';
import SearchFilterBar from './components/SearchFilterBar';
import JobForm from './components/JobForm';
import JobDetailModal from './components/JobDetailModal';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Modal from './components/Modal';
import ConfirmDialog from './components/ConfirmDialog';
import { ToastProvider, useToast } from './components/ToastProvider';

import { COLUMN_NAMES } from './utils/constants';
import {
  getAllJobs, createJob, updateJob, deleteJob,
} from './services/jobService';
import { getAuthCookie, clearAuthCookie } from './services/authService';

const EMPTY_TASKS = () => {
  const t = {};
  Object.keys(COLUMN_NAMES).forEach((id) => (t[id] = []));
  return t;
};

const DEFAULT_FILTERS = { search: '', status: '', priority: '', employmentType: '', sort: 'newest', page: 1 };

// ─── Inner app — has access to toast context ───────────────────────────────
const AppInner = () => {
  const toast = useToast();

  const [user, setUser]             = useState(null);
  const [view, setView]             = useState('board');   // 'board' | 'dashboard'
  const [tasks, setTasks]           = useState(EMPTY_TASKS());
  const [filters, setFilters]       = useState(DEFAULT_FILTERS);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading]       = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Modal state
  const [authModal, setAuthModal]   = useState(false);
  const [authMode, setAuthMode]     = useState('login');   // 'login' | 'register'
  const [jobFormOpen, setJobFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [detailJob, setDetailJob]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Debounce search
  const searchTimer = useRef(null);

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const { token, user: storedUser } = getAuthCookie();
    if (token && storedUser) setUser(storedUser);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setAuthModal(false);
  };
  const handleRegister = (userData) => {
    setUser(userData);
    setAuthModal(false);
    toast.success('Account created! Welcome to CareerTrack 🎉');
  };
  const handleLogout = () => {
    clearAuthCookie();
    setUser(null);
    setTasks(EMPTY_TASKS());
    setPagination({ total: 0, totalPages: 1 });
  };

  // ── Load jobs ─────────────────────────────────────────────────────────────
  const loadJobs = useCallback(async (f = filters) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await getAllJobs({
        page: f.page,
        limit: 20,
        status: f.status,
        priority: f.priority,
        employmentType: f.employmentType,
        search: f.search,
        sort: f.sort,
      });

      // If a status filter is active, keep only that column populated
      const newTasks = EMPTY_TASKS();
      res.jobs.forEach((job) => {
        if (newTasks[job.status] !== undefined) {
          newTasks[job.status].push(job);
        }
      });
      setTasks(newTasks);
      setPagination({ total: res.total, totalPages: res.totalPages });
    } catch (err) {
      toast.error('Failed to load applications.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Reload when user or filters change (debounce search)
  useEffect(() => {
    if (!user) return;
    if (filters.search !== undefined) {
      clearTimeout(searchTimer.current);
      searchTimer.current = setTimeout(() => loadJobs(filters), 400);
    } else {
      loadJobs(filters);
    }
    return () => clearTimeout(searchTimer.current);
  }, [user, filters]);

  // ── Filter change handler ─────────────────────────────────────────────────
  const handleFilterChange = (newFilters) => setFilters(newFilters);

  // ── Create job ─────────────────────────────────────────────────────────────
  const handleCreateJob = async (formData) => {
    setFormLoading(true);
    try {
      await createJob(formData);
      setJobFormOpen(false);
      toast.success('Application added!');
      await loadJobs(filters);
    } catch (err) {
      toast.error(err.message || 'Failed to add application.');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Edit job ───────────────────────────────────────────────────────────────
  const handleOpenEdit = (job) => {
    setEditingJob(job);
    setDetailJob(null);
    setJobFormOpen(true);
  };
  const handleEditJob = async (formData) => {
    setFormLoading(true);
    try {
      await updateJob(editingJob._id, formData);
      setJobFormOpen(false);
      setEditingJob(null);
      toast.success('Application updated!');
      await loadJobs(filters);
    } catch (err) {
      toast.error(err.message || 'Failed to update application.');
    } finally {
      setFormLoading(false);
    }
  };

  // ── Delete job ─────────────────────────────────────────────────────────────
  const handleDeleteRequest = (jobId) => setDeleteTarget(jobId);
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteJob(deleteTarget);
      setDeleteTarget(null);
      setDetailJob(null);
      toast.success('Application deleted.');
      await loadJobs(filters);
    } catch (err) {
      toast.error('Failed to delete application.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Drag-and-drop move ────────────────────────────────────────────────────
  const handleMoveTask = async (task, fromColumn, toColumn) => {
    // Optimistic UI update
    setTasks((prev) => {
      const from = prev[fromColumn].filter((t) => t._id !== task._id);
      const to = [...prev[toColumn], { ...task, status: toColumn }];
      return { ...prev, [fromColumn]: from, [toColumn]: to };
    });
    try {
      await updateJob(task._id, { status: toColumn });
    } catch {
      // Roll back on failure
      toast.error('Failed to move application.');
      await loadJobs(filters);
    }
  };

  // ── Pagination ────────────────────────────────────────────────────────────
  const goToPage = (page) => setFilters((f) => ({ ...f, page }));

  const userName = user?.name || user?.email?.split('@')[0] || 'User';
  const userInitial = userName.charAt(0).toUpperCase();

  // ── Render unauthenticated ─────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">
            <div className="auth-logo-icon">🎯</div>
            <span className="auth-logo-name">CareerTrack</span>
          </div>
          {authMode === 'login' ? (
            <LoginForm
              onLogin={handleLogin}
              switchToRegister={() => setAuthMode('register')}
            />
          ) : (
            <RegisterForm
              onRegister={handleRegister}
              switchToLogin={() => setAuthMode('login')}
            />
          )}
        </div>
      </div>
    );
  }

  // ── Render authenticated app ───────────────────────────────────────────────
  return (
    <DndProvider backend={HTML5Backend}>
      <div className="app-shell">
        {/* Navigation */}
        <nav className="navbar">
          <div className="navbar-brand">
            <div className="brand-icon">🎯</div>
            <div>
              CareerTrack
              <span className="brand-sub">Job Application Manager</span>
            </div>
          </div>

          <div className="navbar-nav">
            <button
              id="nav-board"
              className={`nav-btn${view === 'board' ? ' active' : ''}`}
              onClick={() => setView('board')}
            >
              📋 Board
            </button>
            <button
              id="nav-dashboard"
              className={`nav-btn${view === 'dashboard' ? ' active' : ''}`}
              onClick={() => setView('dashboard')}
            >
              📊 Dashboard
            </button>
          </div>

          <div className="navbar-right">
            <div className="user-chip">
              <div className="user-avatar">{userInitial}</div>
              {userName}
            </div>
            <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </nav>

        {/* Main content */}
        <main className="main-content">
          {view === 'dashboard' ? (
            <>
              <div style={{ marginBottom: 20 }}>
                <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Dashboard</h1>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Overview of your job search pipeline
                </p>
              </div>
              <Dashboard />
            </>
          ) : (
            <>
              {/* Board header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Applications</h1>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '4px 0 0' }}>
                    Drag cards to update status
                  </p>
                </div>
                <button
                  id="add-job-btn"
                  className="btn btn-primary"
                  onClick={() => { setEditingJob(null); setJobFormOpen(true); }}
                >
                  + Add Application
                </button>
              </div>

              {/* Search & filters */}
              <SearchFilterBar
                filters={filters}
                onFilterChange={handleFilterChange}
                total={pagination.total}
              />

              {/* Loading state */}
              {loading ? (
                <div className="loading-wrap">
                  <div className="spinner" />
                  <span>Loading applications…</span>
                </div>
              ) : pagination.total === 0 && (filters.search || filters.status || filters.priority || filters.employmentType) ? (
                <div className="empty-state">
                  <div className="empty-icon">🔍</div>
                  <div className="empty-title">No results found</div>
                  <div className="empty-desc">Try adjusting your search or filters.</div>
                </div>
              ) : pagination.total === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <div className="empty-title">No applications yet</div>
                  <div className="empty-desc">Add your first job application to get started.</div>
                  <button
                    className="btn btn-primary"
                    onClick={() => { setEditingJob(null); setJobFormOpen(true); }}
                  >
                    + Add your first application
                  </button>
                </div>
              ) : (
                <Board
                  tasks={tasks}
                  onMoveTask={handleMoveTask}
                  onDelete={handleDeleteRequest}
                  onEdit={handleOpenEdit}
                  onView={(job) => setDetailJob(job)}
                />
              )}

              {/* Pagination */}
              {pagination.totalPages > 1 && !loading && (
                <div className="pagination">
                  <button
                    className="page-btn"
                    onClick={() => goToPage(filters.page - 1)}
                    disabled={filters.page <= 1}
                  >
                    ‹
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      className={`page-btn${p === filters.page ? ' active' : ''}`}
                      onClick={() => goToPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    className="page-btn"
                    onClick={() => goToPage(filters.page + 1)}
                    disabled={filters.page >= pagination.totalPages}
                  >
                    ›
                  </button>
                  <span className="page-info">
                    Page {filters.page} of {pagination.totalPages}
                  </span>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ─── Job form modal (create / edit) ─────────────────────────────── */}
      <Modal
        isOpen={jobFormOpen}
        onClose={() => { setJobFormOpen(false); setEditingJob(null); }}
        title={editingJob ? 'Edit Application' : 'Add Application'}
        size="lg"
      >
        <JobForm
          initialData={editingJob}
          onSubmit={editingJob ? handleEditJob : handleCreateJob}
          onClose={() => { setJobFormOpen(false); setEditingJob(null); }}
          loading={formLoading}
        />
      </Modal>

      {/* ─── Job detail modal ────────────────────────────────────────────── */}
      <Modal
        isOpen={!!detailJob}
        onClose={() => setDetailJob(null)}
        title="Application Details"
        size="md"
      >
        <JobDetailModal
          job={detailJob}
          onEdit={() => handleOpenEdit(detailJob)}
          onDelete={() => handleDeleteRequest(detailJob._id)}
          onClose={() => setDetailJob(null)}
        />
      </Modal>

      {/* ─── Delete confirmation ─────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Delete application?"
        message="This will permanently remove the application. This action cannot be undone."
        loading={deleteLoading}
      />
    </DndProvider>
  );
};

// ─── Root wrapper with Toast provider ─────────────────────────────────────
const App = () => (
  <ToastProvider>
    <AppInner />
  </ToastProvider>
);

export default App;
