import React, { useState } from 'react';
import { Certificate } from '../../types';
import { Award, Printer, Download, CheckCircle, ShieldCheck, Building2, QrCode, Sparkles } from 'lucide-react';

interface CertificatesViewProps {
  certificates: Certificate[];
}

export const CertificatesView: React.FC<CertificatesViewProps> = ({ certificates }) => {
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(certificates[0] || null);

  const handlePrint = () => {
    window.print();
  };

  if (certificates.length === 0) {
    return (
      <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
        <Award className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-lg font-bold text-white">No Certificates Earned Yet</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Complete all module lessons and pass quizzes with 75%+ score to earn official PT. JASA PRIMA PAPUA digital certificates.
        </p>
      </div>
    );
  }

  const cert = selectedCert || certificates[0];

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-[#0F172A]">Official Industry Certificates</h1>
          <p className="text-xs text-slate-500 font-medium">ESDM & ISO-aligned vocational certificates issued by PT. JASA PRIMA PAPUA.</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="cert-print-btn"
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-extrabold text-xs flex items-center space-x-2 shadow-lg shadow-[#0EA5E9]/20 shrink-0 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Download PDF</span>
          </button>
        </div>
      </div>

      {/* Certificate Selector Pills if multiple */}
      {certificates.length > 1 && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-2">
          {certificates.map((c) => (
            <button
              key={c.id}
              id={`select-cert-btn-${c.id}`}
              onClick={() => setSelectedCert(c)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                cert.id === c.id
                  ? 'bg-[#0EA5E9] text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-[#E2E8F0] hover:text-[#0F172A]'
              }`}
            >
              {c.courseTitle}
            </button>
          ))}
        </div>
      )}

      {/* Official Certificate Card Document */}
      <div id="printable-certificate" className="bg-[#FAF9F6] text-slate-900 p-8 sm:p-12 rounded-2xl border-4 border-amber-600/40 shadow-2xl relative overflow-hidden space-y-8 font-serif">
        
        {/* Subtle Decorative Borders */}
        <div className="absolute inset-3 border-2 border-dashed border-amber-700/30 rounded-xl pointer-events-none" />

        {/* Certificate Header */}
        <div className="text-center space-y-2 relative z-10 border-b border-amber-900/20 pb-6">
          <div className="flex items-center justify-center space-x-2 text-amber-900">
            <Building2 className="w-8 h-8 text-amber-700" />
            <span className="font-extrabold text-2xl tracking-widest uppercase">PT. JASA PRIMA PAPUA</span>
          </div>
          <p className="text-xs font-sans uppercase tracking-widest text-amber-800 font-bold">
            LEMBAGA PELATIHAN KERJA & ENTERPRISE TECHNICAL CENTER
          </p>
          <p className="text-[10px] font-sans text-slate-600">
            SK Kemenaker & ESDM Papua Regional Certification Authority • Jayapura, Indonesia
          </p>
        </div>

        {/* Main Certificate Content */}
        <div className="text-center space-y-6 relative z-10 max-w-2xl mx-auto py-4">
          <p className="text-xs font-sans uppercase tracking-widest text-slate-500 font-semibold">
            This is to officially certify that
          </p>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 underline decoration-amber-600 decoration-2 underline-offset-8">
            {cert.studentName}
          </h2>

          <p className="text-xs font-sans text-slate-600">
            Student Identification Number: <span className="font-bold text-slate-900">{cert.studentId}</span>
          </p>

          <p className="text-xs font-sans leading-relaxed text-slate-700">
            has successfully completed all prescribed coursework, technical field standards, and passed the final competency assessment for the vocational program:
          </p>

          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl font-sans">
            <h3 className="text-lg font-bold text-amber-950">{cert.courseTitle}</h3>
            <p className="text-[11px] text-amber-800 mt-1">
              Issued in accordance with PT. JASA PRIMA PAPUA Industrial Competency Standards (2026 Edition)
            </p>
          </div>
        </div>

        {/* Certificate Footer / Signatures */}
        <div className="pt-8 border-t border-amber-900/20 grid grid-cols-2 md:grid-cols-3 items-end gap-6 relative z-10 text-center font-sans text-xs">
          
          <div className="space-y-1">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Date of Issuance</p>
            <p className="font-bold text-slate-900">{cert.issueDate}</p>
            <p className="text-[10px] text-slate-500 mt-2">Valid Until: {cert.expiryDate || 'Permanent'}</p>
          </div>

          <div className="flex flex-col items-center justify-center space-y-1">
            <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-600 text-amber-800 flex items-center justify-center shadow-inner">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-900">Official Gold Seal</span>
          </div>

          <div className="space-y-1 text-right">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Authorized Signatory</p>
            <p className="font-extrabold text-slate-900 underline">{cert.instructorName}</p>
            <p className="text-[10px] text-slate-600">{cert.instructorTitle}</p>
          </div>

        </div>

        {/* Verification Footer Bar */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[10px] font-sans text-slate-500 relative z-10">
          <div>
            <span className="font-semibold text-slate-700">Certificate No:</span> {cert.certificateNumber}
          </div>
          <div className="flex items-center space-x-1 text-teal-700">
            <QrCode className="w-3.5 h-3.5" />
            <span>Verified Online at jasaprimapapua.co.id/verify</span>
          </div>
        </div>

      </div>

    </div>
  );
};
