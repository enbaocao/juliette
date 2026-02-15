#!/bin/bash
# Pre-render Animation Library
# Renders all core educational animations for instant serving
# Quality: -qm (720p) for good balance of quality and file size
# Est time: 30-60 minutes for all animations

set -e  # Exit on error

cd "$(dirname "$0")/../manim-sandbox"

echo "🎬 Starting Animation Library Pre-rendering"
echo "Quality: 720p (-qm)"
echo "Output: pre-rendered/"
echo ""

# Create output directory
mkdir -p pre-rendered

# Animation list with file, scene, and output name
animations=(
  # Linear Regression (3 animations)
  "examples/linear_regression.py:LinearRegression:linear_regression_basic"
  "examples/linear_regression.py:LinearRegressionInteractive:linear_regression_interactive"

  # OLS Method (3 animations)
  "examples/ols_method.py:OLSMethod:ols_method_main"
  "examples/ols_method.py:OLSMatrix:ols_method_matrix"
  "examples/ols_visual.py:OLSVisual:ols_visual_main"
  "examples/ols_visual.py:OLSAnimation:ols_visual_animated"

  # Attention Mechanism (2 animations)
  "examples/attention_mechanism.py:AttentionMechanism:attention_mechanism_main"
  "examples/attention_mechanism.py:SelfAttentionVisual:attention_self_attention"

  # Matrix Multiplication (2 animations)
  "examples/matmul_v2.py:MatMulV2:matrix_multiplication_visual"
  "examples/matmul_v2.py:MatMulVisual:matrix_multiplication_simple"

  # Bayes Theorem (2 animations)
  "examples/bayes_theorem_fixed.py:BayesTheoremFixed:bayes_theorem_main"
  "examples/bayes_theorem_fixed.py:SpatialLayoutDemo:bayes_spatial_layout"

  # Counting Problems (2 animations)
  "examples/counting_problems.py:CountingProblems:counting_problems_main"
  "examples/counting_problems.py:VisualCounting:counting_visual_combinations"

  # Binary Search (1 animation)
  "examples/binary_search_v2.py:BinarySearchV2:binary_search_demo"

  # Vector Projection (1 animation)
  "examples/vector_proj_3d.py:Projection3D:vector_projection_3d"
)

total=${#animations[@]}
current=0

for anim in "${animations[@]}"; do
  current=$((current + 1))

  # Parse animation spec
  IFS=':' read -r file scene output <<< "$anim"

  echo "[$current/$total] Rendering: $output"
  echo "  File: $file"
  echo "  Scene: $scene"

  # Render with medium quality
  docker-compose run --rm manim manim -qm --disable_caching "$file" "$scene" 2>&1 | tail -3

  # Find the rendered file
  # Manim outputs to media/videos/[filename]/720p30/[SceneName].mp4
  filename=$(basename "$file" .py)
  source_file=$(find "media/videos/$filename/720p30" -name "${scene}.mp4" 2>/dev/null | head -1)

  if [ -f "$source_file" ]; then
    # Copy to pre-rendered with friendly name
    cp "$source_file" "pre-rendered/${output}.mp4"

    # Get file size
    size=$(du -h "pre-rendered/${output}.mp4" | cut -f1)
    echo "  ✓ Saved: pre-rendered/${output}.mp4 ($size)"
  else
    echo "  ✗ Failed to find output file"
  fi

  echo ""
done

echo "🎉 Pre-rendering complete!"
echo ""
echo "Summary:"
ls -lh pre-rendered/*.mp4 | awk '{print "  " $9 " - " $5}'
echo ""
echo "Total files: $(ls pre-rendered/*.mp4 | wc -l)"
echo "Total size: $(du -sh pre-rendered | cut -f1)"
echo ""
echo "Next step: Run 'node scripts/upload-animations.ts' to upload to Supabase"
