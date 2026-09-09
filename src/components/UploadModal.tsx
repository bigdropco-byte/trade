import React, { useRef, useState } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  FileCode, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { parseStatementFile, ParseResult } from '../utils/parser';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataParsed: (result: ParseResult) => void;
  onLoadDemo: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onDataParsed,
  onLoadDemo,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setError(null);
    setSuccessInfo(null);
    setIsLoading(true);

    try {
      const result = await parseStatementFile(file);
      if (result.trades.length === 0) {
        setError('No closed positions found in this file. Please ensure this is an MT5 or MT4 Trade History Report.');
        setIsLoading(false);
        return;
      }

      setSuccessInfo(`Successfully imported ${result.trades.length} trades for ${result.accountInfo.name || 'Account'} (${result.accountInfo.broker || 'MT5'})!`);
      setTimeout(() => {
        onDataParsed(result);
        onClose();
        setIsLoading(false);
      }, 700);
    } catch (err: unknown) {
      console.error(err);
      setError('Failed to parse statement. Please check that the file is an MT5/MT4 Excel (.xlsx/.xls), HTML, or CSV report.');
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              Upload Trading Statement
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Supports MT5 / MT4 Excel (.xlsx, .xls), HTML statements, and CSV exports
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Zero-Knowledge Privacy Banner */}
        <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-semibold text-emerald-800">100% Client-Side Privacy: </span>
            <span className="text-slate-600">
              Your trade history, profits, and account details are parsed entirely inside your web browser. Nothing is ever transmitted to or stored on any server.
            </span>
          </div>
        </div>

        {/* Drag & Drop Area (Light White Dropzone) */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`mt-5 border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-emerald-500 bg-emerald-50/50 scale-[1.01]'
              : 'border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-slate-100/70'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleInputChange}
            accept=".xlsx,.xls,.csv,.html,.htm"
            className="hidden"
          />

          <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-3 shadow-xs">
            <Upload className="w-7 h-7 text-emerald-600 animate-bounce" />
          </div>

          <p className="text-sm font-semibold text-slate-900">
            Click to select or drag and drop your statement file here
          </p>
          <p className="text-xs text-slate-500 mt-1">
            MT5 / MT4 "Trade History Report" (.xlsx, .xls, .htm, .html, .csv)
          </p>

          <div className="flex items-center gap-3 mt-4 text-[11px] text-slate-600">
            <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Excel (.xlsx/.xls)
            </span>
            <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
              <FileCode className="w-3.5 h-3.5 text-indigo-600" /> MT4/MT5 HTML
            </span>
            <span className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-200 shadow-2xs">
              <FileSpreadsheet className="w-3.5 h-3.5 text-teal-600" /> CSV
            </span>
          </div>
        </div>

        {/* Status Indicators */}
        {isLoading && (
          <div className="mt-4 p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-3 text-xs text-indigo-800">
            <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span>Parsing trades, positions, tickets and recalculating statistics...</span>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successInfo && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successInfo}</span>
          </div>
        )}

        {/* Quick Sample Portfolio Preloader Alternative & Sample Download */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Don't have an Excel report ready right now?
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/sample_mt5_statement.xlsx"
              download="sample_mt5_statement.xlsx"
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-all"
              title="Download sample Excel statement to test upload"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Download Sample .xlsx</span>
            </a>
            <button
              onClick={() => {
                onLoadDemo();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all cursor-pointer"
              title="Explore Verified Sample Portfolio"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Sample Portfolio</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
