import React from 'react';
import { Save, RefreshCw, ArrowLeft, CheckCircle2, AlertCircle, Clock, Layers, Box, Calculator, GitCompare, FileText, Sparkles, Camera } from 'lucide-react';

export const EditorToolbar = ({
  projectName,
  designVersion,
  isDirty,
  saveStatus,
  errorMessage,
  viewMode = '2D',
  onChangeViewMode,
  onSave,
  onReload,
  onBackToProjects,
  onOpenEstimate,
  onOpenComparison,
  onOpenQuotations
}) => {
  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-10">
      {/* Left: Project & Design Info */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onBackToProjects}
          className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-100 transition"
          title="Back to Projects"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="h-5 w-px bg-slate-800" />

        <div>
          <h1 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
            <span>{projectName || 'Kitchen Project'}</span>
            <span className="text-xs bg-slate-800 text-brand-400 font-mono px-2 py-0.5 rounded border border-slate-700">
              v{designVersion || 1}
            </span>
          </h1>
        </div>
      </div>

      {/* Middle: 2D / 3D View Switcher & Status */}
      <div className="flex items-center space-x-4">
        {/* Mode Switcher */}
        <div className="flex items-center bg-slate-800 p-0.5 rounded-xl border border-slate-700/80">
          <button
            onClick={() => onChangeViewMode('2D')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
              viewMode === '2D'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2D Plan</span>
          </button>
          <button
            onClick={() => onChangeViewMode('3D')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
              viewMode === '3D'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D View</span>
          </button>
          <button
            onClick={() => onChangeViewMode('REALISTIC')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition ${
              viewMode === 'REALISTIC'
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Realistic Studio</span>
          </button>
        </div>

        {/* Sync Status Indicator */}
        <div className="hidden sm:flex items-center space-x-2">
          {saveStatus === 'saving' && (
            <div className="flex items-center space-x-1.5 text-xs text-sky-400 bg-sky-950/40 border border-sky-800 px-2.5 py-1 rounded-full animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Saving layout...</span>
            </div>
          )}

          {saveStatus === 'saved' && !isDirty && (
            <div className="flex items-center space-x-1.5 text-xs text-brand-400 bg-brand-950/40 border border-brand-800 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
              <span>All changes saved</span>
            </div>
          )}

          {isDirty && saveStatus !== 'saving' && (
            <div className="flex items-center space-x-1.5 text-xs text-amber-400 bg-amber-950/40 border border-amber-800 px-2.5 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5" />
              <span>Unsaved changes</span>
            </div>
          )}

          {saveStatus === 'error' && (
            <div className="flex items-center space-x-1.5 text-xs text-red-400 bg-red-950/40 border border-red-800 px-2.5 py-1 rounded-full">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errorMessage || 'Error saving design'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenEstimate}
          className="flex items-center space-x-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition"
          title="Calculate Itemized BOM Cost Estimate"
        >
          <Calculator className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Cost Estimate</span>
        </button>

        <button
          onClick={onOpenComparison}
          className="flex items-center space-x-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition"
          title="Compare Material Options & Price Variance"
        >
          <GitCompare className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden md:inline">Compare Finishes</span>
        </button>

        <button
          onClick={onOpenQuotations}
          className="flex items-center space-x-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition"
          title="View and Download Official Project Quotations & PDFs"
        >
          <FileText className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden md:inline">Quotations</span>
        </button>

        <div className="h-5 w-px bg-slate-800 hidden md:block" />

        <button
          onClick={onReload}
          className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-700 transition"
          title="Reload latest from database"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload</span>
        </button>

        <button
          onClick={onSave}
          disabled={saveStatus === 'saving'}
          className="flex items-center space-x-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg text-xs font-medium shadow-sm transition"
        >
          <Save className="w-3.5 h-3.5" />
          <span>Save Design</span>
        </button>
      </div>
    </header>
  );
};

