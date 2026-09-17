import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with initial editors and literary submissions...');

  // 1. Create or update the primary editor account
  const editor = await prisma.user.upsert({
    where: { email: 'editor@campuscanvas.org' },
    update: {
      role: 'editor',
      campusId: 'editor'
    },
    create: {
      name: 'Eleanor Vance',
      email: 'editor@campuscanvas.org',
      campusId: 'editor',
      role: 'editor'
    }
  });

  // Also ensure legacy alias works
  await prisma.user.upsert({
    where: { email: 'editor@creativeshowcase.org' },
    update: {
      role: 'editor',
      campusId: 'editor'
    },
    create: {
      name: 'Eleanor Vance (Alias)',
      email: 'editor@creativeshowcase.org',
      campusId: 'editor',
      role: 'editor'
    }
  });

  console.log(`Created editor account: ${editor.email}`);

  // 2. Create sample student account
  const sampleStudent = await prisma.user.upsert({
    where: { email: '13243@yenepoya.edu.in' },
    update: {
      name: 'Shazin Sameer',
      campusId: '13243',
      role: 'student'
    },
    create: {
      name: 'Shazin Sameer',
      email: '13243@yenepoya.edu.in',
      campusId: '13243',
      role: 'student'
    }
  });
  console.log(`Created student account: ${sampleStudent.email}`);

  // Clear existing submissions & tags for a clean slate if needed
  await prisma.submissionTag.deleteMany({});
  await prisma.submission.deleteMany({});
  await prisma.tag.deleteMany({});

  // Helper to create tags
  const getOrCreateTags = async (tagNames) => {
    const records = [];
    for (const name of tagNames) {
      const tag = await prisma.tag.upsert({
        where: { name: name.toLowerCase().trim() },
        update: {},
        create: { name: name.toLowerCase().trim() }
      });
      records.push(tag);
    }
    return records;
  };

  // Seed sample submissions
  const sampleData = [
    {
      title: 'The Solitude of Birch Trees',
      type: 'Poetry',
      category: 'Free Verse',
      authorDisplayName: 'Clara M. Brooks',
      textContent: `The white bark peels in parchment scrolls,
unwritten letters to the frosted ground.
Winter has stripped the timber bare,
yet in the silence between two trunks
a sparrow tests the brittle light.

We walked here once before the snow,
measuring the distance between shadows.
Now the forest is a choir of stillness,
each branch holding its breath,
waiting for the river to unfreeze.`,
      fileUrl: null,
      status: 'approved',
      editorComment: `The juxtaposition of unwritten parchment and brittle winter light creates an unforgettable quietude. Brooks' line breaks in the second stanza demonstrate mature restraint.`,
      reviewedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      reviewerId: editor.id,
      tags: ['poetry', 'nature', 'winter', 'solitude']
    },
    {
      title: 'The Clockmaker of Prague',
      type: 'Fiction',
      category: 'Historical Fiction',
      authorDisplayName: 'Kaelen O\'Connor',
      textContent: `In the narrow attic overlooking Old Town Square, Maestro Tomáš worked by the stutter of a tallow candle. His fingers, knobby and stained with watchmaker's oil, guided tweezers with the gentleness of a saint handling relic bone.

The escapement was made of bronze, tarnished by seventy winters. Inside its teeth lived the lost minutes of Bohemia: thirty seconds stolen from an emperor's coronation, fifteen minutes when a woman waited by Charles Bridge and no one arrived. Tomáš knew that every pendulum did not simply mark time—it consumed it, chewing hours into dust.

"You cannot mend what was broken by war, Uncle," young Marek whispered from the doorway, his boots dusted with fresh street soot.

Tomáš did not look up from the brass gear. "I am not mending the war, boy. I am giving tomorrow a rhythm to dance by."`,
      fileUrl: null,
      status: 'approved',
      editorComment: `A sublime study of memory, craft, and post-war grief. The sensory details—tallow candles, bronze escapements, oil-stained hands—root the story in historical reality while reaching into myth.`,
      reviewedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      reviewerId: editor.id,
      tags: ['fiction', 'historical', 'prague', 'time']
    },
    {
      title: 'On Silence and Second Tongues',
      type: 'Essay',
      category: 'Personal Essay',
      authorDisplayName: 'Min-Jun Park',
      textContent: `My grandmother spoke five languages before she lost her first. In the kitchen in Queens, she would conjugate English verbs with a slight tremor in her vocal cords, like a violist attempting a passage written for cello. 

To grow up between two languages is to inherit an architecture made entirely of doorways. In Korean, there is a word—Jeong (정)—that defies simple translation into Anglo-Saxon vocabulary. It is not love, nor affection, nor loyalty, but the gravitational pull of shared endurance. When I tried to explain this to my seventh-grade English teacher, she struck a red pencil through my margins: "Be more precise."

Precision, I have learned, is often the luxury of those whose worlds have never had to be translated under duress. This essay is an apology to the vowels I swallowed in order to sound like someone who belonged in a suburban hallway.`,
      fileUrl: null,
      status: 'approved',
      editorComment: `Park's exploration of linguistic displacement and the Korean concept of Jeong is piercing and beautifully composed. The phrase 'an architecture made entirely of doorways' resonates long after reading.`,
      reviewedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      reviewerId: editor.id,
      tags: ['essay', 'language', 'identity', 'memoir']
    },
    {
      title: 'Nocturne in Ultramarine',
      type: 'Art',
      category: 'Oil Painting',
      authorDisplayName: 'Sora Tanaka',
      textContent: 'Oil on Belgian linen, 36x48 inches. An inquiry into the temperature of nightfall over industrial docks, contrasting heavy lapis lazuli pigments with warm sodium-vapor glow.',
      fileUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
      status: 'approved',
      editorComment: `The brushwork vibrates with luminous tension. Tanaka captures the industrial harbor with an almost Turner-esque atmospheric depth. Outstanding tonal control.`,
      reviewedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      reviewerId: editor.id,
      tags: ['art', 'painting', 'ultramarine', 'night']
    },
    {
      title: 'Morning at the Wharves',
      type: 'Photography',
      category: 'Street Photography',
      authorDisplayName: 'Julian Reyes',
      textContent: '35mm Tri-X film, pushed to 800 ISO. Captured during the pre-dawn fish auction along the Boston harbor piers. Hand-printed in darkroom.',
      fileUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80',
      status: 'approved',
      editorComment: `The grain of pushed 35mm Tri-X lends authentic grit to this maritime portrait. The framing of vapor and silhouette creates striking chiaroscuro.`,
      reviewedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      reviewerId: editor.id,
      tags: ['photography', 'black-and-white', 'film', 'harbor']
    },
    {
      title: 'Exhibition Poster: Voices of the Rustbelt',
      type: 'Poster',
      category: 'Typography & Print',
      authorDisplayName: 'Maya Lin-Dubois',
      textContent: 'Silkscreen poster design for the regional youth poetry colloquium. Hand-set woodblock type combined with digital vector accents on French paper.',
      fileUrl: 'https://images.unsplash.com/photo-1572945753563-804956783604?auto=format&fit=crop&w=1200&q=80',
      status: 'approved',
      editorComment: `Bold typography that honors midwestern printmaking traditions while maintaining modern balance. The hierarchy guides the eye with precision.`,
      reviewedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      reviewerId: editor.id,
      tags: ['poster', 'graphic-design', 'typography', 'print']
    },
    {
      title: 'The Geography of Forgotten Rooms',
      type: 'Poetry',
      category: 'Prose Poem',
      authorDisplayName: 'Rowan S. Albright',
      textContent: `We left the blue teacup on the radiator. Over four years the glaze developed a spiderweb of micro-fractures, what the Japanese call kintsugi without the gold. In this house, every floorboard remembers the cadence of an argument that never resolved, merely grew tired and wandered out into the rhododendrons. You cannot pack dust into cardboard boxes; you can only carry its scent into the next apartment.`,
      fileUrl: null,
      status: 'approved',
      editorComment: `Compact, haunting, and masterfully paced. Albright finds devastating poetic gravity in small, domestic remnants.`,
      reviewedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      reviewerId: editor.id,
      tags: ['poetry', 'prose-poem', 'memory', 'home']
    },
    // PENDING PIECES (For Editor Review queue in Admin app)
    {
      title: 'Whispers in the Cedar Grove',
      type: 'Poetry',
      category: 'Lyric Poetry',
      authorDisplayName: 'Penelope Ward',
      textContent: `Listen to the cedar needles when the wind changes from east to north.
They are counting the rings beneath their roots.
One for the flood of ninety-three,
one for the drought that turned the well-water brown,
and one for the year we stopped coming to the orchard.`,
      fileUrl: null,
      status: 'pending',
      editorComment: null,
      reviewedAt: null,
      reviewerId: null,
      tags: ['poetry', 'cedar', 'trees', 'roots']
    },
    {
      title: 'The Cartographer\'s Mistake',
      type: 'Fiction',
      category: 'Speculative Fiction',
      authorDisplayName: 'Anonymous High School Senior',
      textContent: `The map of the county showed a lake where no lake had ever existed. For three generations, surveyors assumed it was a printing artifact—a droplet of blue India ink dropped onto copper plates in Edinburgh in 1842.

It wasn't until Sarah walked seven miles past the old grain silo with a compass that spun counter-clockwise that she found the shoreline. The water didn't reflect the sky; it reflected the previous afternoon.`,
      fileUrl: null,
      status: 'pending',
      editorComment: null,
      reviewedAt: null,
      reviewerId: null,
      tags: ['fiction', 'speculative', 'maps', 'mystery']
    },
    {
      title: 'Echoes of a Lost Coastline',
      type: 'Photography',
      category: 'Landscape Photography',
      authorDisplayName: 'Devin Chen',
      textContent: 'High shutter speed capture of breaking waves against basalt sea stacks at Ruby Beach, Olympic National Park during a heavy ocean fog.',
      fileUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
      status: 'pending',
      editorComment: null,
      reviewedAt: null,
      reviewerId: null,
      tags: ['photography', 'ocean', 'coast', 'fog']
    },
    // REJECTED PIECE (To show archive view)
    {
      title: 'Unfinished Draft on Late Homework',
      type: 'Essay',
      category: 'Humor',
      authorDisplayName: 'LazyBard',
      textContent: 'I did not do my homework because the existential weight of algebra crushed my spirit.',
      fileUrl: null,
      status: 'rejected',
      editorComment: 'While playful, this piece is too brief and incomplete for our literary publication standards. We encourage the author to expand on this premise with narrative development.',
      reviewedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      reviewerId: editor.id,
      tags: ['essay', 'draft']
    }
  ];

  for (const item of sampleData) {
    const { tags: tagList, ...subData } = item;
    const tagRecords = await getOrCreateTags(tagList);

    await prisma.submission.create({
      data: {
        ...subData,
        tags: {
          create: tagRecords.map((t) => ({
            tag: { connect: { id: t.id } }
          }))
        }
      }
    });
  }

  console.log('Database seeded successfully with sample submissions and tags!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
