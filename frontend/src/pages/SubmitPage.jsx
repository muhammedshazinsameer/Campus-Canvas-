import React, { useState, useEffect, useRef } from 'react';
import { createSubmission } from '../api/client';
import { useStudentAuth } from '../context/StudentAuthContext';
import { Feather, UploadCloud, CheckCircle2, AlertCircle, Sparkles, FileText, Image as ImageIcon, X, School, LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';

const TYPES = [
  { id: 'Poetry', label: 'Poetry', desc: 'Free verse, sonnets, haikus, spoken word' },
  { id: 'Fiction', label: 'Fiction', desc: 'Short stories, flash fiction, narrative excerpts' },
  { id: 'Essay', label: 'Essay', desc: 'Personal essays, cultural critique, memoirs' },
  { id: 'Art', label: 'Art', desc: 'Paintings, digital art, drawings, mixed media' },
  { id: 'Photography', label: 'Photography', desc: 'Film, digital, monochrome, documentary' },
  { id: 'Poster', label: 'Poster', desc: 'Typography, silkscreen, event posters, graphics' },
];

export default function SubmitPage() {
  const { studentUser, isAuthenticated, openAuthModal } = useStudentAuth();
  const warningRef = useRef(null);
  const [highlightWarning, setHighlightWarning] = useState(false);

  const [title, setTitle] = useState('');
  const [type, setType] = useState('Poetry');
  const [category, setCategory] = useState('');
  const [authorDisplayName, setAuthorDisplayName] = useState('');
  const [textContent, setTextContent] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  useEffect(() => {
    if (studentUser && !authorDisplayName) {
      setAuthorDisplayName(studentUser.name || '');
    }
  }, [studentUser]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [submittedPiece, setSubmittedPiece] = useState(null);

  const isVisualMedium = ['Art', 'Photography', 'Poster'].includes(type);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (!selected) return;

    // Check size limit (15MB)
    if (selected.size > 15 * 1024 * 1024) {
      setError('Selected file exceeds the 15MB limit.');
      return;
    }

    setFile(selected);
    setError(null);

    // Generate preview if image
    if (selected.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(selected);
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // If student is not signed in, halt submission and scroll smoothly to the warning message!
    if (!isAuthenticated) {
      setError('Student sign-in required: Please sign in with your Yenepoya student account (@yenepoya.edu.in) to submit your manuscript.');
      setHighlightWarning(true);
      setTimeout(() => setHighlightWarning(false), 3000);

      if (warningRef.current) {
        warningRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('Please provide a title for your piece.');
      return;
    }
    if (trimmedTitle.length < 2) {
      setError('Title must be at least 2 characters long.');
      return;
    }
    if (trimmedTitle.length > 150) {
      setError('Title cannot exceed 150 characters.');
      return;
    }

    const trimmedAuthor = authorDisplayName.trim();
    if (!trimmedAuthor) {
      setError('Please provide a display name or pseudonym.');
      return;
    }
    if (trimmedAuthor.length < 2) {
      setError('Author display name must be at least 2 characters long.');
      return;
    }
    if (trimmedAuthor.length > 80) {
      setError('Author display name cannot exceed 80 characters.');
      return;
    }

    if (category.trim().length > 50) {
      setError('Category cannot exceed 50 characters.');
      return;
    }

    if (textContent.trim().length > 50000) {
      setError('Text content cannot exceed 50,000 characters.');
      return;
    }

    // Require either text or file
    if (!isVisualMedium && !textContent.trim() && !file) {
      setError('Please provide the written text for your piece.');
      return;
    }
    if (isVisualMedium && !file && !textContent.trim()) {
      setError('Please upload an image or PDF for your artwork.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('type', type);
      formData.append('category', (category.trim() || type));
      formData.append('authorDisplayName', authorDisplayName.trim());

      if (textContent.trim()) {
        formData.append('textContent', textContent.trim());
      }
      if (file) {
        formData.append('file', file);
      }
      if (tagsInput.trim()) {
        formData.append('tags', tagsInput.trim());
      }

      const res = await createSubmission(formData);
      setSubmittedPiece(res.submission);
    } catch (err) {
      console.error('Submission failed:', err);
      setError(
        err.response?.data?.error ||
        'An error occurred while submitting your piece. Please check your connection and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // If submitted successfully, show confirmation screen
  if (submittedPiece) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-[#fcfbf9] border-2 border-[#d5ccba] p-8 sm:p-10 rounded-sm shadow-md text-center">
          <div className="w-16 h-16 bg-[#edf6ed] border border-[#b8deb7] rounded-full flex items-center justify-center mx-auto mb-4 text-[#2b6629]">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="font-editorial text-3xl font-bold text-[#1a1917] mb-2">
            Manuscript Received
          </h2>
          <p className="text-sm font-serif italic text-[#787163] mb-6">
            Thank you for sharing your work with Campus Canvas.
          </p>

          <div className="p-4 bg-[#f4efe4] border border-[#e4dcce] rounded text-left mb-6 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-[#8c8477] uppercase tracking-wider font-semibold">Title:</span>
              <span className="font-serif font-bold text-[#1a1917]">{submittedPiece.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8c8477] uppercase tracking-wider font-semibold">Author:</span>
              <span className="font-medium text-[#1a1917]">{submittedPiece.authorDisplayName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8c8477] uppercase tracking-wider font-semibold">Format:</span>
              <span className="text-[#1a1917]">{submittedPiece.type} ({submittedPiece.category})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8c8477] uppercase tracking-wider font-semibold">Status:</span>
              <span className="font-semibold text-[#9d4233] uppercase">Pending Editorial Review</span>
            </div>
            <div className="flex justify-between text-[11px] text-[#8c8477] pt-1 border-t border-[#e2dcce]">
              <span>Tracking ID:</span>
              <span className="font-mono">{submittedPiece.id}</span>
            </div>
          </div>

          <div className="bg-[#fbf7ee] border border-[#ebd8c8] p-4 rounded text-left text-xs text-[#635d54] mb-8 leading-relaxed">
            <h4 className="font-semibold text-[#1a1917] mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#9d4233]" />
              <span>What Happens Next?</span>
            </h4>
            <p>
              Your piece has been queued for our student editorial board. Our editors will review
              your work, and if accepted, it will be published to the public gallery accompanied by an
              "Editor's Note" celebrating your creative choices.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => {
                setSubmittedPiece(null);
                setTitle('');
                setCategory('');
                setTextContent('');
                setTagsInput('');
                setFile(null);
                setFilePreview(null);
              }}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#9d4233] text-white text-xs font-semibold rounded hover:bg-[#853528] transition-colors"
            >
              Submit Another Piece
            </button>
            <Link
              to="/"
              className="w-full sm:w-auto px-5 py-2.5 border border-[#d5ccba] text-[#433e38] text-xs font-semibold rounded hover:bg-[#f4efe4] transition-colors"
            >
              Explore Public Issues
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const wordCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
  const lineCount = textContent ? textContent.split('\n').length : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Header & Mission */}
      <div className="border-b border-[#e8e2d2] pb-6 mb-8 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#f4efe4] border border-[#e4dcce] rounded-full text-xs text-[#9d4233] font-semibold uppercase tracking-wider mb-3">
          <Feather className="w-3.5 h-3.5" />
          <span>Call for Submissions</span>
        </div>
        <h2 className="font-editorial text-3xl sm:text-4xl font-bold text-[#1a1917] mb-2">
          Submit to Campus Canvas
        </h2>
        <p className="text-xs uppercase tracking-wider text-[#9d4233] font-semibold mb-3">
          A Canvas for Every Creative Mind
        </p>
        <p className="text-sm sm:text-base text-[#635d54] font-serif italic max-w-xl mx-auto">
          We welcome original poetry, short fiction, personal essays, visual art, photography, and poster designs from Yenepoya students.
        </p>
      </div>

      {/* Student Authentication Notice / Warning Message Banner */}
      <div ref={warningRef} id="auth-warning-banner" className="mb-8 scroll-mt-24">
        {!isAuthenticated ? (
          <div
            className={`p-5 bg-[#fbf2ef] border-2 rounded-lg shadow-sm transition-all duration-300 ${
              highlightWarning
                ? 'border-[#9d4233] ring-4 ring-[#9d4233]/25 bg-[#fdf5f3] scale-[1.01]'
                : 'border-[#e8c8bf]'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-[#f4deda] border border-[#e8c8bf] flex items-center justify-center text-[#853528] flex-shrink-0 mt-0.5">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-editorial font-bold text-[#853528] flex items-center gap-2">
                    <span>Student Sign-In Required</span>
                    <span className="text-[10px] uppercase font-sans font-semibold tracking-wider px-2 py-0.5 rounded bg-[#f4deda] text-[#853528]">
                      Notice
                    </span>
                  </h3>
                  <p className="text-xs text-[#635d54] mt-1 leading-relaxed max-w-xl font-serif">
                    Manuscript submissions to <em>Campus Canvas</em> are reserved for enrolled students of{' '}
                    <strong className="text-[#1a1917]">Yenepoya (Deemed to be University)</strong>. Please sign in with your campus institutional account
                    (<span className="font-mono text-[#853528] font-semibold">@yenepoya.edu.in</span>) before submitting your work.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={openAuthModal}
                className="w-full sm:w-auto flex-shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#9d4233] hover:bg-[#853528] text-white text-xs font-semibold rounded shadow transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In with Campus ID</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3.5 bg-[#edf6ed] border border-[#b8deb7] rounded-md text-xs text-[#245e22] flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#dcf0dc] flex items-center justify-center text-[#2b6629] flex-shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-[#1a1917]">{studentUser?.name || 'Student Author'}</span>
                <span className="text-[#635d54] ml-1.5 font-mono text-[11px]">({studentUser?.email})</span>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center text-[10px] font-mono uppercase tracking-wider bg-[#dcf0dc] px-2 py-0.5 rounded text-[#245e22] font-semibold border border-[#c3e3c1]">
              Verified Student Author
            </span>
          </div>
        )}
      </div>

      {/* Editorial Notice Banner */}
      <div className="mb-8 p-4 bg-[#f8f5ec] border-l-4 border-[#9d4233] rounded-r-sm text-xs text-[#635d54] leading-relaxed shadow-sm">
        <p className="font-semibold text-[#1a1917] mb-1">
          Editorial Review Step:
        </p>
        <p>
          All submissions are carefully reviewed by our student editorial board before appearing live
          in the public issues. Our editors often attach constructive feedback and commentary via our
          signature <em>Editor's Note</em>. Pseudonyms and pen names are fully supported.
        </p>
      </div>

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="bg-[#fcfbf9] border border-[#e8e2d2] p-6 sm:p-8 rounded-sm shadow-sm space-y-6">
        {error && (
          <div className="p-3 bg-[#fbf2ef] border border-[#e8c8bf] rounded text-xs text-[#8c3525] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Medium / Format Selection */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-[#8c8477] font-semibold mb-2">
            1. Select Medium *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {TYPES.map((t) => {
              const active = type === t.id;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setType(t.id)}
                  className={`p-3 text-left border rounded transition-all ${
                    active
                      ? 'border-[#9d4233] bg-[#fdf5f3] ring-1 ring-[#9d4233]'
                      : 'border-[#e4dcce] bg-[#faf7f0] hover:bg-[#f4efe4]'
                  }`}
                >
                  <div className="font-serif font-bold text-sm text-[#1a1917]">{t.label}</div>
                  <div className="text-[11px] text-[#787163] leading-tight mt-0.5">{t.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs uppercase tracking-wider text-[#8c8477] font-semibold">
              2. Title of Piece *
            </label>
            <span className="text-[11px] text-[#8c8477]">
              {title.length} / 150 characters
            </span>
          </div>
          <input
            type="text"
            required
            maxLength={150}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., The Solitude of Birch Trees"
            className="w-full px-3 py-2 bg-[#faf7f0] border border-[#d5ccba] rounded text-sm text-[#1a1917] focus:outline-none focus:border-[#9d4233]"
          />
        </div>

        {/* Author Display Name (Supports Pseudonyms) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#8c8477] font-semibold mb-1">
              3. Author Display Name / Pen Name *
            </label>
            <input
              type="text"
              required
              maxLength={80}
              value={authorDisplayName}
              onChange={(e) => setAuthorDisplayName(e.target.value)}
              placeholder="e.g., Jane Doe, Anonymous, or Pen Name"
              className="w-full px-3 py-2 bg-[#faf7f0] border border-[#d5ccba] rounded text-sm text-[#1a1917] focus:outline-none focus:border-[#9d4233]"
            />
            <p className="text-[11px] text-[#8c8477] mt-1">
              Supports pen names and anonymity (max 80 chars).
            </p>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#8c8477] font-semibold mb-1">
              4. Specific Category / Genre
            </label>
            <input
              type="text"
              maxLength={50}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder={`e.g., ${type === 'Poetry' ? 'Free Verse, Sonnet' : type === 'Fiction' ? 'Historical Fiction' : type === 'Art' ? 'Oil on Linen' : 'Landscape'}`}
              className="w-full px-3 py-2 bg-[#faf7f0] border border-[#d5ccba] rounded text-sm text-[#1a1917] focus:outline-none focus:border-[#9d4233]"
            />
            <p className="text-[11px] text-[#8c8477] mt-1">
              Leave blank to default to {type} (max 50 chars).
            </p>
          </div>
        </div>

        {/* Written Content (for Poetry / Fiction / Essay / or artist statement) */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs uppercase tracking-wider text-[#8c8477] font-semibold">
              5. {isVisualMedium ? 'Artist Statement / Description (Optional)' : 'Written Piece Content *'}
            </label>
            <span className="text-[11px] text-[#8c8477]">
              {type === 'Poetry' ? `${lineCount} lines` : `${wordCount} words`} · {textContent.length} / 50,000 chars
            </span>
          </div>
          <textarea
            rows={type === 'Poetry' ? 10 : 8}
            maxLength={50000}
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder={
              type === 'Poetry'
                ? "Enter your poem here with intended line breaks and stanza spacing..."
                : "Type or paste your short story, essay, or prose..."
            }
            className={`w-full p-3 bg-[#faf7f0] border border-[#d5ccba] rounded text-sm text-[#1a1917] font-serif leading-relaxed focus:outline-none focus:border-[#9d4233] ${
              type === 'Poetry' ? 'whitespace-pre' : ''
            }`}
          />
        </div>

        {/* File Upload (Images & PDFs) */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-[#8c8477] font-semibold mb-1">
            6. {isVisualMedium ? 'Upload Artwork / Photograph / Poster (Required) *' : 'Attach Supplementary File / PDF (Optional)'}
          </label>

          {!file ? (
            <label className="border-2 border-dashed border-[#d5ccba] hover:border-[#9d4233] bg-[#faf7f0] p-6 rounded cursor-pointer flex flex-col items-center justify-center text-center transition-colors">
              <UploadCloud className="w-8 h-8 text-[#8c8477] mb-2" />
              <p className="text-xs font-medium text-[#1a1917]">
                Click or drag & drop file to upload
              </p>
              <p className="text-[11px] text-[#8c8477] mt-0.5">
                Supports JPG, PNG, WEBP, GIF, and PDF (up to 15MB)
              </p>
              <input
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                onChange={handleFileChange}
              />
            </label>
          ) : (
            <div className="p-3 bg-[#faf7f0] border border-[#d5ccba] rounded flex items-center justify-between">
              <div className="flex items-center gap-3">
                {filePreview ? (
                  <img src={filePreview} alt="Preview" className="w-12 h-12 object-cover rounded border border-[#d5ccba]" />
                ) : (
                  <div className="w-12 h-12 bg-[#eeeae0] rounded flex items-center justify-center text-[#9d4233]">
                    <FileText className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-[#1a1917] truncate max-w-xs">{file.name}</p>
                  <p className="text-[11px] text-[#8c8477]">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button
                type="button"
                onClick={removeFile}
                className="p-1 hover:bg-[#ebdcd0] rounded text-[#8c3525] transition-colors"
                title="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs uppercase tracking-wider text-[#8c8477] font-semibold mb-1">
            7. Tags / Keywords (Optional)
          </label>
          <input
            type="text"
            maxLength={300}
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g., solitude, nature, memory, acrylic, youth"
            className="w-full px-3 py-2 bg-[#faf7f0] border border-[#d5ccba] rounded text-sm text-[#1a1917] focus:outline-none focus:border-[#9d4233]"
          />
          <p className="text-[11px] text-[#8c8477] mt-1">
            Separate tags with commas (letters, numbers, hyphens only; max 10 tags, 30 chars each).
          </p>
        </div>

        {/* Submit button */}
        <div className="pt-4 border-t border-[#e8e2d2]">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-[#9d4233] hover:bg-[#853528] disabled:opacity-60 text-white font-serif font-bold text-base rounded shadow transition-all duration-200 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Feather className="w-4 h-4 animate-bounce" />
                <span>Transmitting Manuscript to Editorial Board...</span>
              </>
            ) : (
              <>
                <Feather className="w-4 h-4" />
                <span>Submit Manuscript for Review</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
