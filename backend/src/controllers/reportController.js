import prisma from '../config/db.js';

/**
 * Public/Student endpoint: Create a report against a submission
 * POST /api/submissions/:id/report
 */
export async function createReport(req, res) {
  try {
    const { id: submissionId } = req.params;
    const { reason, details, reporterEmail } = req.body;

    // Verify target submission exists
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      select: { id: true, title: true, status: true }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Creative work not found.' });
    }

    const report = await prisma.report.create({
      data: {
        submissionId: submission.id,
        type: 'submission',
        reason,
        details: details || null,
        reporterEmail: reporterEmail || null,
        status: 'pending'
      },
      select: {
        id: true,
        submissionId: true,
        type: true,
        reason: true,
        status: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: 'Thank you. Your report has been submitted to the editorial team for review.',
      report
    });
  } catch (error) {
    console.error('Error creating submission report:', error);
    res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
}

/**
 * Public/Student endpoint: Submit website issue, bug, or feature suggestion
 * POST /api/reports/general
 */
export async function createGeneralFeedback(req, res) {
  try {
    const { reason, subject, details, reporterEmail } = req.body;

    let reportType = 'feedback';
    if (reason === 'Bug / Functional Issue') reportType = 'website_issue';
    else if (reason === 'Feature Suggestion') reportType = 'suggestion';

    const report = await prisma.report.create({
      data: {
        submissionId: null,
        type: reportType,
        reason,
        subject: subject || null,
        details,
        reporterEmail: reporterEmail || null,
        status: 'pending'
      },
      select: {
        id: true,
        type: true,
        reason: true,
        subject: true,
        status: true,
        createdAt: true
      }
    });

    res.status(201).json({
      message: 'Thank you! Your feedback has been received by the editorial and development team.',
      report
    });
  } catch (error) {
    console.error('Error creating general feedback report:', error);
    res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
}

/**
 * Editor-only endpoint: Retrieve reports for moderation
 * GET /api/reports
 */
export async function getReports(req, res) {
  try {
    const { status = 'pending', type } = req.query;

    const where = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (type && type !== 'all') {
      where.type = type;
    }

    const [
      reports,
      pendingCount,
      resolvedCount,
      dismissedCount,
      submissionPendingCount,
      generalPendingCount,
      totalCount
    ] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          submission: {
            select: {
              id: true,
              title: true,
              type: true,
              category: true,
              authorDisplayName: true,
              textContent: true,
              fileUrl: true,
              status: true,
              createdAt: true,
              author: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          resolvedBy: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.report.count({ where: { status: 'pending' } }),
      prisma.report.count({ where: { status: 'resolved' } }),
      prisma.report.count({ where: { status: 'dismissed' } }),
      prisma.report.count({ where: { type: 'submission', status: 'pending' } }),
      prisma.report.count({ where: { type: { not: 'submission' }, status: 'pending' } }),
      prisma.report.count()
    ]);

    res.json({
      reports,
      counts: {
        pending: pendingCount,
        resolved: resolvedCount,
        dismissed: dismissedCount,
        submissionPending: submissionPendingCount,
        generalPending: generalPendingCount,
        total: totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
}

/**
 * Editor-only endpoint: Update report status (resolve or dismiss)
 * PATCH /api/reports/:id
 */
export async function updateReportStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existingReport = await prisma.report.findUnique({
      where: { id }
    });

    if (!existingReport) {
      return res.status(404).json({ error: 'Report not found.' });
    }

    const updated = await prisma.report.update({
      where: { id },
      data: {
        status,
        resolvedAt: status === 'pending' ? null : new Date(),
        resolvedById: status === 'pending' ? null : req.user?.id || null
      },
      include: {
        submission: {
          select: {
            id: true,
            title: true,
            status: true
          }
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      message: `Report marked as ${status}.`,
      report: updated
    });
  } catch (error) {
    console.error('Error updating report status:', error);
    res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
}

/**
 * Editor-only endpoint: Get moderation summary counts
 * GET /api/reports/stats
 */
export async function getReportStats(req, res) {
  try {
    const pendingCount = await prisma.report.count({
      where: { status: 'pending' }
    });

    res.json({ pendingCount });
  } catch (error) {
    console.error('Error fetching report stats:', error);
    res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
}
