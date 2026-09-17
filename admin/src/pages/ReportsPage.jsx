import React, { useEffect, useState } from 'react';
import { getReports, updateReportStatus, reviewSubmission } from '../api/client';
import ReviewModal from '../components/ReviewModal';
import {
  Flag,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Eye,
  Clock,
  User,
  Mail,
  Calendar,
  RefreshCw,
  FileText,
  LifeBuoy
} from 'lucide-react';

export default function ReportsPage({ onReportsCountChange }) {
  const [reports, setReports] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, resolved: 0, dismissed: 0, total: 0 });
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchReportsData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReports(statusFilter);
      setReports(data.reports || []);
      if (data.counts) {
        setCounts(data.counts);
        if (onReportsCountChange) {
          onReportsCountChange(data.counts.pending || 0);
        }
      }
    } catch (err) {
      console.error('Failed to load moderation reports:', err);
      setError('Failed to load moderation reports. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [statusFilter]);

  const handleUpdateStatus = async (reportId, newStatus) => {
    try {
      setActionLoading(reportId);
      await updateReportStatus(reportId, newStatus);
      await fetchReportsData();
    } catch (err) {
      console.error(`Failed to update report ${reportId}:`, err);
      alert(err.response?.data?.error || `Failed to mark report as ${newStatus}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReviewComplete = async (id, status, comment) => {
    await reviewSubmission(id, status, comment);
    // Refresh reports list
    fetchReportsData();
  };

  const getReasonBadge = (reason) => {
    switch (reason) {
      case 'Copyright / Plagiarism':
        return 'bg-[#fef2f2] text-[#991b1b] border-[#fecaca]';
      case 'Privacy / Personal Info':
        return 'bg-[#fffbeb] text-[#92400e] border-[#fde68a]';
      case 'Inappropriate Content':
        return 'bg-[#fdf4ff] text-[#86198f] border-[#f5d0fe]';
      case 'Harassment':
        return 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]';
      case 'Bug / Functional Issue':
        return 'bg-red-50 text-red-800 border-red-200';
      case 'Feature Suggestion':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'General Feedback':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Content / Editorial Query':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      default:
        return 'bg-[#f4efe4] text-[#635d54] border-[#e2dcce]';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'resolved':
        return 'bg-green-100 text-green-900 border-green-300';
      case 'dismissed':
        return 'bg-stone-100 text-stone-700 border-stone-300';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-300';
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#e8e2d2]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#853528]" />
            <span className="text-[11px] font-sans uppercase tracking-widest text-[#853528] font-bold">
              Content Moderation
            </span>
          </div>
          <h1 className="font-editorial text-2xl sm:text-3xl font-bold text-[#1a1917] tracking-tight">
            Submission Reports & Safety
          </h1>
          <p className="text-xs text-[#787163] font-serif mt-1">
            Review community-flagged creative pieces for plagiarism, privacy concerns, or campus policy violations.
          </p>
        </div>

        <button
          onClick={fetchReportsData}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f4efe4] hover:bg-[#eae4d5] text-[#433e38] text-xs font-semibold rounded border border-[#d5ccba] transition-colors"
          title="Refresh reports"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mt-6 pb-2 border-b border-[#ece6d8] text-xs font-sans overflow-x-auto">
        <button
          onClick={() => setStatusFilter('pending')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
            statusFilter === 'pending'
              ? 'bg-[#853528] text-white font-semibold'
              : 'text-[#635d54] hover:bg-[#f4efe4]'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Pending Review</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            statusFilter === 'pending' ? 'bg-white text-[#853528]' : 'bg-[#e2dcce] text-[#433e38]'
          }`}>
            {counts.pending}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('resolved')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
            statusFilter === 'resolved'
              ? 'bg-[#853528] text-white font-semibold'
              : 'text-[#635d54] hover:bg-[#f4efe4]'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Resolved</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            statusFilter === 'resolved' ? 'bg-white text-[#853528]' : 'bg-[#e2dcce] text-[#433e38]'
          }`}>
            {counts.resolved}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('dismissed')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
            statusFilter === 'dismissed'
              ? 'bg-[#853528] text-white font-semibold'
              : 'text-[#635d54] hover:bg-[#f4efe4]'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Dismissed</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            statusFilter === 'dismissed' ? 'bg-white text-[#853528]' : 'bg-[#e2dcce] text-[#433e38]'
          }`}>
            {counts.dismissed}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('all')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded transition-colors ${
            statusFilter === 'all'
              ? 'bg-[#853528] text-white font-semibold'
              : 'text-[#635d54] hover:bg-[#f4efe4]'
          }`}
        >
          <span>All Reports</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
            statusFilter === 'all' ? 'bg-white text-[#853528]' : 'bg-[#e2dcce] text-[#433e38]'
          }`}>
            {counts.total}
          </span>
        </button>
      </div>

      {/* Reports List */}
      <div className="mt-6">
        {loading ? (
          <div className="py-20 text-center text-xs font-serif italic text-[#787163]">
            Fetching moderation reports...
          </div>
        ) : error ? (
          <div className="p-4 bg-[#fbf2ef] border border-[#e8c8bf] rounded text-xs text-[#8c3525] text-center">
            {error}
          </div>
        ) : reports.length === 0 ? (
          <div className="py-20 text-center bg-[#fcfbf9] border border-[#e8e2d2] rounded-sm p-8">
            <Flag className="w-8 h-8 text-[#a09889] mx-auto mb-3" />
            <h3 className="font-editorial text-lg font-bold text-[#1a1917] mb-1">
              No {statusFilter !== 'all' ? statusFilter : ''} reports found
            </h3>
            <p className="text-xs text-[#787163] font-serif max-w-sm mx-auto">
              {statusFilter === 'pending'
                ? 'All creative submissions are currently clear of pending community reports.'
                : 'No reports match the selected status filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div
                key={report.id}
                className="bg-[#fcfbf9] border border-[#e8e2d2] rounded-sm p-5 hover:border-[#c5bbab] transition-all shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-5"
              >
                {/* Left: Report and Submission Info */}
                <div className="flex-1 space-y-3">
                  {/* Status and Reason Badges */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold border ${getStatusBadge(report.status)}`}>
                      {report.status}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-semibold border ${getReasonBadge(report.reason)}`}>
                      {report.reason}
                    </span>
                    <span className="text-[#a09889] text-[11px] font-serif flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(report.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Either Submission Details Card or Website Issue/Suggestion Card */}
                  {report.submission ? (
                    <div className="p-3 bg-[#faf7f0] border border-[#ece6d8] rounded-sm">
                      <div className="flex items-center gap-2 text-xs text-[#787163] mb-1 font-sans">
                        <span className="px-2 py-0.5 rounded bg-[#f4ebd9] text-[#7d481b] font-semibold text-[10px] uppercase">
                          {report.submission?.type || 'Piece'}
                        </span>
                        <span>·</span>
                        <span className="italic">{report.submission?.category}</span>
                        <span>·</span>
                        <span className="text-[#853528] font-medium">Status: {report.submission?.status}</span>
                      </div>

                      <h3 className="font-editorial text-lg font-bold text-[#1a1917]">
                        {report.submission?.title || 'Unknown Submission'}
                      </h3>

                      <p className="text-xs text-[#524c42] mt-1 font-sans flex items-center gap-1.5">
                        <User className="w-3 h-3 text-[#853528]" />
                        <span>Author: {report.submission?.authorDisplayName}</span>
                        {report.submission?.author?.email && (
                          <span className="text-[#787163]">({report.submission.author.email})</span>
                        )}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 bg-[#faf7f0] border border-[#ece6d8] rounded-sm">
                      <div className="flex items-center gap-2 text-xs text-[#787163] mb-1 font-sans">
                        <span className="px-2 py-0.5 rounded bg-[#ede5d4] text-[#853528] font-semibold text-[10px] uppercase flex items-center gap-1">
                          <LifeBuoy className="w-3 h-3" />
                          <span>Website Issue / Suggestion</span>
                        </span>
                        {report.subject && (
                          <>
                            <span>·</span>
                            <span className="font-semibold text-[#1a1917]">{report.subject}</span>
                          </>
                        )}
                      </div>

                      <h3 className="font-editorial text-lg font-bold text-[#1a1917]">
                        {report.subject || `${report.reason} Report`}
                      </h3>
                    </div>
                  )}

                  {/* Reporter's Comments */}
                  {report.details && (
                    <div className="text-xs text-[#433e38] font-serif p-3 bg-white border border-[#e8e2d2] rounded-sm">
                      <p className="font-sans font-semibold text-[11px] uppercase tracking-wider text-[#787163] mb-1">
                        Reporter Context:
                      </p>
                      <p className="leading-relaxed whitespace-pre-wrap">{report.details}</p>
                    </div>
                  )}

                  {/* Reporter Contact Info */}
                  <div className="text-[11px] text-[#787163] font-sans flex items-center gap-2">
                    <Mail className="w-3 h-3 text-[#8c8477]" />
                    <span>
                      Reporter:{' '}
                      {report.reporterEmail ? (
                        <a href={`mailto:${report.reporterEmail}`} className="text-[#853528] underline">
                          {report.reporterEmail}
                        </a>
                      ) : (
                        <span className="italic text-[#a09889]">Anonymous Visitor</span>
                      )}
                    </span>
                    {report.resolvedBy && (
                      <>
                        <span>·</span>
                        <span>Resolved by: {report.resolvedBy.name}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right: Moderation Actions */}
                <div className="flex flex-row md:flex-col items-stretch gap-2 flex-shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-[#ece6d8]">
                  {/* Inspect Submission */}
                  {report.submission && (
                    <button
                      onClick={() => setSelectedSubmission(report.submission)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#853528] text-white hover:bg-[#6e2c21] rounded text-xs font-semibold transition-colors shadow-xs"
                      title="Inspect piece and update editorial status"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Review Piece</span>
                    </button>
                  )}

                  {/* Status Toggle Actions */}
                  {report.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(report.id, 'resolved')}
                        disabled={actionLoading === report.id}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white rounded text-xs font-semibold transition-colors"
                        title="Mark issue resolved"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Mark Resolved</span>
                      </button>

                      <button
                        onClick={() => handleUpdateStatus(report.id, 'dismissed')}
                        disabled={actionLoading === report.id}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#f4efe4] hover:bg-[#e6dfcf] text-[#635d54] hover:text-[#1a1917] rounded text-xs font-semibold border border-[#d5ccba] transition-colors"
                        title="Dismiss report as invalid or harmless"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Dismiss Report</span>
                      </button>
                    </>
                  )}

                  {report.status !== 'pending' && (
                    <button
                      onClick={() => handleUpdateStatus(report.id, 'pending')}
                      disabled={actionLoading === report.id}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#f4efe4] hover:bg-[#e6dfcf] text-[#635d54] rounded text-xs font-medium border border-[#d5ccba] transition-colors"
                    >
                      <span>Re-open Report</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Embedded Review Modal for Immediate Action */}
      {selectedSubmission && (
        <ReviewModal
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onReviewComplete={handleReviewComplete}
        />
      )}
    </div>
  );
}
