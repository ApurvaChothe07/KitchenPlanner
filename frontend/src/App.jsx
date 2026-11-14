import React, { useState, useEffect } from 'react';
import { AuthModal } from './components/auth/AuthModal';
import { ProjectDashboard } from './components/dashboard/ProjectDashboard';
import { KitchenEditor } from './components/editor/KitchenEditor';
import { authService } from './services/authService';

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(authService.isAuthenticated());
  const [activeProject, setActiveProject] = useState(null);
  const [activeDesign, setActiveDesign] = useState(null);

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleOpenEditor = (project, design) => {
    setActiveProject(project);
    setActiveDesign(design);
  };

  const handleBackToProjects = () => {
    setActiveProject(null);
    setActiveDesign(null);
  };

  if (!isAuthenticated) {
    return <AuthModal onSuccess={handleAuthSuccess} />;
  }

  if (activeProject && activeDesign) {
    return (
      <KitchenEditor
        project={activeProject}
        initialDesign={activeDesign}
        onBackToProjects={handleBackToProjects}
      />
    );
  }

  return <ProjectDashboard onOpenEditor={handleOpenEditor} />;
}

export default App;
