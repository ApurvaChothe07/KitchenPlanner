import React, { useState, useEffect } from 'react';
import { X, FileText, Download, CheckCircle, Clock, AlertTriangle, ChevronRight, Eye, RefreshCw, Send, Ban } from 'lucide-react';
import { quotationService } from '../../services/quotationService';

export const QuotationsModal = ({ projectId, designId, isOpen, onClose }) => {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    if (!isOpen || !projectId) return;
    loadQuotations();
  }, [isOpen, projectId]);

  const loadQuotations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await quotationService.getQuotationsForProject(projectId);
      setQuotations(data);
      if (data.length > 0 && !selectedQuote) {
        loadQuoteDetails(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load quotations:', err);
      setError(err.response?.data?.message || 'Failed to load project quotations.');
    } finally {
      setLoading(false);
    }
  };

  const loadQuoteDetails = async (id) => {
    try {
      const details = await quotationService.getQuotationById(id);
      setSelectedQuote(details);
    } catch (err) {
      console.error('Failed to load quotation details:', err);
    }
  };

  const handleDownloadPdf = async (quote, e) => {
    if (e) e.stopPropagation();
    try {
      setDownloadingId(quote.id);
      await quotationService.downloadPdf(quote.id, quote.quotationNumber);
    } catch (err) {
      console.error('Failed to download PDF:', err);
      alert('Could not download quotation PDF.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleStatusChange = async (quoteId, newStatus) => {
    try {
      setUpdatingId(quoteId);
      const updated = await quotationService.updateStatus(quoteId, newStatus);
      setSelectedQuote(updated);
      setQuotations((prev) =>
        prev.map((q) => (q.id === quoteId ? { ...q, status: updated.status, issuedAt: updated.issuedAt } : q))
      );
    } catch (err) {
      console.error('Failed to update status:', err);
      alert(err.response?.data?.message || 'Could not update quotation status.');
    } finally {
      setUpdatingId(null);
    }
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

  const formatDate = (isoStr) => {
    if (!isoStr) return 'N/A';
    return new Date(isoStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ISSUED':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800">
            <CheckCircle className="w-3 h-3" />
            <span>ISSUED</span>
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-950/60 text-red-400 border border-red-800">
            <Ban className="w-3 h-3" />
            <span>CANCELLED</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/60 text-amber-400 border border-amber-800">
            <Clock className="w-3 h-3" />
            <span>DRAFT</span>
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-6xl my-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-brand-600/10 border border-brand-500/20 text-brand-400 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100 flex items-center space-x-2">
                <span>Project Quotations & PDF Records</span>
                <span className="text-xs bg-slate-800 text-brand-400 font-mono px-2 py-0.5 rounded border border-slate-700">
                  {quotations.length} Issued / Drafts
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Official quotes with frozen material rates, immutable line items, and corporate PDF generation
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

        {/* Body (Split Screen: Left List, Right Detailed Inspector) */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          {/* Left Column: Quotations History List */}
          <div className="w-full md:w-80 border-r border-slate-800 bg-slate-950/40 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase text-slate-400 tracking-wider pb-2 border-b border-slate-800/80">
              <span>Historical Quotes</span>
              <button
                onClick={loadQuotations}
                disabled={loading}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200 transition"
                title="Refresh list"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loading && quotations.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-500">Loading quotations...</div>
            )}

            {!loading && quotations.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-500">
                No quotations created yet for this project. Open the Cost Estimate modal to generate an official quote.
              </div>
            )}

            {quotations.map((q) => {
              const isSelected = selectedQuote?.id === q.id;
              return (
                <div
                  key={q.id}
                  onClick={() => loadQuoteDetails(q.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition text-left space-y-2 ${
                    isSelected
                      ? 'bg-slate-850 border-brand-500/50 shadow-md ring-1 ring-brand-500/20'
                      : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-850/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-slate-200">{q.quotationNumber}</span>
                    {getStatusBadge(q.status)}
                  </div>

                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] text-slate-400">{formatDate(q.createdAt)}</span>
                    <span className="text-xs font-mono font-bold text-brand-300">
                      {formatCurrency(q.finalTotal)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px]">
                    <span className="text-slate-400 truncate max-w-[140px]">{q.clientName || 'Standard Client'}</span>
                    <button
                      onClick={(e) => handleDownloadPdf(q, e)}
                      disabled={downloadingId === q.id}
                      className="p-1 hover:bg-slate-800 text-sky-400 hover:text-sky-300 rounded transition flex items-center space-x-1"
                      title="Download PDF"
                    >
                      <Download className={`w-3.5 h-3.5 ${downloadingId === q.id ? 'animate-bounce' : ''}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Selected Quotation Details & Inspection */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {selectedQuote ? (
              <>
                {/* Quotation Header & Actions */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="flex items-center space-x-3">
                      <h3 className="text-base font-bold font-mono text-slate-100">{selectedQuote.quotationNumber}</h3>
                      {getStatusBadge(selectedQuote.status)}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Project: <span className="text-slate-200">{selectedQuote.projectName}</span> • Design Version: <span className="text-slate-200">v{selectedQuote.version}</span> • Date: <span className="text-slate-200">{formatDate(selectedQuote.createdAt)}</span>
                    </p>
                  </div>

                  {/* Top Action Buttons */}
                  <div className="flex items-center space-x-2">
                    {selectedQuote.status === 'DRAFT' && (
                      <button
                        onClick={() => handleStatusChange(selectedQuote.id, 'ISSUED')}
                        disabled={updatingId === selectedQuote.id}
                        className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Issue to Client</span>
                      </button>
                    )}

                    {selectedQuote.status !== 'CANCELLED' && (
                      <button
                        onClick={() => handleStatusChange(selectedQuote.id, 'CANCELLED')}
                        disabled={updatingId === selectedQuote.id}
                        className="flex items-center space-x-1.5 bg-slate-800 hover:bg-red-950 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-800 px-3 py-1.5 rounded-lg text-xs font-medium transition"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Cancel Quote</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleDownloadPdf(selectedQuote)}
                      disabled={downloadingId === selectedQuote.id}
                      className="flex items-center space-x-1.5 bg-sky-600 hover:bg-sky-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition"
                    >
                      <Download className={`w-3.5 h-3.5 ${downloadingId === selectedQuote.id ? 'animate-bounce' : ''}`} />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>

                {/* Client & Material Snapshot Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 text-xs space-y-1.5">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                      Client & Site Information
                    </span>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Client Name:</span>
                      <span className="text-slate-200 font-medium">{selectedQuote.clientName || 'N/A'}</span>
                    </div>
                    {selectedQuote.clientEmail && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Email:</span>
                        <span className="text-slate-200">{selectedQuote.clientEmail}</span>
                      </div>
                    )}
                    {selectedQuote.clientPhone && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Phone:</span>
                        <span className="text-slate-200">{selectedQuote.clientPhone}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Valid Until:</span>
                      <span className="text-slate-200">{formatDate(selectedQuote.validUntil)}</span>
                    </div>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 text-xs space-y-1.5">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                      Snapshotted Material Specs
                    </span>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Carcass Core:</span>
                      <span className="text-slate-200 font-medium truncate max-w-[200px]" title={selectedQuote.carcassMaterialSnapshot}>
                        {selectedQuote.carcassMaterialSnapshot}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Shutter Finish:</span>
                      <span className="text-slate-200 font-medium truncate max-w-[200px]" title={selectedQuote.shutterMaterialSnapshot}>
                        {selectedQuote.shutterMaterialSnapshot}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Countertop:</span>
                      <span className="text-slate-200 font-medium truncate max-w-[200px]" title={selectedQuote.countertopMaterialSnapshot}>
                        {selectedQuote.countertopMaterialSnapshot}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Snapshotted Items Table */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Snapshotted Bill of Charges ({selectedQuote.items?.length || 0} line items)
                  </h4>
                  <div className="overflow-x-auto border border-slate-800 rounded-xl">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-800/70 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="py-2.5 px-3 font-medium">Item Description</th>
                          <th className="py-2.5 px-3 font-medium">Category</th>
                          <th className="py-2.5 px-3 font-medium text-right">Quantity</th>
                          <th className="py-2.5 px-3 font-medium text-right">Unit Price</th>
                          <th className="py-2.5 px-3 font-medium text-right">Total Price</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                        {selectedQuote.items?.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-800/40 transition">
                            <td className="py-2.5 px-3 font-medium text-slate-200">
                              <div>{item.itemDescription}</div>
                              {item.calculationNotes && (
                                <div className="text-[10px] text-slate-400">{item.calculationNotes}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {item.category}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono">
                              {Number(item.quantity).toFixed(2)} {item.unit}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-100">
                              {formatCurrency(item.totalPrice)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Financial Summary Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Materials Subtotal:</span>
                      <span className="font-mono text-slate-200">{formatCurrency(selectedQuote.materialSubtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Wastage Allowance ({selectedQuote.wastagePercentage}%):</span>
                      <span className="font-mono text-slate-200">{formatCurrency(selectedQuote.wastageAmount)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Carpentry Labour ({selectedQuote.laborPercentage}%):</span>
                      <span className="font-mono text-slate-200">{formatCurrency(selectedQuote.laborAmount)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Site Installation ({selectedQuote.installationPercentage}%):</span>
                      <span className="font-mono text-slate-200">{formatCurrency(selectedQuote.installationAmount)}</span>
                    </div>
                    <div className="h-px bg-slate-800 my-1" />
                    <div className="flex justify-between text-slate-300 font-medium">
                      <span>Gross Subtotal:</span>
                      <span className="font-mono">{formatCurrency(selectedQuote.grossSubtotal)}</span>
                    </div>
                    {Number(selectedQuote.discountAmount || 0) > 0 && (
                      <div className="flex justify-between text-emerald-400">
                        <span>Discount ({selectedQuote.discountPercentage}%):</span>
                        <span className="font-mono">- {formatCurrency(selectedQuote.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-400">
                      <span>Net Taxable Amount:</span>
                      <span className="font-mono text-slate-200">{formatCurrency(selectedQuote.netTaxableAmount)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>GST Tax ({selectedQuote.taxPercentage}%):</span>
                      <span className="font-mono text-slate-200">{formatCurrency(selectedQuote.taxAmount)}</span>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-brand-950/40 via-slate-900 to-slate-900 border border-brand-800/40 rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-brand-400 font-semibold">
                        Final Quoted Amount
                      </span>
                      <div className="text-3xl font-extrabold text-brand-300 mt-2 font-mono">
                        {formatCurrency(selectedQuote.finalTotal)}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Locked and legally binding for {formatDate(selectedQuote.validUntil)}. Historical rates are frozen in this document.
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">PDF Document Ready</span>
                      <button
                        onClick={() => handleDownloadPdf(selectedQuote)}
                        className="text-sky-400 hover:text-sky-300 flex items-center space-x-1 font-medium transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Signed PDF</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center p-8 text-slate-500 text-xs">
                Select a quotation from the list to view historical item details and download PDF.
              </div>
            )}
          </div>
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
