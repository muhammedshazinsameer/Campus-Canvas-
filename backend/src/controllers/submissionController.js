import prisma from '../config/db.js';
import { uploadMedia } from '../config/cloudinary.js';

/**
 * GET /api/submissions
 * Enforces rule: Non-editors ONLY ever receive approved submissions.
 */
export async function getSubmissions(req, res) {
  try {
    const isEditor = req.user && req.user.role === 'editor';
    const {
      type,
      category,
      tag,
      search,
      sort = 'newest',
      page = 1,
      limit = 30,
      status: requestedStatus
    } = req.query;

    // Strict security filter: non-editors ONLY see approved work
    const where = {};
    if (!isEditor) {
      where.status = 'approved';
    } else if (requestedStatus && requestedStatus !== 'all') {
      where.status = requestedStatus;
    }

    if (type && type !== 'All') {
      where.type = type;
    }

    if (category && category !== 'All') {
      where.category = category;
    }

    if (tag) {
      where.tags = {
        some: {
          tag: {
            name: {
              equals: tag
            }
          }
        }
      };
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q } },
        { authorDisplayName: { contains: q } }
      ];
    }

    // Determine sorting
    let orderBy = { createdAt: 'desc' };
    if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (sort === 'title_asc') {
      orderBy = { title: 'asc' };
    } else if (sort === 'title_desc') {
      orderBy = { title: 'desc' };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 30));
    const skip = (pageNum - 1) * limitNum;

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          tags: {
            include: {
              tag: true
            }
          },
          reviewer: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      prisma.submission.count({ where })
    ]);

    // Flatten tags structure for easier client consumption
    const formattedSubmissions = submissions.map((sub) => ({
      ...sub,
      tags: sub.tags.map((st) => st.tag.name)
    }));

    res.json({
      submissions: formattedSubmissions,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    });
  } catch (error) {
    console.error('getSubmissions error:', error);
    res.status(500).json({ error: 'Failed to retrieve submissions' });
  }
}

/**
 * GET /api/submissions/:id
 * Enforces rule: Non-editors can NEVER view pending or rejected submissions.
 */
export async function getSubmissionById(req, res) {
  try {
    const { id } = req.params;
    const isEditor = req.user && req.user.role === 'editor';

    const submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true
          }
        },
        ...(isEditor ? {
          reports: {
            orderBy: { createdAt: 'desc' },
            select: {
              id: true,
              reason: true,
              details: true,
              reporterEmail: true,
              status: true,
              createdAt: true
            }
          }
        } : {})
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    // Security check: non-editor attempting to access non-approved piece
    if (submission.status !== 'approved' && !isEditor) {
      return res.status(404).json({ error: 'Submission not found or not yet approved for publication' });
    }

    res.json({
      submission: {
        ...submission,
        tags: submission.tags.map((st) => st.tag.name)
      }
    });
  } catch (error) {
    console.error('getSubmissionById error:', error);
    res.status(500).json({ error: 'Failed to retrieve submission details' });
  }
}

/**
 * POST /api/submissions
 * Enforces rule: Created submissions are ALWAYS set to status = 'pending'.
 */
export async function createSubmission(req, res) {
  try {
    const {
      title,
      type,
      category,
      authorDisplayName,
      textContent,
      tags
    } = req.body;

    if (!title || !type || !authorDisplayName) {
      return res.status(400).json({
        error: 'Title, piece type, and author display name are required'
      });
    }

    // Upload file if provided via Multer
    let fileUrl = null;
    let filePublicId = null;
    if (req.file) {
      const uploadResult = await uploadMedia(req.file);
      fileUrl = uploadResult.url;
      filePublicId = uploadResult.publicId;
    }

    // Process tags
    let tagNames = req.body.parsedTags;
    if (!tagNames || !Array.isArray(tagNames)) {
      tagNames = [];
      if (tags) {
        if (Array.isArray(tags)) {
          tagNames = tags;
        } else if (typeof tags === 'string') {
          try {
            const parsed = JSON.parse(tags);
            tagNames = Array.isArray(parsed) ? parsed : [tags];
          } catch {
            tagNames = tags.split(',').map((t) => t.trim()).filter(Boolean);
          }
        }
      }
      tagNames = [...new Set(tagNames.map((t) => t.toLowerCase().trim()).filter(Boolean))];
    }

    // Create or connect tags
    const tagConnectOrCreate = await Promise.all(
      tagNames.map(async (name) => {
        const tagRecord = await prisma.tag.upsert({
          where: { name },
          update: {},
          create: { name }
        });
        return { tagId: tagRecord.id };
      })
    );

    // Strictly enforce: status is ALWAYS pending, no client override possible
    const newSubmission = await prisma.submission.create({
      data: {
        title: title.trim(),
        type: type.trim(),
        category: (category || type).trim(),
        authorDisplayName: authorDisplayName.trim(),
        textContent: textContent ? textContent.trim() : null,
        fileUrl,
        filePublicId,
        status: 'pending', // Strictly enforced server-side
        editorComment: null,
        reviewedAt: null,
        authorId: req.user ? req.user.id : null,
        reviewerId: null,
        tags: {
          create: tagConnectOrCreate.map((tc) => ({
            tag: { connect: { id: tc.tagId } }
          }))
        }
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Submission received successfully. It is now awaiting editorial review.',
      submission: {
        ...newSubmission,
        tags: newSubmission.tags.map((st) => st.tag.name)
      }
    });
  } catch (error) {
    console.error('createSubmission error:', error);
    res.status(500).json({ error: 'Failed to submit creative piece' });
  }
}

/**
 * PATCH /api/submissions/:id/review
 * Enforces rule: Editor-only endpoint to approve or reject submissions with optional editor comment.
 */
export async function reviewSubmission(req, res) {
  try {
    const { id } = req.params;
    const { status, editorComment } = req.body;

    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({
        error: 'Valid status required: "approved", "rejected", or "pending"'
      });
    }

    const existing = await prisma.submission.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    const updated = await prisma.submission.update({
      where: { id },
      data: {
        status,
        editorComment: editorComment !== undefined ? (editorComment ? editorComment.trim() : null) : existing.editorComment,
        reviewedAt: status === 'pending' ? null : new Date(),
        reviewerId: req.user.id
      },
      include: {
        tags: {
          include: {
            tag: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      message: `Submission marked as ${status}`,
      submission: {
        ...updated,
        tags: updated.tags.map((st) => st.tag.name)
      }
    });
  } catch (error) {
    console.error('reviewSubmission error:', error);
    res.status(500).json({ error: 'Failed to review submission' });
  }
}

/**
 * DELETE /api/submissions/:id
 * Editor-only deletion endpoint
 */
export async function deleteSubmission(req, res) {
  try {
    const { id } = req.params;
    await prisma.submission.delete({
      where: { id }
    });
    res.json({ message: 'Submission deleted successfully' });
  } catch (error) {
    console.error('deleteSubmission error:', error);
    res.status(500).json({ error: 'Failed to delete submission' });
  }
}
