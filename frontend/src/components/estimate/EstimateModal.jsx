import React, { useState, useEffect } from 'react';
import { X, Calculator, RefreshCw, FileText, CheckCircle, AlertCircle, Info, ChevronDown } from 'lucide-react';
import { materialService } from '../../services/materialService';
import { estimateService } from '../../services/estimateService';

export const EstimateModal = ({ designId, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [estimate, setEstimate] = useState(null);

  // Available Materials from Catalogue
  const [carcassMaterials, setCarcassMaterials] = useState([]);
  const [shutterMaterials, setShutterMaterials] = useState([]);
  const [countertopMaterials, setCountertopMaterials] = useState([]);

  // Configurable Options
  const [selectedCarcassId, setSelectedCarcassId] = useState('');
  const [selectedShutterId, setSelectedShutterId] = useState('');
  const [selectedCountertopId, setSelectedCountertopId] = useState('');

  const [wastagePct, setWastagePct] = useState('10.0');
  const [laborPct, setLaborPct] = useState('15.0');
  const [installPct, setInstallPct] = useState('5.0');
  const [discountPct, setDiscountPct] = useState('0.0');
  const [taxPct, setTaxPct] = useState('18.0');

  // Load materials catalogue on modal open
  useEffect(() => {
    if (!isOpen) return;

    const loadCatalogue = async () => {
      try {
        const [carcass, shutter, countertop] = await Promise.all([
          materialService.getAllMaterials('CARCASS'),
          materialService.getAllMaterials('SHUTTER'),
          materialService.getAllMaterials('COUNTERTOP'),
        ]);

        setCarcassMaterials(carcass);
        setShutterMaterials(shutter);
        setCountertopMaterials(countertop);

        if (carcass.length > 0 && !selectedCarcassId) setSelectedCarcassId(carcass[0].id);
        if (shutter.length > 0 && !selectedShutterId) setSelectedShutterId(shutter[0].id);
        if (countertop.length > 0 && !selectedCountertopId) setSelectedCountertopId(countertop[0].id);

        fetchEstimate({
          carcassMaterialId: carcass[0]?.id,
          shutterMaterialId: shutter[0]?.id,
          countertopMaterialId: countertop[0]?.id,
        });
      } catch (err) {
        console.error('Failed to load material catalog:', err);
        setError('Failed to load material catalogue.');
      }
    };

    loadCatalogue();
  }, [isOpen, designId]);

  const fetchEstimate = async (overrides = {}) => {
    if (!designId) return;
    try {
      setLoading(true);
      setError('');

      const payload = {
        carcassMaterialId: overrides.carcassMaterialId !== undefined ? overrides.carcassMaterialId : (selectedCarcassId ? Number(selectedCarcassId) : null),
        shutterMaterialId: overrides.shutterMaterialId !== undefined ? overrides.shutterMaterialId : (selectedShutterId ? Number(selectedShutterId) : null),
        countertopMaterialId: overrides.countertopMaterialId !== undefined ? overrides.countertopMaterialId : (selectedCountertopId ? Number(selectedCountertopId) : null),
        wastagePercentage: parseFloat(wastagePct) || 10.0,
        laborPercentage: parseFloat(laborPct) || 15.0,
        installationPercentage: parseFloat(installPct) || 5.0,
        discountPercentage: parseFloat(discountPct) || 0.0,
        taxPercentage: parseFloat(taxPct) || 18.0,
      };

      const result = await estimateService.calculateEstimate(designId, payload);
      setEstimate(result);
    } catch (err) {
      console.error('Failed to calculate estimate:', err);
      setError(err.response?.data?.message || 'Error generating cost estimate.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = (e) => {
    e.preventDefault();
    fetchEstimate();
  };

  if (!isOpen) return null;

  const formatCurrency = (val) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-5xl my-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-brand-600/10 border border-brand-500/20 text-brand-400 rounded-xl">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100 flex items-center space-x-2">
                <span>Kitchen Cost Estimation & BOM</span>
                <span className="text-xs bg-slate-800 text-brand-400 font-mono px-2 py-0.5 rounded border border-slate-700">
                  {estimate?.totalCabinetCount || 0} Cabinets
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Deterministic surface area formulas calculated with verified catalogue rates
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-950/50 border border-red-800/80 rounded-xl text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Configuration Form */}
          <form onSubmit={handleRecalculate} className="bg-slate-950/50 border border-slate-800/90 rounded-xl p-4 space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Material Specifications & Cost Factors</span>
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-1.5 text-xs bg-brand-600 hover:bg-brand-500 text-white px-3 py-1.5 rounded-lg font-medium shadow-sm transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Recalculate BOM</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Carcass Material */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Carcass Core Board</label>
                <select
                  value={selectedCarcassId}
                  onChange={(e) => setSelectedCarcassId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                >
                  {carcassMaterials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (₹{m.unitPrice}/{m.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Shutter Material */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Front Shutter Finish</label>
                <select
                  value={selectedShutterId}
                  onChange={(e) => setSelectedShutterId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                >
                  {shutterMaterials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (₹{m.unitPrice}/{m.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Countertop Material */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Kitchen Countertop</label>
                <select
                  value={selectedCountertopId}
                  onChange={(e) => setSelectedCountertopId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-2 focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                >
                  {countertopMaterials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} (₹{m.unitPrice}/{m.unit})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Percentages: Wastage, Labor, Install, Discount, Tax */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1 border-t border-slate-800/60">
              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5">Wastage (%)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={wastagePct}
                  onChange={(e) => setWastagePct(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5">Labour (%)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={laborPct}
                  onChange={(e) => setLaborPct(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5">Installation (%)</label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="0.5"
                  value={installPct}
                  onChange={(e) => setInstallPct(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5">Discount (%)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={discountPct}
                  onChange={(e) => setDiscountPct(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-0.5">GST Tax (%)</label>
                <input
                  type="number"
                  min="0"
                  max="40"
                  step="0.5"
                  value={taxPct}
                  onChange={(e) => setTaxPct(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:ring-1 focus:ring-brand-500"
                />
              </div>
            </div>
          </form>

          {/* Itemized BOM Table */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Itemized Bill of Materials (BOM)
            </h3>
            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-800/70 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3 font-medium">Line Item</th>
                    <th className="py-2.5 px-3 font-medium">Category</th>
                    <th className="py-2.5 px-3 font-medium text-right">Quantity</th>
                    <th className="py-2.5 px-3 font-medium text-right">Unit Rate</th>
                    <th className="py-2.5 px-3 font-medium text-right">Subtotal</th>
                    <th className="py-2.5 px-3 font-medium">Calculation Rule</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {estimate?.lineItems?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-medium text-slate-200">{item.itemDescription}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {item.quantity} {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-100">
                        {formatCurrency(item.totalCost)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 text-[11px] max-w-xs truncate" title={item.calculationDetails}>
                        {item.calculationDetails}
                      </td>
                    </tr>
                  ))}
                  {(!estimate?.lineItems || estimate.lineItems.length === 0) && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">
                        No cabinets in design. Place cabinets on the plan to generate items.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cost Summary Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Calculation Breakdown */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Materials Subtotal:</span>
                <span className="font-mono font-medium">{formatCurrency(estimate?.materialTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Wastage Allowance ({estimate?.wastagePercentage}%):</span>
                <span className="font-mono">{formatCurrency(estimate?.wastageAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Carpentry Labour ({estimate?.laborPercentage}%):</span>
                <span className="font-mono">{formatCurrency(estimate?.laborAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Site Installation ({estimate?.installationPercentage}%):</span>
                <span className="font-mono">{formatCurrency(estimate?.installationAmount)}</span>
              </div>
              <div className="h-px bg-slate-800 my-1" />
              <div className="flex justify-between text-slate-200 font-medium">
                <span>Gross Subtotal:</span>
                <span className="font-mono">{formatCurrency(estimate?.grossSubtotal)}</span>
              </div>
              {Number(estimate?.discountAmount || 0) > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount ({estimate?.discountPercentage}%):</span>
                  <span className="font-mono">- {formatCurrency(estimate?.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-300">
                <span>Net Taxable Amount:</span>
                <span className="font-mono">{formatCurrency(estimate?.netTaxableAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>GST Tax ({estimate?.taxPercentage}%):</span>
                <span className="font-mono">{formatCurrency(estimate?.taxAmount)}</span>
              </div>
            </div>

            {/* Grand Total Hero Card */}
            <div className="bg-gradient-to-br from-brand-950/40 via-slate-900 to-slate-900 border border-brand-800/40 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-brand-400 font-semibold">
                  Total Estimated Project Cost
                </span>
                <div className="text-3xl font-extrabold text-brand-300 mt-2 font-mono">
                  {formatCurrency(estimate?.grandTotal)}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Includes carcass boards, shutters, countertop, hardware, labor, wastage, and {estimate?.taxPercentage}% GST.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>Backend Quote ID: #{estimate?.designId}-{estimate?.version}</span>
                <span className="flex items-center space-x-1 text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Catalogue Verified</span>
                </span>
              </div>
            </div>
          </div>

          {/* Assumptions Notice */}
          <div className="p-3.5 bg-slate-950/50 border border-slate-800/70 rounded-xl text-slate-400 text-[11px] space-y-1.5">
            <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
              <Info className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <span>Quantity Formulas & Estimation Assumptions</span>
            </div>
            <ul className="list-disc pl-5 space-y-0.5 text-slate-400">
              {estimate?.quantityAssumptions?.map((rule, idx) => (
                <li key={idx}>{rule}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-850 border-t border-slate-800 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
