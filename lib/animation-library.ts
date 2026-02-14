/**
 * Animation Library
 * Index of pre-rendered animations for instant serving
 */

export interface AnimationEntry {
  filename: string;
  title: string;
  description: string;
  topics: string[];  // Keywords for matching
  duration?: number; // seconds
}

export interface AnimationLibrary {
  [category: string]: {
    [variation: string]: AnimationEntry;
  };
}

/**
 * Pre-rendered animation library
 * All animations are stored in Supabase Storage bucket: 'animations'
 */
export const ANIMATION_LIBRARY: AnimationLibrary = {
  // Linear Regression
  linear_regression: {
    basic: {
      filename: 'linear_regression_basic.mp4',
      title: 'Linear Regression Basics',
      description: 'Shows data points, residuals, best fit line, and sum of squared errors',
      topics: ['linear regression', 'least squares', 'best fit', 'line fitting', 'regression'],
    },
    interactive: {
      filename: 'linear_regression_interactive.mp4',
      title: 'Linear Regression - Interactive',
      description: 'Shows how changing slope and intercept affects the fit',
      topics: ['linear regression', 'slope', 'intercept', 'parameters', 'y=mx+b'],
    },
  },

  // Ordinary Least Squares
  ols: {
    main: {
      filename: 'ols_method_main.mp4',
      title: 'OLS Method - Mathematical',
      description: 'Step-by-step mathematical derivation of OLS with example calculation',
      topics: ['ols', 'ordinary least squares', 'formula', 'derivation', 'math'],
    },
    matrix: {
      filename: 'ols_method_matrix.mp4',
      title: 'OLS - Matrix Form',
      description: 'Shows matrix formulation and normal equation',
      topics: ['ols', 'matrix', 'normal equation', 'linear algebra'],
    },
    visual: {
      filename: 'ols_visual_main.mp4',
      title: 'OLS - Visual Explanation',
      description: 'Visual geometric interpretation with means and deviations',
      topics: ['ols', 'visual', 'geometric', 'covariance', 'deviation'],
    },
    animated: {
      filename: 'ols_visual_animated.mp4',
      title: 'OLS - Animated Optimization',
      description: 'Shows line moving to minimize error with live error counter',
      topics: ['ols', 'optimization', 'minimization', 'gradient descent', 'error'],
    },
  },

  // Attention Mechanism
  attention: {
    main: {
      filename: 'attention_mechanism_main.mp4',
      title: 'Attention Mechanism',
      description: 'Explains Query, Key, Value and attention computation',
      topics: ['attention', 'transformer', 'query', 'key', 'value', 'QKV', 'neural network'],
    },
    self_attention: {
      filename: 'attention_self_attention.mp4',
      title: 'Self-Attention Visual',
      description: 'Shows attention matrix for sentence with word connections',
      topics: ['self-attention', 'attention matrix', 'sentence', 'words', 'connections'],
    },
  },

  // Matrix Multiplication
  matrix_multiplication: {
    visual: {
      filename: 'matrix_multiplication_visual.mp4',
      title: 'Matrix Multiplication - Visual',
      description: 'Shows row×column with visual dot product',
      topics: ['matrix multiplication', 'matrices', 'dot product', 'linear algebra'],
    },
    simple: {
      filename: 'matrix_multiplication_simple.mp4',
      title: 'Matrix Multiplication - Simple Example',
      description: '1×2 matrix times 2×1 matrix with step-by-step calculation',
      topics: ['matrix multiplication', 'simple', 'example', 'calculation'],
    },
  },

  // Bayes Theorem
  bayes: {
    main: {
      filename: 'bayes_theorem_main.mp4',
      title: "Bayes' Theorem",
      description: 'Medical test example showing base rate importance',
      topics: ['bayes', 'theorem', 'probability', 'conditional', 'base rate'],
    },
    spatial: {
      filename: 'bayes_spatial_layout.mp4',
      title: 'Spatial Layout Demo',
      description: 'Demonstrates proper spatial layout techniques',
      topics: ['spatial', 'layout', 'visualization', 'design'],
    },
  },

  // Counting Problems
  counting: {
    main: {
      filename: 'counting_problems_main.mp4',
      title: 'Permutations vs Combinations',
      description: 'Shows difference between order mattering and not mattering',
      topics: ['permutations', 'combinations', 'counting', 'probability', 'factorial'],
    },
    visual: {
      filename: 'counting_visual_combinations.mp4',
      title: 'Visual Combinations',
      description: 'Shows all combinations visually with actual groups',
      topics: ['combinations', 'visual', 'counting', 'groups'],
    },
  },

  // Binary Search
  binary_search: {
    demo: {
      filename: 'binary_search_demo.mp4',
      title: 'Binary Search Algorithm',
      description: 'Step-by-step binary search with array visualization',
      topics: ['binary search', 'algorithm', 'searching', 'divide and conquer', 'log n'],
    },
  },

  // Vector Projection
  vector: {
    projection_3d: {
      filename: 'vector_projection_3d.mp4',
      title: 'Vector Projection onto Plane',
      description: '3D visualization of vector projection with decomposition',
      topics: ['vector', 'projection', '3d', 'plane', 'linear algebra', 'decomposition'],
    },
  },
};

/**
 * Get all animations as a flat list
 */
export function getAllAnimations(): Array<AnimationEntry & { category: string; variation: string }> {
  const result: Array<AnimationEntry & { category: string; variation: string }> = [];

  for (const [category, variations] of Object.entries(ANIMATION_LIBRARY)) {
    for (const [variation, entry] of Object.entries(variations)) {
      result.push({ ...entry, category, variation });
    }
  }

  return result;
}

/**
 * Find closest animation based on topic keywords
 * Returns { category, variation, entry } or null
 */
export function findClosestAnimation(
  query: string
): { category: string; variation: string; entry: AnimationEntry } | null {
  const queryLower = query.toLowerCase();
  const allAnimations = getAllAnimations();

  // Score each animation by keyword matches
  const scored = allAnimations.map((anim) => {
    let score = 0;

    // Check title match
    if (anim.title.toLowerCase().includes(queryLower)) {
      score += 10;
    }

    // Check description match
    if (anim.description.toLowerCase().includes(queryLower)) {
      score += 5;
    }

    // Check topic matches
    for (const topic of anim.topics) {
      if (queryLower.includes(topic) || topic.includes(queryLower)) {
        score += 3;
      }
    }

    return { ...anim, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Return best match if score > 0
  if (scored[0] && scored[0].score > 0) {
    const best = scored[0];
    return {
      category: best.category,
      variation: best.variation,
      entry: {
        filename: best.filename,
        title: best.title,
        description: best.description,
        topics: best.topics,
        duration: best.duration,
      },
    };
  }

  return null;
}

/**
 * Get animation URL from Supabase Storage
 */
export function getAnimationUrl(supabaseUrl: string, filename: string): string {
  return `${supabaseUrl}/storage/v1/object/public/animations/${filename}`;
}

/**
 * Search animations by multiple keywords
 */
export function searchAnimations(keywords: string[]): AnimationEntry[] {
  const allAnimations = getAllAnimations();
  const keywordsLower = keywords.map((k) => k.toLowerCase());

  return allAnimations
    .filter((anim) => {
      // Animation must match at least one keyword
      return keywordsLower.some(
        (keyword) =>
          anim.title.toLowerCase().includes(keyword) ||
          anim.description.toLowerCase().includes(keyword) ||
          anim.topics.some((topic) => topic.includes(keyword))
      );
    })
    .map((anim) => ({
      filename: anim.filename,
      title: anim.title,
      description: anim.description,
      topics: anim.topics,
      duration: anim.duration,
    }));
}
