/**
 * Campus Canvas - Server-Side Request Validation Middleware
 * Enforces strict length limits, required fields, character whitelists,
 * and format constraints across all API endpoints.
 */

const ALLOWED_TYPES = ['Poetry', 'Fiction', 'Essay', 'Art', 'Photography', 'Poster'];
const VISUAL_TYPES = ['Art', 'Photography', 'Poster'];
const ALLOWED_STATUSES = ['approved', 'rejected', 'pending'];
const ALLOWED_SORTS = ['newest', 'oldest', 'title_asc', 'title_desc'];

/**
 * Strips ASCII control characters (0-31) except newline, carriage return, and tab
 */
export function sanitizeString(val) {
  if (typeof val !== 'string') return '';
  return val.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Validate submission creation (POST /api/submissions)
 */
export function validateCreateSubmission(req, res, next) {
  const errors = [];

  let { title, type, category, authorDisplayName, textContent, tags } = req.body;

  // 1. Title validation
  if (!title || typeof title !== 'string' || !title.trim()) {
    errors.push('Submission title is required.');
  } else {
    const trimmedTitle = title.trim();
    if (trimmedTitle.length < 2) {
      errors.push('Title must be at least 2 characters long.');
    } else if (trimmedTitle.length > 150) {
      errors.push('Title cannot exceed 150 characters.');
    }
    req.body.title = sanitizeString(trimmedTitle);
  }

  // 2. Type validation
  if (!type || typeof type !== 'string' || !ALLOWED_TYPES.includes(type.trim())) {
    errors.push(`Piece type must be one of: ${ALLOWED_TYPES.join(', ')}.`);
  } else {
    req.body.type = type.trim();
  }

  // 3. Category validation (defaults to type if omitted)
  if (category && typeof category === 'string') {
    const trimmedCategory = category.trim();
    if (trimmedCategory.length > 50) {
      errors.push('Category cannot exceed 50 characters.');
    } else {
      req.body.category = sanitizeString(trimmedCategory);
    }
  } else {
    req.body.category = req.body.type;
  }

  // 4. Author display name validation
  if (!authorDisplayName || typeof authorDisplayName !== 'string' || !authorDisplayName.trim()) {
    errors.push('Author display name is required.');
  } else {
    const trimmedAuthor = authorDisplayName.trim();
    if (trimmedAuthor.length < 2) {
      errors.push('Author display name must be at least 2 characters long.');
    } else if (trimmedAuthor.length > 80) {
      errors.push('Author display name cannot exceed 80 characters.');
    }
    req.body.authorDisplayName = sanitizeString(trimmedAuthor);
  }

  // 5. Text content validation
  const isVisual = VISUAL_TYPES.includes(req.body.type);
  const hasFile = Boolean(req.file);

  if (textContent && typeof textContent === 'string') {
    const trimmedContent = textContent.trim();
    if (trimmedContent.length > 50000) {
      errors.push('Text content exceeds maximum limit of 50,000 characters.');
    }
    req.body.textContent = sanitizeString(trimmedContent);
  } else {
    req.body.textContent = null;
  }

  // Require manuscript text for literary works if no document file is attached
  if (!isVisual && !hasFile && (!req.body.textContent || req.body.textContent.length === 0)) {
    errors.push('Manuscript text is required for literary works when no document file is uploaded.');
  }

  // Require either file or text content for visual works
  if (isVisual && !hasFile && (!req.body.textContent || req.body.textContent.length === 0)) {
    errors.push('Please upload an image/document file or provide descriptive text for artwork.');
  }

  // 6. Tags validation
  let parsedTags = [];
  if (tags) {
    if (Array.isArray(tags)) {
      parsedTags = tags;
    } else if (typeof tags === 'string') {
      try {
        const parsed = JSON.parse(tags);
        parsedTags = Array.isArray(parsed) ? parsed : [tags];
      } catch {
        parsedTags = tags.split(',').map((t) => t.trim()).filter(Boolean);
      }
    }

    if (parsedTags.length > 10) {
      errors.push('Maximum 10 tags allowed per piece.');
    }

    const cleanedTags = [];
    const tagRegex = /^[a-zA-Z0-9\s\-]+$/;

    for (const rawTag of parsedTags) {
      if (typeof rawTag !== 'string') continue;
      const tagStr = sanitizeString(rawTag).toLowerCase().trim();
      if (!tagStr) continue;

      if (tagStr.length < 2) {
        errors.push(`Tag "${tagStr}" is too short (min 2 characters).`);
      } else if (tagStr.length > 30) {
        errors.push(`Tag "${tagStr}" is too long (max 30 characters).`);
      } else if (!tagRegex.test(tagStr)) {
        errors.push(`Tag "${tagStr}" contains invalid characters. Use letters, numbers, and hyphens only.`);
      } else {
        cleanedTags.push(tagStr);
      }
    }

    req.body.parsedTags = [...new Set(cleanedTags)];
  } else {
    req.body.parsedTags = [];
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: errors[0],
      errors
    });
  }

  next();
}

/**
 * Validate review action (PATCH /api/submissions/:id/review)
 */
export function validateReviewSubmission(req, res, next) {
  const { status, editorComment } = req.body;

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Valid review status required: ${ALLOWED_STATUSES.join(', ')}.`
    });
  }

  if (editorComment !== undefined && editorComment !== null) {
    if (typeof editorComment !== 'string') {
      return res.status(400).json({ error: 'Editor comment must be a string.' });
    }
    const trimmedComment = sanitizeString(editorComment.trim());
    if (trimmedComment.length > 2000) {
      return res.status(400).json({
        error: 'Editor comment cannot exceed 2,000 characters.'
      });
    }
    req.body.editorComment = trimmedComment;
  }

  next();
}

/**
 * Validate query parameters for listing submissions (GET /api/submissions)
 */
export function validateGetSubmissions(req, res, next) {
  const { type, category, tag, search, sort, page, limit } = req.query;

  if (type && type !== 'All' && !ALLOWED_TYPES.includes(type)) {
    return res.status(400).json({
      error: `Invalid type filter. Allowed types: ${ALLOWED_TYPES.join(', ')}.`
    });
  }

  if (category && typeof category === 'string' && category.length > 50) {
    return res.status(400).json({ error: 'Category query parameter exceeds 50 characters.' });
  }

  if (tag && typeof tag === 'string' && tag.length > 30) {
    return res.status(400).json({ error: 'Tag query parameter exceeds 30 characters.' });
  }

  if (search && typeof search === 'string') {
    if (search.length > 100) {
      return res.status(400).json({ error: 'Search query cannot exceed 100 characters.' });
    }
    req.query.search = sanitizeString(search.trim());
  }

  if (sort && !ALLOWED_SORTS.includes(sort)) {
    return res.status(400).json({
      error: `Invalid sort parameter. Allowed values: ${ALLOWED_SORTS.join(', ')}.`
    });
  }

  if (page) {
    const parsedPage = parseInt(page, 10);
    if (isNaN(parsedPage) || parsedPage < 1 || parsedPage > 10000) {
      return res.status(400).json({ error: 'Page must be a positive integer between 1 and 10000.' });
    }
  }

  if (limit) {
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({ error: 'Limit must be an integer between 1 and 100.' });
    }
  }

  next();
}

/**
 * Validate Google user profile synchronization (POST /api/auth/google)
 */
export function validateGoogleSync(req, res, next) {
  const { email, name, avatarUrl, id } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Google account email is required.' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@yenepoya\.edu\.in$/i;

  if (!emailRegex.test(normalizedEmail)) {
    return res.status(403).json({
      error: 'Please sign in with your Yenepoya college email (@yenepoya.edu.in).'
    });
  }

  if (name && typeof name === 'string') {
    if (name.length > 100) {
      return res.status(400).json({ error: 'Name cannot exceed 100 characters.' });
    }
    req.body.name = sanitizeString(name.trim());
  }

  if (avatarUrl && typeof avatarUrl === 'string') {
    if (avatarUrl.length > 500) {
      return res.status(400).json({ error: 'Avatar URL exceeds maximum length of 500 characters.' });
    }
    if (!avatarUrl.startsWith('https://') && !avatarUrl.startsWith('http://')) {
      return res.status(400).json({ error: 'Avatar URL must start with http:// or https://.' });
    }
  }

  if (id && typeof id === 'string' && id.length > 64) {
    return res.status(400).json({ error: 'Invalid user ID format.' });
  }

  req.body.email = normalizedEmail;
  next();
}

export const ALLOWED_REPORT_REASONS = [
  'Inappropriate Content',
  'Copyright / Plagiarism',
  'Privacy / Personal Info',
  'Harassment',
  'Other'
];

export const ALLOWED_FEEDBACK_REASONS = [
  'Bug / Functional Issue',
  'Feature Suggestion',
  'General Feedback',
  'Content / Editorial Query',
  'Other'
];

/**
 * Validate submission report creation (POST /api/submissions/:id/report)
 */
export function validateCreateReport(req, res, next) {
  const { reason, details, reporterEmail } = req.body;
  const errors = [];

  // 1. Reason validation
  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    errors.push('A reason for reporting this submission is required.');
  } else {
    const trimmedReason = reason.trim();
    if (!ALLOWED_REPORT_REASONS.includes(trimmedReason)) {
      errors.push(`Report reason must be one of: ${ALLOWED_REPORT_REASONS.join(', ')}.`);
    } else {
      req.body.reason = trimmedReason;
    }
  }

  // 2. Details validation (optional, max 1000 chars)
  if (details !== undefined && details !== null) {
    if (typeof details !== 'string') {
      errors.push('Report details must be a text string.');
    } else {
      const trimmedDetails = details.trim();
      if (trimmedDetails.length > 1000) {
        errors.push('Report details cannot exceed 1,000 characters.');
      } else {
        req.body.details = sanitizeString(trimmedDetails);
      }
    }
  } else {
    req.body.details = null;
  }

  // 3. Reporter email validation (optional)
  if (reporterEmail !== undefined && reporterEmail !== null && String(reporterEmail).trim()) {
    const trimmedEmail = String(reporterEmail).trim().toLowerCase();
    const generalEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (trimmedEmail.length > 100) {
      errors.push('Reporter email cannot exceed 100 characters.');
    } else if (!generalEmailRegex.test(trimmedEmail)) {
      errors.push('Please enter a valid contact email address.');
    } else {
      req.body.reporterEmail = sanitizeString(trimmedEmail);
    }
  } else {
    req.body.reporterEmail = null;
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], errors });
  }

  next();
}

/**
 * Validate general website issue / suggestion / feedback (POST /api/reports/general)
 */
export function validateCreateGeneralFeedback(req, res, next) {
  const { reason, subject, details, reporterEmail } = req.body;
  const errors = [];

  // 1. Reason validation
  if (!reason || typeof reason !== 'string' || !reason.trim()) {
    errors.push('Please select a category for your report or suggestion.');
  } else {
    const trimmedReason = reason.trim();
    if (!ALLOWED_FEEDBACK_REASONS.includes(trimmedReason)) {
      errors.push(`Category must be one of: ${ALLOWED_FEEDBACK_REASONS.join(', ')}.`);
    } else {
      req.body.reason = trimmedReason;
    }
  }

  // 2. Subject validation (optional, max 150 chars)
  if (subject && typeof subject === 'string') {
    const trimmedSubject = subject.trim();
    if (trimmedSubject.length > 150) {
      errors.push('Subject cannot exceed 150 characters.');
    } else {
      req.body.subject = sanitizeString(trimmedSubject);
    }
  } else {
    req.body.subject = null;
  }

  // 3. Details validation (required, max 2000 chars)
  if (!details || typeof details !== 'string' || !details.trim()) {
    errors.push('Please provide a description of the issue or your suggestion.');
  } else {
    const trimmedDetails = details.trim();
    if (trimmedDetails.length < 5) {
      errors.push('Please provide a bit more detail (at least 5 characters).');
    } else if (trimmedDetails.length > 2000) {
      errors.push('Feedback details cannot exceed 2,000 characters.');
    } else {
      req.body.details = sanitizeString(trimmedDetails);
    }
  }

  // 4. Reporter email validation (optional)
  if (reporterEmail !== undefined && reporterEmail !== null && String(reporterEmail).trim()) {
    const trimmedEmail = String(reporterEmail).trim().toLowerCase();
    const generalEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (trimmedEmail.length > 100) {
      errors.push('Contact email cannot exceed 100 characters.');
    } else if (!generalEmailRegex.test(trimmedEmail)) {
      errors.push('Please enter a valid contact email address.');
    } else {
      req.body.reporterEmail = sanitizeString(trimmedEmail);
    }
  } else {
    req.body.reporterEmail = null;
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors[0], errors });
  }

  next();
}

/**
 * Validate report status update (PATCH /api/reports/:id)
 */
export function validateUpdateReport(req, res, next) {
  const { status } = req.body;
  const ALLOWED_REPORT_STATUSES = ['resolved', 'dismissed', 'pending'];

  if (!status || typeof status !== 'string' || !ALLOWED_REPORT_STATUSES.includes(status.trim())) {
    return res.status(400).json({
      error: `Report status must be one of: ${ALLOWED_REPORT_STATUSES.join(', ')}.`
    });
  }

  req.body.status = status.trim();
  next();
}

