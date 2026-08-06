import React, { useState } from 'react';
import { StudentAnalyticsItem } from '../../types';
import { Search, Download, CheckCircle2, AlertTriangle, Clock, Award, Filter } from 'lucide-react';

interface StudentAnalyticsProps {
  analytics: StudentAnalyticsItem[];
}

export const StudentAnalytics: React.FC<StudentAnalyticsProps> = ({ analytics }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'In Progress' | 'At Risk'>('All');

  const filtered = analytics.filter((item) => {
    const matchesSearch = item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.courseTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportCSV = () => {
    const headers = 'Student ID,Name,Course,Progress %,Quiz Avg %,Status,Last Active\n';
    const rows = filtered.map((f) => `"${f.studentId}","${f.studentName}","${f.courseTitle}",${f.progressPercent},${f.averageQuizScore},"${f.status}","${f.lastActive}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PT_JASA_PRIMA_PAPUA_Student_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-[#0F172A]">Workforce Student Analytics & Progress</h1>
          <p className="text-xs text-slate-500">Track student quiz completion scores, pass rates, and training status.</p>
        </div>

        <button
          id="analytics-export-csv-btn"
          onClick={handleExportCSV}
          className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#F8FAFC] text-[#0EA5E9] border border-[#E2E8F0] text-xs font-bold flex items-center space-x-2 transition-all shrink-0 cursor-pointer shadow-sm"
        >
          <Download className="w-4 h-4" />
          <span>Export Analytics Report (CSV)</span>
        </button>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            id="analytics-search-input"
            type="text"
            placeholder="Search student name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-white border border-[#E2E8F0] rounded-xl text-xs text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#0EA5E9] font-medium"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-semibold">Status:</span>
          {(['All', 'Completed', 'In Progress', 'At Risk'] as const).map((st) => (
            <button
              key={st}
              id={`analytics-filter-${st}`}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#0EA5E9] text-white font-bold shadow-sm'
                  : 'bg-white text-slate-600 hover:text-[#0F172A] border border-[#E2E8F0]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-[#0F172A]">
            <thead className="bg-[#F8FAFC] text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-[#E2E8F0]">
              <tr>
                <th className="py-3.5 px-5">Student Info</th>
                <th className="py-3.5 px-5">Course Enrolled</th>
                <th className="py-3.5 px-5">Progress</th>
                <th className="py-3.5 px-5">Quiz Avg Score</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-[#F8FAFC]/80 transition-colors">
                  <td className="py-4 px-5">
                    <div>
                      <p className="font-bold text-[#0F172A] text-xs">{item.studentName}</p>
                      <p className="text-[10px] font-semibold text-[#0EA5E9]">ID: {item.studentId}</p>
                    </div>
                  </td>
                  <td className="py-4 px-5 font-bold text-slate-700">
                    {item.courseTitle}
                  </td>
                  <td className="py-4 px-5">
                    <div className="space-y-1 w-28">
                      <div className="flex justify-between text-[10px] font-bold text-slate-600">
                        <span>{item.progressPercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0EA5E9]"
                          style={{ width: `${item.progressPercent}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5">
                    <span className="font-extrabold text-[#0EA5E9]">{item.averageQuizScore}%</span>
                  </td>
                  <td className="py-4 px-5">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        item.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : item.status === 'At Risk'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-cyan-50 text-[#0EA5E9] border border-cyan-200'
                      }`}
                    >
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-slate-500 text-[11px] font-medium">
                    {item.lastActive}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
