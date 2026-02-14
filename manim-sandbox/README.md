# Manim Sandbox

A development playground for testing and building Manim animations for the Juliette educational video assistant.

## What's Inside

This sandbox contains:
- **Docker setup** for running Manim without local Python installation
- **3 example scenes** for learning Manim basics
- **5 production templates** for the Juliette animation system
- **Quick test script** for rendering animations

## Prerequisites

- [Docker](https://www.docker.com/get-started) installed and running
- [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop)

## Quick Start

### 1. Build the Docker Image

```bash
cd manim-sandbox
docker-compose build
```

This will download the Manim image and set up the environment (takes a few minutes first time).

### 2. Test with an Example

```bash
# Render a basic shapes example
docker-compose run --rm manim manim -pql examples/01_basic_shapes.py BasicShapes
```

The `-pql` flags mean:
- `-p` = preview after rendering (opens video)
- `-q` = quality level
- `-l` = low quality (faster for testing)

### 3. Use the Quick Test Script

```bash
# Make it executable (first time only)
chmod +x test_render.sh

# List available templates
./test_render.sh

# Render a template
./test_render.sh function_graph

# Render with higher quality
./test_render.sh vector_addition high
```

## Directory Structure

```
manim-sandbox/
├── README.md                    # This file
├── Dockerfile                   # Manim container setup
├── docker-compose.yml           # Docker compose configuration
├── requirements.txt             # Python dependencies
├── test_render.sh              # Quick test script
├── examples/                    # Learning examples
│   ├── 01_basic_shapes.py      # Circles, squares, triangles
│   ├── 02_animations.py        # Fade, rotate, scale
│   └── 03_text_and_formulas.py # Text and LaTeX
├── templates/                   # Production templates
│   ├── function_graph.py       # Plot functions with tangent lines
│   ├── vector_addition.py      # 2D vector visualization
│   ├── probability_tree.py     # Probability tree diagrams
│   ├── calculus_derivative.py  # Derivative visualization
│   └── geometry_diagram.py     # Geometric shapes
├── media/                       # Output directory (created by Manim)
│   └── videos/                 # Rendered MP4 files appear here
└── output/                      # Alternative output mount
```

## Learning Path

### Beginner: Run the Examples

Start with the examples to learn Manim basics:

```bash
# 1. Basic shapes
docker-compose run --rm manim manim -pql examples/01_basic_shapes.py BasicShapes
docker-compose run --rm manim manim -pql examples/01_basic_shapes.py MovingShapes

# 2. Animations
docker-compose run --rm manim manim -pql examples/02_animations.py FadeAnimations
docker-compose run --rm manim manim -pql examples/02_animations.py RotateAndScale

# 3. Text and formulas
docker-compose run --rm manim manim -pql examples/03_text_and_formulas.py MathFormulas
docker-compose run --rm manim manim -pql examples/03_text_and_formulas.py QuadraticFormula
```

### Intermediate: Test the Templates

Try rendering the production templates:

```bash
# Function graphs
./test_render.sh function_graph

# Vector addition
./test_render.sh vector_addition

# Probability tree
./test_render.sh probability_tree

# Calculus derivatives
./test_render.sh calculus_derivative

# Geometry diagrams
./test_render.sh geometry_diagram
```

### Advanced: Modify Templates

1. Open a template file (e.g., `templates/function_graph.py`)
2. Find the example scenes at the bottom
3. Modify the parameters
4. Re-render to see changes

Example modification in `function_graph.py`:

```python
class MyCustomGraph(FunctionGraphScene):
    function_str = "np.sin(x) + 0.5*x"  # Changed function
    x_range = [-5, 5, 0.1]              # Changed range
    tangent_point = 2.0                  # Changed point
    title_text = "My Custom Function"   # Changed title
```

Then render:
```bash
docker-compose run --rm manim manim -pql templates/function_graph.py MyCustomGraph
```

## Common Commands

### Render Quality Options

- `-ql` or `--quality low` - 480p, fast (default for testing)
- `-qm` or `--quality medium` - 720p
- `-qh` or `--quality high` - 1080p
- `-qk` or `--quality 4k` - 2160p (4K)

### Other Useful Flags

- `-p` - Preview video after rendering
- `-s` - Skip rendering and show last frame only
- `-a` - Render all scenes in a file
- `--format=gif` - Output as GIF instead of MP4

### Examples

```bash
# High quality with preview
docker-compose run --rm manim manim -pqh templates/function_graph.py

# Render all scenes in a file
docker-compose run --rm manim manim -pql -a examples/01_basic_shapes.py

# Generate GIF instead of MP4
docker-compose run --rm manim manim -pql --format=gif examples/02_animations.py
```

## Template Reference

### 1. function_graph

**Purpose:** Plot mathematical functions with optional tangent lines

**Parameters:**
- `function_str` - Function expression (e.g., `"x**2"`, `"np.sin(x)"`)
- `x_range` - `[min, max, step]` for x-axis
- `tangent_point` - x-coordinate for tangent line (optional)
- `title_text` - Title of the animation

**Example:**
```python
class MyGraph(FunctionGraphScene):
    function_str = "x**2 - 2*x + 1"
    x_range = [-2, 4, 0.1]
    tangent_point = 1.5
```

### 2. vector_addition

**Purpose:** Visualize 2D vector addition

**Parameters:**
- `vector1` - `[x, y]` components of first vector
- `vector2` - `[x, y]` components of second vector
- `show_components` - Boolean to show component breakdown

**Example:**
```python
class MyVectors(VectorAdditionScene):
    vector1 = [3, 1]
    vector2 = [-1, 2]
    show_components = True
```

### 3. probability_tree

**Purpose:** Draw probability tree diagrams

**Parameters:**
- `level1_labels` - List of first-level outcomes
- `level1_probs` - List of probabilities for level 1
- `level2_labels` - Nested list of second-level outcomes
- `level2_probs` - Nested list of probabilities for level 2
- `title_text` - Title of the diagram

**Example:**
```python
class MyTree(ProbabilityTreeScene):
    level1_labels = ["Pass", "Fail"]
    level1_probs = [0.8, 0.2]
    level2_labels = [["A", "B"], ["Retry", "Drop"]]
    level2_probs = [[0.6, 0.4], [0.5, 0.5]]
```

### 4. calculus_derivative

**Purpose:** Visualize derivatives as rate of change

**Parameters:**
- `function_str` - Function expression
- `point` - Point to show derivative
- `show_tangent` - Boolean to show tangent line
- `show_secant` - Boolean to animate secant lines
- `title_text` - Title of the animation

**Example:**
```python
class MyDerivative(DerivativeScene):
    function_str = "0.5 * x**3 - x"
    point = 2.0
    show_tangent = True
    show_secant = True
```

### 5. geometry_diagram

**Purpose:** Draw geometric shapes with labels

**Parameters:**
- `diagram_type` - Type of diagram: `"right_triangle"`, `"circle"`, `"square"`, `"pentagon"`, `"parallel_lines"`
- `title_text` - Title of the diagram

**Example:**
```python
class MyGeometry(GeometryScene):
    diagram_type = "circle"
    title_text = "Circle Properties"
```

## Troubleshooting

### Docker Issues

**Problem:** "Cannot connect to Docker daemon"
- **Solution:** Make sure Docker Desktop is running

**Problem:** "port is already allocated"
- **Solution:** Another container is using the port. Stop other containers or change the port in `docker-compose.yml`

### Rendering Issues

**Problem:** "Scene not found"
- **Solution:** Make sure the class name matches exactly (case-sensitive)

**Problem:** LaTeX errors
- **Solution:** LaTeX is included in the Manim image. If you see LaTeX errors, check your math syntax in `MathTex()`

**Problem:** Slow rendering
- **Solution:** Use `-ql` for low quality during development. Only use `-qh` or `-qk` for final renders

### File Permissions

**Problem:** "Permission denied" for output files
- **Solution:** The container may create files as root. Fix with:
  ```bash
  sudo chown -R $USER:$USER media/ output/
  ```

## Tips for Development

1. **Start with low quality** - Use `-ql` while developing. It's much faster.

2. **Use preview flag** - The `-p` flag automatically opens the video after rendering, saving you time.

3. **Test incrementally** - Comment out later parts of your `construct()` method to test early animations first.

4. **Use `self.wait()`** - Add pauses between animations so viewers can process what's happening.

5. **Check the output** - Videos are saved in `media/videos/[filename]/[quality]/`

6. **Iterate quickly** - The test script makes it easy to re-render:
   ```bash
   # Edit template
   # Then re-render
   ./test_render.sh function_graph
   ```

## Integration with Juliette

These templates are designed to be called programmatically by the Juliette render worker:

1. **LLM generates parameters** - GPT-4 analyzes the question and selects a template with parameters
2. **Worker creates scene** - The render worker instantiates the template with the parameters
3. **Manim renders** - The scene is rendered to MP4
4. **Upload to storage** - The video is uploaded to Supabase Storage
5. **User sees result** - The animation is shown in response to the question

Example flow:
```
Question: "Show me the derivative of x² at x=2"
↓
LLM: {template: "calculus_derivative", params: {function: "x**2", point: 2}}
↓
Worker: Creates DerivativeScene with params
↓
Manim: Renders animation
↓
Result: MP4 in Supabase Storage
```

## Resources

- [Manim Documentation](https://docs.manim.community/)
- [Manim Examples Gallery](https://docs.manim.community/en/stable/examples.html)
- [3Blue1Brown's Manim](https://github.com/3b1b/manim) - Original inspiration
- [Manim Community Discord](https://www.manim.community/discord)

## Next Steps

Once you're comfortable with the templates:

1. **Customize templates** - Modify existing templates for your specific needs
2. **Create new templates** - Add new animation types
3. **Build the render worker** - Integrate templates with `workers/render-worker.ts`
4. **Test end-to-end** - Connect the full pipeline from question to animation

Happy animating!
