import React, { useState, useEffect } from 'react';
import { X, GitCompare, RefreshCw, AlertCircle, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import { materialService } from '../../services/materialService';
import { estimateService } from '../../services/estimateService';

export const ComparisonModal = ({ designId, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [comparison, setComparison] = useState(null);

  // Available Materials
  const [carcassMaterials, setCarcassMaterials] = useState([]);
  const [shutterMaterials, setShutterMaterials] = useState([]);
  const [countertopMaterials, setCountertopMaterials] = useState([]);

  // Option A Selection (e.g. Standard)
  const [optionAName, setOptionAName] = useState('Option A: Standard Finish');
  const [optionACarcass, setOptionACarcass] = useState('');
  const [optionAShutter, setOptionAShutter] = useState('');
  const [optionACountertop, setOptionACountertop] = useState('');

  // Option B Selection (e.g. Premium)
  const [optionBName, setOptionBName] = useState('Option B: Premium Finish');
  const [optionBCarcass, setOptionBCarcass] = useState('');
  const [optionBShutter, setOptionBShutter] = useState('');
  const [optionBCountertop, setOptionBCountertop] = useState('');

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

        // Pre-select defaults: Option A standard, Option B premium (if second item exists)
        if (carcass.length > 0) {
          setOptionACarcass(carcass[0].id);
          setOptionBCarcass(carcass.length > 1 ? carcass[1].id : carcass[0].id);
        }
        if (shutter.length > 0) {
          setOptionAShutter(shutter[0].id);
          setOptionBShutter(shutter.length > 1 ? shutter[1].id : shutter[0].id);
        }
        if (countertop.length > 0) {
          setOptionACountertop(countertop[0].id);
          setOptionBCountertop(countertop.length > 1 ? countertop[1].id : countertop[0].id);
        }

        // Trigger initial comparison
        runComparison({
          aCarcass: carcass[0]?.id,
          aShutter: shutter[0]?.id,
          aCountertop: countertop[0]?.id,
          bCarcass: carcass.length > 1 ? carcass[1]?.id : carcass[0]?.id,
          bShutter: shutter.length > 1 ? shutter[1]?.id : shutter[0]?.id,
          bCountertop: countertop.length > 1 ? countertop[1]?.id : countertop[0]?.id,
        });
      } catch (err) {
        console.error('Failed to load catalogue for comparison:', err);
        setError('Failed to load materials catalogue.');
      }
    };

    loadCatalogue();
  }, [isOpen, designId]);

  const runComparison = async (preset) => {
    if (!designId) return;
    try {
      setLoading(true);
      setError('');

      const payload = {
        optionA: {
          carcassMaterialId: preset?.aCarcass !== undefined ? preset.aCarcass : (optionACarcass ? Number(optionACarcass) : null),
          shutterMaterialId: preset?.aShutter !== undefined ? preset.aShutter : (optionAShutter ? Number(optionAShutter) : null),
          countertopMaterialId: preset?.aCountertop !== undefined ? preset.aCountertop : (optionACountertop ? Number(optionACountertop) : null),
        },
        optionB: {
          carcassMaterialId: preset?.bCarcass !== undefined ? preset.bCarcass : (optionBCarcass ? Number(optionBCarcass) : null),
          shutterMaterialId: preset?.bShutter !== undefined ? preset.bShutter : (optionBShutter ? Number(optionBShutter) : null),
          countertopMaterialId: preset?.bCountertop !== undefined ? preset.bCountertop : (optionBCountertop ? Number(optionBCountertop) : null),
        },
      };

      const result = await estimateService.compareEstimates(designId, payload);
      setComparison(result);
    } catch (err) {
      console.error('Failed to compare estimates:', err);
      setError(err.response?.data?.message || 'Error executing estimate comparison.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runComparison();
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

  const isBMoreExpensive = Number(comparison?.totalDifference || 0) >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-5xl my-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                Material & Cost Comparison Engine
              </h2>
              <p className="text-xs text-slate-400">
                Evaluate different finish and core board combinations for client budgeting
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-950/50 border border-red-800/80 rounded-xl text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Side-by-Side Configuration Selectors */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Option A Box */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-xs font-semibold text-sky-400 uppercase tracking-wider">
                    Package A (Baseline)
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {formatCurrency(comparison?.estimateA?.grandTotal)}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Carcass Core</label>
                  <select
                    value={optionACarcass}
                    onChange={(e) => setOptionACarcass(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5"
                  >
                    {carcassMaterials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (₹{m.unitPrice})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Shutter Finish</label>
                  <select
                    value={optionAShutter}
                    onChange={(e) => setOptionAShutter(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5"
                  >
                    {shutterMaterials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (₹{m.unitPrice})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Countertop</label>
                  <select
                    value={optionACountertop}
                    onChange={(e) => setOptionACountertop(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5"
                  >
                    {countertopMaterials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (₹{m.unitPrice})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Option B Box */}
              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                    Package B (Alternative)
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {formatCurrency(comparison?.estimateB?.grandTotal)}
                  </span>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Carcass Core</label>
                  <select
                    value={optionBCarcass}
                    onChange={(e) => setOptionBCarcass(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5"
                  >
                    {carcassMaterials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (₹{m.unitPrice})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Shutter Finish</label>
                  <select
                    value={optionBShutter}
                    onChange={(e) => setOptionBShutter(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5"
                  >
                    {shutterMaterials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (₹{m.unitPrice})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Countertop</label>
                  <select
                    value={optionBCountertop}
                    onChange={(e) => setOptionBCountertop(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5"
                  >
                    {countertopMaterials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} (₹{m.unitPrice})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Update Comparison</span>
              </button>
            </div>
          </form>

          {/* Variance Summary Banner */}
          {comparison && (
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
              isBMoreExpensive
                ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-xl ${
                  isBMoreExpensive ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {isBMoreExpensive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-xs font-semibold">
                    {isBMoreExpensive
                      ? `Option B is ${comparison.percentageDifference}% higher than Option A`
                      : `Option B saves ${Math.abs(comparison.percentageDifference)}% compared to Option A`}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Net Price Delta: <span className="font-mono font-bold text-slate-200">{formatCurrency(comparison.totalDifference)}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Option A vs Option B</span>
                <span className="text-xs font-mono font-semibold text-slate-300">
                  {formatCurrency(comparison?.estimateA?.grandTotal)} &rarr; {formatCurrency(comparison?.estimateB?.grandTotal)}
                </span>
              </div>
            </div>
          )}

          {/* Detailed Side-by-Side Comparison Table */}
          {comparison && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Itemized Cost Variance Breakdown
              </h3>
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/70 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3 font-medium">Cost Component</th>
                      <th className="py-2.5 px-3 font-medium text-right text-sky-400">Option A</th>
                      <th className="py-2.5 px-3 font-medium text-right text-indigo-400">Option B</th>
                      <th className="py-2.5 px-3 font-medium text-right">Variance (B - A)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-slate-200">Carcass Boxes Subtotal</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(comparison.estimateA?.carcassSubtotal)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(comparison.estimateB?.carcassSubtotal)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-300">
                        {formatCurrency(comparison.itemizedDifferences?.carcassDifference)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-slate-200">Front Shutters Subtotal</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(comparison.estimateA?.shutterSubtotal)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(comparison.estimateB?.shutterSubtotal)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-300">
                        {formatCurrency(comparison.itemizedDifferences?.shutterDifference)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-slate-200">Countertop Slab Subtotal</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(comparison.estimateA?.countertopSubtotal)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(comparison.estimateB?.countertopSubtotal)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-300">
                        {formatCurrency(comparison.itemizedDifferences?.countertopDifference)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-slate-200">Hardware & Fittings</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(comparison.estimateA?.hardwareSubtotal)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(comparison.estimateB?.hardwareSubtotal)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-300">
                        {formatCurrency(comparison.itemizedDifferences?.hardwareDifference)}
                      </td>
                    </tr>
                    <tr className="bg-slate-800/30 font-semibold">
                      <td className="py-2.5 px-3 text-slate-200">Materials Total</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(comparison.estimateA?.materialTotal)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(comparison.estimateB?.materialTotal)}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-100">
                        {formatCurrency(comparison.itemizedDifferences?.materialTotalDifference)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-slate-200">Net Taxable Amount</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(comparison.estimateA?.netTaxableAmount)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(comparison.estimateB?.netTaxableAmount)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-300">
                        {formatCurrency(comparison.itemizedDifferences?.taxableAmountDifference)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-medium text-slate-200">GST (18%)</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(comparison.estimateA?.taxAmount)}</td>
                      <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(comparison.estimateB?.taxAmount)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-300">
                        {formatCurrency(comparison.itemizedDifferences?.taxDifference)}
                      </td>
                    </tr>
                    <tr className="bg-slate-850 font-bold text-sm">
                      <td className="py-3 px-3 text-slate-100">Grand Total Project Cost</td>
                      <td className="py-3 px-3 text-right font-mono text-sky-400">{formatCurrency(comparison.estimateA?.grandTotal)}</td>
                      <td className="py-3 px-3 text-right font-mono text-indigo-400">{formatCurrency(comparison.estimateB?.grandTotal)}</td>
                      <td className={`py-3 px-3 text-right font-mono ${isBMoreExpensive ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {formatCurrency(comparison.totalDifference)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-850 border-t border-slate-800 flex items-center justify-end">
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
