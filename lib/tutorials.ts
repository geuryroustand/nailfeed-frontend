/**
 * Tutorial Data Layer - Mock Implementation
 *
 * This file provides mock data and stub functions for the tutorials feature.
 * Replace these with actual Strapi API calls when the backend is ready.
 */

import type {
  Tutorial,
  TutorialFilters,
  TutorialListResponse,
  TutorialDetailResponse,
  TutorialLevel,
  TutorialTechnique,
  TutorialDuration,
} from "@/types/tutorial"

// Mock data for development
const MOCK_TUTORIALS: Tutorial[] = [
  {
    id: 1,
    documentId: "tutorial-1",
    title: "Classic French Manicure for Beginners",
    slug: "classic-french-manicure-beginners",
    description: "Learn the timeless French manicure technique with step-by-step guidance perfect for beginners.",
    level: "beginner",
    technique: "french",
    duration: 20,
    videoUrl: "https://example.com/video1.mp4",
    likesCount: 245,
    commentsCount: 32,
    savesCount: 189,
    viewsCount: 1250,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      id: 1,
      documentId: "user-1",
      username: "nailartist_pro",
      displayName: "Sarah Johnson",
      isVerified: true,
    },
    thumbnail: {
      id: 1,
      name: "french-manicure-thumb.jpg",
      alternativeText: "Classic French manicure tutorial thumbnail",
      url: "/elegant-french-manicure-white-tips.jpg",
      hash: "thumb1",
      ext: ".jpg",
      mime: "image/jpeg",
      size: 125.5,
      provider: "local",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      width: 600,
      height: 400,
    },
    steps: [
      {
        id: 1,
        stepNumber: 1,
        title: "Prepare Your Nails",
        description: "Clean and shape your nails, push back cuticles, and buff the surface for a smooth base.",
        estimatedDuration: 5,
      },
      {
        id: 2,
        stepNumber: 2,
        title: "Apply Base Coat",
        description: "Apply a thin layer of base coat to protect your natural nails and help polish adhere better.",
        estimatedDuration: 3,
      },
      {
        id: 3,
        stepNumber: 3,
        title: "Paint the Tips",
        description: "Using white polish, carefully paint the tips of your nails in a curved line.",
        estimatedDuration: 8,
      },
      {
        id: 4,
        stepNumber: 4,
        title: "Apply Top Coat",
        description: "Seal your design with a glossy top coat for long-lasting shine and protection.",
        estimatedDuration: 4,
      },
    ],
    materials: [
      { id: 1, name: "Base Coat", brand: "OPI" },
      { id: 2, name: "White Polish", brand: "Essie" },
      { id: 3, name: "Top Coat", brand: "Seche Vite" },
      { id: 4, name: "Nail File" },
      { id: 5, name: "Cuticle Pusher" },
    ],
    tags: [
      { id: 1, documentId: "tag-1", name: "Classic" },
      { id: 2, documentId: "tag-2", name: "Elegant" },
    ],
  },
  {
    id: 2,
    documentId: "tutorial-2",
    title: "Ombre Gel Nails with Sponge Technique",
    slug: "ombre-gel-nails-sponge",
    description: "Create stunning gradient ombre nails using gel polish and a simple sponge technique.",
    level: "intermediate",
    technique: "ombre",
    duration: 35,
    likesCount: 512,
    commentsCount: 67,
    savesCount: 423,
    viewsCount: 2890,
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      id: 2,
      documentId: "user-2",
      username: "gel_goddess",
      displayName: "Emma Chen",
      isVerified: true,
    },
    thumbnail: {
      id: 2,
      name: "ombre-gel-thumb.jpg",
      alternativeText: "Ombre gel nails tutorial thumbnail",
      url: "/pink-purple-ombre-gradient-gel-nails.jpg",
      hash: "thumb2",
      ext: ".jpg",
      mime: "image/jpeg",
      size: 145.2,
      provider: "local",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      width: 600,
      height: 400,
    },
    steps: [
      {
        id: 5,
        stepNumber: 1,
        title: "Prep and Apply Base",
        description: "Prepare nails and apply gel base coat. Cure under UV/LED lamp.",
        estimatedDuration: 8,
      },
      {
        id: 6,
        stepNumber: 2,
        title: "Apply Base Color",
        description: "Apply your lighter gel color as the base. Cure completely.",
        estimatedDuration: 5,
      },
      {
        id: 7,
        stepNumber: 3,
        title: "Create Gradient",
        description: "Use a makeup sponge to dab and blend your second color, creating the ombre effect.",
        estimatedDuration: 15,
      },
      {
        id: 8,
        stepNumber: 4,
        title: "Seal and Finish",
        description: "Apply gel top coat and cure. Clean with alcohol to remove sticky layer.",
        estimatedDuration: 7,
      },
    ],
    materials: [
      { id: 6, name: "Gel Base Coat", brand: "Gelish" },
      { id: 7, name: "Pink Gel Polish", brand: "OPI GelColor" },
      { id: 8, name: "Purple Gel Polish", brand: "OPI GelColor" },
      { id: 9, name: "Gel Top Coat", brand: "Gelish" },
      { id: 10, name: "Makeup Sponge" },
      { id: 11, name: "UV/LED Lamp" },
    ],
    tags: [
      { id: 3, documentId: "tag-3", name: "Gradient" },
      { id: 4, documentId: "tag-4", name: "Colorful" },
    ],
  },
  {
    id: 3,
    documentId: "tutorial-3",
    title: "3D Acrylic Flower Nail Art",
    slug: "3d-acrylic-flower-art",
    description: "Master the art of creating beautiful 3D acrylic flowers for stunning dimensional nail designs.",
    level: "advanced",
    technique: "3d",
    duration: 45,
    likesCount: 892,
    commentsCount: 124,
    savesCount: 756,
    viewsCount: 4320,
    createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    publishedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      id: 3,
      documentId: "user-3",
      username: "acrylic_master",
      displayName: "Maria Rodriguez",
      isVerified: true,
    },
    thumbnail: {
      id: 3,
      name: "3d-flower-thumb.jpg",
      alternativeText: "3D acrylic flower nail art tutorial thumbnail",
      url: "/3d-acrylic-flower-nail-art-pink-roses.jpg",
      hash: "thumb3",
      ext: ".jpg",
      mime: "image/jpeg",
      size: 167.8,
      provider: "local",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      width: 600,
      height: 400,
    },
    steps: [
      {
        id: 9,
        stepNumber: 1,
        title: "Prepare Acrylic Mix",
        description: "Mix your acrylic powder and monomer to the right consistency for sculpting.",
        estimatedDuration: 5,
      },
      {
        id: 10,
        stepNumber: 2,
        title: "Create Flower Petals",
        description: "Using a small brush, sculpt individual petals on a silicone mat or directly on the nail.",
        estimatedDuration: 20,
      },
      {
        id: 11,
        stepNumber: 3,
        title: "Assemble the Flower",
        description: "Carefully arrange and attach petals to form a complete flower shape.",
        estimatedDuration: 12,
      },
      {
        id: 12,
        stepNumber: 4,
        title: "Attach and Seal",
        description: "Secure the 3D flower to your nail and seal with clear acrylic or gel top coat.",
        estimatedDuration: 8,
      },
    ],
    materials: [
      { id: 12, name: "Acrylic Powder (Pink)", brand: "Young Nails" },
      { id: 13, name: "Acrylic Monomer", brand: "Young Nails" },
      { id: 14, name: "Detail Brush Set" },
      { id: 15, name: "Silicone Mat" },
      { id: 16, name: "Nail Glue" },
      { id: 17, name: "Clear Top Coat" },
    ],
    tags: [
      { id: 5, documentId: "tag-5", name: "3D Art" },
      { id: 6, documentId: "tag-6", name: "Flowers" },
    ],
  },
  {
    id: 4,
    documentId: "tutorial-4",
    title: "Stamping Nail Art for Beginners",
    slug: "stamping-nail-art-beginners",
    description: "Learn how to create intricate designs easily using nail stamping plates and tools.",
    level: "beginner",
    technique: "stamping",
    duration: 15,
    likesCount: 367,
    commentsCount: 45,
    savesCount: 298,
    viewsCount: 1876,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      id: 1,
      documentId: "user-1",
      username: "nailartist_pro",
      displayName: "Sarah Johnson",
      isVerified: true,
    },
    thumbnail: {
      id: 4,
      name: "stamping-thumb.jpg",
      alternativeText: "Stamping nail art tutorial thumbnail",
      url: "/nail-stamping-geometric-pattern-black-white.jpg",
      hash: "thumb4",
      ext: ".jpg",
      mime: "image/jpeg",
      size: 132.4,
      provider: "local",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      width: 600,
      height: 400,
    },
    steps: [
      {
        id: 13,
        stepNumber: 1,
        title: "Apply Base Color",
        description: "Paint your nails with your chosen base color and let it dry completely.",
        estimatedDuration: 5,
      },
      {
        id: 14,
        stepNumber: 2,
        title: "Apply Polish to Plate",
        description: "Apply stamping polish to your chosen design on the stamping plate.",
        estimatedDuration: 2,
      },
      {
        id: 15,
        stepNumber: 3,
        title: "Transfer to Stamper",
        description: "Scrape excess polish and quickly press the stamper onto the design.",
        estimatedDuration: 3,
      },
      {
        id: 16,
        stepNumber: 4,
        title: "Stamp onto Nail",
        description: "Roll the stamper onto your nail to transfer the design. Seal with top coat.",
        estimatedDuration: 5,
      },
    ],
    materials: [
      { id: 18, name: "Stamping Plate", brand: "Maniology" },
      { id: 19, name: "Stamping Polish", brand: "Konad" },
      { id: 20, name: "Stamper and Scraper", brand: "Maniology" },
      { id: 21, name: "Base Color Polish" },
      { id: 22, name: "Top Coat" },
    ],
    tags: [
      { id: 7, documentId: "tag-7", name: "Quick" },
      { id: 8, documentId: "tag-8", name: "Patterns" },
    ],
  },
  {
    id: 5,
    documentId: "tutorial-5",
    title: "Hand-Painted Floral Design",
    slug: "hand-painted-floral-design",
    description: "Create delicate hand-painted flowers using fine brushes and acrylic paint.",
    level: "intermediate",
    technique: "hand-painted",
    duration: 28,
    likesCount: 634,
    commentsCount: 89,
    savesCount: 521,
    viewsCount: 3245,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    publishedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      id: 4,
      documentId: "user-4",
      username: "paint_perfectionist",
      displayName: "Lisa Kim",
      isVerified: false,
    },
    thumbnail: {
      id: 5,
      name: "floral-thumb.jpg",
      alternativeText: "Hand-painted floral nail art tutorial thumbnail",
      url: "/hand-painted-floral-nail-art-delicate-flowers.jpg",
      hash: "thumb5",
      ext: ".jpg",
      mime: "image/jpeg",
      size: 154.6,
      provider: "local",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      width: 600,
      height: 400,
    },
    steps: [
      {
        id: 17,
        stepNumber: 1,
        title: "Prepare Base",
        description: "Apply base coat and your chosen background color. Let dry completely.",
        estimatedDuration: 7,
      },
      {
        id: 18,
        stepNumber: 2,
        title: "Sketch Design",
        description: "Lightly sketch your floral design with a fine liner brush.",
        estimatedDuration: 5,
      },
      {
        id: 19,
        stepNumber: 3,
        title: "Paint Flowers",
        description: "Using thin acrylic paint, carefully paint each flower petal with a detail brush.",
        estimatedDuration: 12,
      },
      {
        id: 20,
        stepNumber: 4,
        title: "Add Details and Seal",
        description: "Add centers, leaves, and fine details. Seal with top coat when dry.",
        estimatedDuration: 4,
      },
    ],
    materials: [
      { id: 23, name: "Acrylic Paint Set" },
      { id: 24, name: "Detail Brush (Size 0)", brand: "Winstonia" },
      { id: 25, name: "Liner Brush", brand: "Winstonia" },
      { id: 26, name: "Base and Top Coat" },
      { id: 27, name: "Background Polish Color" },
    ],
    tags: [
      { id: 9, documentId: "tag-9", name: "Artistic" },
      { id: 10, documentId: "tag-10", name: "Floral" },
    ],
  },
  {
    id: 6,
    documentId: "tutorial-6",
    title: "Chrome Mirror Nails",
    slug: "chrome-mirror-nails",
    duration: 25,
    description: "Achieve a stunning mirror-like chrome finish on your nails with powder application.",
    level: "intermediate",
    technique: "chrome",
    likesCount: 723,
    commentsCount: 98,
    savesCount: 612,
    viewsCount: 3890,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    user: {
      id: 2,
      documentId: "user-2",
      username: "gel_goddess",
      displayName: "Emma Chen",
      isVerified: true,
    },
    thumbnail: {
      id: 6,
      name: "chrome-thumb.jpg",
      alternativeText: "Chrome mirror nails tutorial thumbnail",
      url: "/chrome-mirror-silver-metallic-nails.jpg",
      hash: "thumb6",
      ext: ".jpg",
      mime: "image/jpeg",
      size: 141.2,
      provider: "local",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      width: 600,
      height: 400,
    },
    steps: [
      {
        id: 21,
        stepNumber: 1,
        title: "Apply Gel Base",
        description: "Apply gel base coat and black gel polish. Cure under lamp.",
        estimatedDuration: 8,
      },
      {
        id: 22,
        stepNumber: 2,
        title: "Apply No-Wipe Top Coat",
        description: "Apply a no-wipe gel top coat and cure. This creates the perfect surface for chrome.",
        estimatedDuration: 5,
      },
      {
        id: 23,
        stepNumber: 3,
        title: "Apply Chrome Powder",
        description: "Using an applicator, rub chrome powder onto the nail until you achieve a mirror finish.",
        estimatedDuration: 8,
      },
      {
        id: 24,
        stepNumber: 4,
        title: "Seal the Chrome",
        description: "Carefully apply gel top coat to seal the chrome. Cure and you're done!",
        estimatedDuration: 4,
      },
    ],
    materials: [
      { id: 28, name: "Gel Base Coat" },
      { id: 29, name: "Black Gel Polish" },
      { id: 30, name: "No-Wipe Top Coat", brand: "Beetles" },
      { id: 31, name: "Chrome Powder", brand: "Born Pretty" },
      { id: 32, name: "Chrome Applicator" },
      { id: 33, name: "UV/LED Lamp" },
    ],
    tags: [
      { id: 11, documentId: "tag-11", name: "Metallic" },
      { id: 12, documentId: "tag-12", name: "Modern" },
    ],
  },
]

/**
 * Get duration category from minutes
 */
function getDurationCategory(minutes: number): TutorialDuration {
  if (minutes < 15) return "short"
  if (minutes <= 30) return "medium"
  return "long"
}

/**
 * Filter tutorials based on criteria
 */
function filterTutorials(tutorials: Tutorial[], filters: TutorialFilters): Tutorial[] {
  let filtered = [...tutorials]

  // Search query
  if (filters.q) {
    const query = filters.q.toLowerCase()
    filtered = filtered.filter(
      (t) =>
        t.title.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some((tag) => tag.name.toLowerCase().includes(query)),
    )
  }

  // Level filter
  if (filters.level) {
    filtered = filtered.filter((t) => t.level === filters.level)
  }

  // Technique filter
  if (filters.technique) {
    filtered = filtered.filter((t) => t.technique === filters.technique)
  }

  // Duration filter
  if (filters.duration) {
    filtered = filtered.filter((t) => getDurationCategory(t.duration) === filters.duration)
  }

  return filtered
}

/**
 * Get paginated tutorials list with filters
 *
 * @param filters - Filter criteria
 * @param page - Page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Promise with tutorial list and pagination metadata
 */
export async function listTutorials(
  filters: TutorialFilters = {},
  page = 1,
  pageSize = 12,
): Promise<TutorialListResponse> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  const filtered = filterTutorials(MOCK_TUTORIALS, filters)
  const total = filtered.length
  const pageCount = Math.ceil(total / pageSize)
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const data = filtered.slice(start, end)

  return {
    data,
    meta: {
      pagination: {
        page,
        pageSize,
        pageCount,
        total,
      },
    },
  }
}

/**
 * Get a single tutorial by slug
 *
 * @param slug - Tutorial slug
 * @returns Promise with tutorial detail
 */
export async function getTutorialBySlug(slug: string): Promise<TutorialDetailResponse | null> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 200))

  const tutorial = MOCK_TUTORIALS.find((t) => t.slug === slug)

  if (!tutorial) {
    return null
  }

  return {
    data: tutorial,
  }
}

/**
 * Get list of available techniques
 *
 * @returns Promise with technique list
 */
export async function listTechniques(): Promise<TutorialTechnique[]> {
  return ["acrylic", "gel", "stamping", "hand-painted", "ombre", "3d", "french", "marble", "chrome", "other"]
}

/**
 * Get list of available levels
 *
 * @returns Promise with level list
 */
export async function listLevels(): Promise<TutorialLevel[]> {
  return ["beginner", "intermediate", "advanced"]
}

/**
 * Get list of duration options
 *
 * @returns Promise with duration list
 */
export async function listDurations(): Promise<{ value: TutorialDuration; label: string }[]> {
  return [
    { value: "short", label: "Under 15 min" },
    { value: "medium", label: "15-30 min" },
    { value: "long", label: "30+ min" },
  ]
}
