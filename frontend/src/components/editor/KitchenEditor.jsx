import React, { useState, useEffect, useCallback } from 'react';
import { KitchenCanvas } from '../canvas/KitchenCanvas';
import { CabinetCatalogPanel } from './CabinetCatalogPanel';
import { CabinetInspectorPanel } from './CabinetInspectorPanel';
import { RoomDimensionsPanel } from './RoomDimensionsPanel';
import { EditorToolbar } from './EditorToolbar';
import { designService } from '../../services/designService';
import { clampWithinRoom, isCabinetColliding } from '../../utils/coordinates';
import { AlertCircle } from 'lucide-react';

export const KitchenEditor = ({
  project,
  initialDesign,
  onBackToProjects
}) => {
  // Normalized Design State
  const [design, setDesign] = useState(initialDesign || {
    id: null,
    name: 'Initial Kitchen Layout',
    version: 1,
    roomWidthMm: 4500,
    roomLengthMm: 3600,
    roomHeightMm: 2800,
    layoutType: 'L_SHAPED',
    cabinets: []
  });

  const [selectedCabinetId, setSelectedCabinetId] = useState(null);
  const [deletedCabinetIds, setDeletedCabinetIds] = useState([]);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [errorMessage, setErrorMessage] = useState('');

  // Unsaved changes warning
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = 'You have unsaved layout changes that will be lost.';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Load design from backend
  const loadDesign = useCallback(async () => {
    if (!design.id) return;
    try {
      setSaveStatus('saving');
      const data = await designService.getDesign(design.id);
      setDesign(data);
      setDeletedCabinetIds([]);
      setIsDirty(false);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to load design:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to load design');
      setSaveStatus('error');
    }
  }, [design.id]);

  // Room Dimensions Change Handler
  const handleChangeDimensions = (field, value) => {
    setDesign((prev) => {
      const updated = { ...prev, [field]: value };
      // Clamp all existing cabinets inside the new room boundary
      const clampedCabinets = prev.cabinets.map((cab) => {
        const clamped = clampWithinRoom(
          cab.posX,
          cab.posY,
          cab.widthMm,
          cab.depthMm,
          field === 'roomWidthMm' ? value : prev.roomWidthMm,
          field === 'roomLengthMm' ? value : prev.roomLengthMm
        );
        return { ...cab, posX: clamped.posX, posY: clamped.posY };
      });
      return { ...updated, cabinets: clampedCabinets };
    });
    setIsDirty(true);
  };

  const handleChangeLayoutType = (type) => {
    setDesign((prev) => ({ ...prev, layoutType: type }));
    setIsDirty(true);
  };

  // Add Cabinet Handler from Catalog
  const handleAddCabinet = (catalogItem) => {
    // Determine spawn position near room corner or center
    const posX = Math.min(100, Math.max(0, design.roomWidthMm - catalogItem.widthMm));
    const posY = Math.min(100, Math.max(0, design.roomLengthMm - catalogItem.depthMm));

    // Temporary negative ID for locally created items before database persistence
    const tempId = -Date.now();

    const newCabinet = {
      id: tempId,
      designId: design.id,
      cabinetType: catalogItem.cabinetType,
      widthMm: catalogItem.widthMm,
      depthMm: catalogItem.depthMm,
      heightMm: catalogItem.heightMm,
      posX,
      posY,
      posZ: catalogItem.posZ || 0,
      rotation: 0,
      carcassMaterial: catalogItem.carcassMaterial,
      shutterMaterial: catalogItem.shutterMaterial,
      finishColor: catalogItem.finishColor,
      notes: catalogItem.notes
    };

    setDesign((prev) => ({
      ...prev,
      cabinets: [...prev.cabinets, newCabinet]
    }));
    setSelectedCabinetId(tempId);
    setIsDirty(true);
  };

  // Cabinet Move / Drag Handler
  const handleMoveCabinet = (id, posX, posY) => {
    setDesign((prev) => ({
      ...prev,
      cabinets: prev.cabinets.map((cab) =>
        cab.id === id ? { ...cab, posX, posY } : cab
      )
    }));
    setIsDirty(true);
  };

  // Cabinet Update Handler (from Inspector Panel)
  const handleUpdateCabinet = (updatedCab) => {
    setDesign((prev) => ({
      ...prev,
      cabinets: prev.cabinets.map((cab) =>
        cab.id === updatedCab.id ? updatedCab : cab
      )
    }));
    setIsDirty(true);
  };

  // Cabinet Duplicate Handler
  const handleDuplicateCabinet = (cab) => {
    const tempId = -Date.now();
    const duplicated = {
      ...cab,
      id: tempId,
      posX: Math.min(design.roomWidthMm - cab.widthMm, cab.posX + 50),
      posY: Math.min(design.roomLengthMm - cab.depthMm, cab.posY + 50)
    };

    setDesign((prev) => ({
      ...prev,
      cabinets: [...prev.cabinets, duplicated]
    }));
    setSelectedCabinetId(tempId);
    setIsDirty(true);
  };

  // Cabinet Delete Handler
  const handleDeleteCabinet = (id) => {
    if (id > 0) {
      setDeletedCabinetIds((prev) => [...prev, id]);
    }
    setDesign((prev) => ({
      ...prev,
      cabinets: prev.cabinets.filter((c) => c.id !== id)
    }));
    if (selectedCabinetId === id) {
      setSelectedCabinetId(null);
    }
    setIsDirty(true);
  };

  // Save Design to Backend API
  const handleSave = async () => {
    if (!design.id) {
      setErrorMessage('No active design loaded to save');
      setSaveStatus('error');
      return;
    }

    try {
      setSaveStatus('saving');
      setErrorMessage('');

      // 1. Update Room Dimensions and Design Metadata
      await designService.updateDesign(design.id, {
        name: design.name,
        roomWidthMm: design.roomWidthMm,
        roomLengthMm: design.roomLengthMm,
        roomHeightMm: design.roomHeightMm,
        layoutType: design.layoutType,
        layoutDataJson: JSON.stringify({
          savedAt: new Date().toISOString(),
          cabinetCount: design.cabinets.length
        })
      });

      // 2. Process Deleted Cabinets
      for (const delId of deletedCabinetIds) {
        try {
          await designService.deleteCabinet(design.id, delId);
        } catch (e) {
          console.warn('Failed to delete cabinet on backend:', delId, e);
        }
      }

      // 3. Process Created or Updated Cabinets
      for (const cab of design.cabinets) {
        const payload = {
          cabinetType: cab.cabinetType,
          widthMm: cab.widthMm,
          depthMm: cab.depthMm,
          heightMm: cab.heightMm,
          posX: cab.posX,
          posY: cab.posY,
          posZ: cab.posZ || 0,
          rotation: cab.rotation || 0,
          carcassMaterial: cab.carcassMaterial,
          shutterMaterial: cab.shutterMaterial,
          finishColor: cab.finishColor,
          notes: cab.notes
        };

        if (cab.id < 0) {
          // Newly added local cabinet
          await designService.addCabinet(design.id, payload);
        } else {
          // Existing cabinet update
          await designService.updateCabinet(design.id, cab.id, payload);
        }
      }

      // 4. Reload from database to synchronize real database IDs
      const reloaded = await designService.getDesign(design.id);
      setDesign(reloaded);
      setDeletedCabinetIds([]);
      setIsDirty(false);
      setSaveStatus('saved');
    } catch (err) {
      console.error('Failed to save design:', err);
      setErrorMessage(err.response?.data?.message || 'Error saving layout');
      setSaveStatus('error');
    }
  };

  const selectedCabinet = design.cabinets.find((c) => c.id === selectedCabinetId);
  const isSelectedColliding = selectedCabinet
    ? design.cabinets.some((other) => isCabinetColliding(selectedCabinet, other))
    : false;

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 overflow-hidden">
      {/* Top Toolbar */}
      <EditorToolbar
        projectName={project?.name}
        designVersion={design.version}
        isDirty={isDirty}
        saveStatus={saveStatus}
        errorMessage={errorMessage}
        onSave={handleSave}
        onReload={loadDesign}
        onBackToProjects={onBackToProjects}
      />

      {/* Room Dimensions Bar */}
      <RoomDimensionsPanel
        roomWidthMm={design.roomWidthMm}
        roomLengthMm={design.roomLengthMm}
        roomHeightMm={design.roomHeightMm}
        layoutType={design.layoutType}
        onChangeDimensions={handleChangeDimensions}
        onChangeLayoutType={handleChangeLayoutType}
      />

      {/* Main 3-Column Work Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Cabinet Catalogue */}
        <CabinetCatalogPanel onAddCabinet={handleAddCabinet} />

        {/* Center: Interactive 2D Konva Canvas */}
        <div className="flex-1 h-full relative">
          <KitchenCanvas
            roomWidthMm={design.roomWidthMm}
            roomLengthMm={design.roomLengthMm}
            cabinets={design.cabinets}
            selectedCabinetId={selectedCabinetId}
            onSelectCabinet={setSelectedCabinetId}
            onMoveCabinet={handleMoveCabinet}
          />
        </div>

        {/* Right: Selected Cabinet Properties Inspector */}
        <CabinetInspectorPanel
          cabinet={selectedCabinet}
          isColliding={isSelectedColliding}
          onUpdateCabinet={handleUpdateCabinet}
          onDeleteCabinet={handleDeleteCabinet}
          onDuplicateCabinet={handleDuplicateCabinet}
          onDeselect={() => setSelectedCabinetId(null)}
        />
      </div>
    </div>
  );
};
