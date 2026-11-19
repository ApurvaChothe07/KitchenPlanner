import React, { useState, useEffect } from 'react';
import { projectService } from '../../services/projectService';
import { designService } from '../../services/designService';
import { authService } from '../../services/authService';
import { Plus, FolderPlus, Trash2, Layout, Calendar, User, LogOut, ArrowUpRight, ChefHat } from 'lucide-react';

export const ProjectDashboard = ({ onOpenEditor }) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newClientName, setNewClientName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadProjects();
    const user = authService.getStoredUser();
    setCurrentUser(user);
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      setLoadError('');
      const data = await projectService.getProjects();
      setProjects(data || []);
    } catch (err) {
      console.error('Failed to load projects:', err);
      if (err.response?.status !== 401) {
        setLoadError(err.response?.data?.message || err.message || 'Unable to connect to backend server (http://localhost:8080).');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setIsCreating(true);
    setCreateError('');

    try {
      const created = await projectService.createProject({
        name: newProjectName.trim(),
        clientName: newClientName.trim() || undefined,
        status: 'IN_PLANNING'
      });

      // Automatically create the initial default design (4500 x 3600 x 2800 mm)
      const initialDesign = await designService.createDesign(created.id, {
        name: `${created.name} - v1`,
        version: 1,
        roomWidthMm: 4500,
        roomLengthMm: 3600,
        roomHeightMm: 2800,
        layoutType: 'L_SHAPED'
      });

      setShowCreateModal(false);
      setNewProjectName('');
      setNewClientName('');

      // Open directly in editor
      onOpenEditor(created, initialDesign);
    } catch (err) {
      console.error('Failed to create project:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to create project. Please verify backend connection.';
      setCreateError(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenProject = async (project) => {
    try {
      // Fetch designs for project
      const designs = await designService.getDesignsByProject(project.id);
      let targetDesign;

      if (designs && designs.length > 0) {
        // Load the latest design with full cabinet list
        targetDesign = await designService.getDesign(designs[0].id);
      } else {
        // Create initial default design if none exist
        targetDesign = await designService.createDesign(project.id, {
          name: `${project.name} - v1`,
          version: 1,
          roomWidthMm: 4500,
          roomLengthMm: 3600,
          roomHeightMm: 2800,
          layoutType: 'L_SHAPED'
        });
      }

      onOpenEditor(project, targetDesign);
    } catch (err) {
      console.error('Failed to open project design:', err);
    }
  };

  const handleDeleteProject = async (e, projectId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this kitchen project and all its designs?')) {
      try {
        await projectService.deleteProject(projectId);
        setProjects(projects.filter((p) => p.id !== projectId));
      } catch (err) {
        console.error('Failed to delete project:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-brand-500/10 border border-brand-500/20 rounded-xl text-brand-400">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight">KitchenCraft</h1>
            <p className="text-[11px] text-slate-400">Interior Planner & Cost Estimation</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <p className="text-xs font-medium text-slate-200">{currentUser?.fullName || 'Designer'}</p>
            <p className="text-[10px] text-slate-400">{currentUser?.email}</p>
          </div>
          <button
            onClick={() => {
              authService.logout();
              window.location.reload();
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Kitchen Projects</h2>
            <p className="text-sm text-slate-400 mt-1">
              Design layouts in millimetre precision, place cabinets, and estimate project costs.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-lg transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Kitchen Project</span>
          </button>
        </div>

        {/* Project Cards Grid */}
        {loadError && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-500/40 text-red-300 text-xs flex items-center justify-between shadow-lg">
            <span>{loadError}</span>
            <button
              onClick={loadProjects}
              className="px-3 py-1 bg-red-900/60 hover:bg-red-800 rounded-lg text-white font-medium transition"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-500">
            <p className="text-sm animate-pulse">Loading projects from database...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/30 p-8">
            <FolderPlus className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-300">No kitchen projects yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5">
              Create your first project to start drafting 2D modular layouts and calculating carcass material costs.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl text-xs font-medium transition"
            >
              Create New Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((proj) => (
              <div
                key={proj.id}
                onClick={() => handleOpenProject(proj)}
                className="group bg-slate-900 border border-slate-800 hover:border-brand-500/50 rounded-2xl p-5 cursor-pointer transition shadow-sm hover:shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-brand-400 border border-slate-700/60">
                        {proj.status.replace('_', ' ')}
                      </span>
                      <h3 className="text-base font-bold text-white group-hover:text-brand-400 transition mt-2">
                        {proj.name}
                      </h3>
                    </div>
                    <button
                      onClick={(e) => handleDeleteProject(e, proj.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-950/60 rounded-lg text-slate-400 hover:text-red-400 transition"
                      title="Delete Project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {proj.clientName && (
                    <div className="flex items-center space-x-1.5 text-xs text-slate-400 mt-2">
                      <User className="w-3.5 h-3.5 text-slate-500" />
                      <span>{proj.clientName}</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center space-x-1.5">
                    <Layout className="w-3.5 h-3.5 text-slate-400" />
                    <span>{proj.designCount || 1} Layout Version</span>
                  </div>

                  <span className="flex items-center space-x-1 text-brand-400 group-hover:translate-x-0.5 transition font-medium">
                    <span>Open Planner</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Create Kitchen Project</h3>
            <p className="text-xs text-slate-400 mb-4">
              Enter basic project details to initialize the room workspace.
            </p>

            {createError && (
              <div className="p-3 mb-3 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 text-xs">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Project Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Modern Villa Kitchen, Apt 402"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Client Name (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Anil Verma"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError('');
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium transition shadow-sm flex items-center space-x-2"
                >
                  {isCreating ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Create & Open 2D Canvas</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
