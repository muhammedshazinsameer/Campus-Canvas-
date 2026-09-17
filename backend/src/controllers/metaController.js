import prisma from '../config/db.js';

/**
 * GET /api/meta/categories
 */
export async function getCategories(req, res) {
  try {
    const isEditor = req.user && req.user.role === 'editor';
    const where = isEditor ? {} : { status: 'approved' };

    const submissions = await prisma.submission.findMany({
      where,
      select: { category: true, type: true },
      distinct: ['category']
    });

    const categories = submissions.map((s) => s.category).filter(Boolean);
    res.json({ categories });
  } catch (error) {
    console.error('getCategories error:', error);
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
}

/**
 * GET /api/meta/tags
 */
export async function getTags(req, res) {
  try {
    const tags = await prisma.tag.findMany({
      include: {
        _count: {
          select: { submissions: true }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    const formattedTags = tags.map((t) => ({
      id: t.id,
      name: t.name,
      count: t._count.submissions
    }));

    res.json({ tags: formattedTags });
  } catch (error) {
    console.error('getTags error:', error);
    res.status(500).json({ error: 'Failed to retrieve tags' });
  }
}

/**
 * GET /api/meta/stats
 * Editor-only endpoint for dashboard metrics
 */
export async function getStats(req, res) {
  try {
    const [pending, approved, rejected, total] = await Promise.all([
      prisma.submission.count({ where: { status: 'pending' } }),
      prisma.submission.count({ where: { status: 'approved' } }),
      prisma.submission.count({ where: { status: 'rejected' } }),
      prisma.submission.count()
    ]);

    const byType = await prisma.submission.groupBy({
      by: ['type'],
      _count: { id: true }
    });

    res.json({
      pending,
      approved,
      rejected,
      total,
      byType: byType.map((b) => ({ type: b.type, count: b._count.id }))
    });
  } catch (error) {
    console.error('getStats error:', error);
    res.status(500).json({ error: 'Failed to retrieve stats' });
  }
}
