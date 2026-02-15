# Manim Animation Templates

## Overview

The animation API now references templates from `manim-sandbox/examples/` to generate simpler, more visual animations focused on **drawn elements** rather than complex code.

---

## Template Philosophy

### ✅ DO:
- Use **basic shapes**: Circle, Square, Triangle, Dot, Line, Arrow
- Use **simple Text** for labels
- Use **MathTex** only for actual formulas
- Focus on **visual representation**
- Keep animations **under 15 seconds**
- Use **basic colors**: BLUE, RED, GREEN, YELLOW, PURPLE
- Simple movements: `shift()`, `scale()`, `rotate()`

### Try:
- Complex mathematical plots or graphs
- Fancy transformations or effects
- Long, complex code (keep under 20 lines in `construct()`)
- Multiple layers of abstraction
- Overly detailed visualizations

---

## Reference Templates

### 1. **Basic Shapes** (`01_basic_shapes.py`)
Simple shapes side by side.

**Pattern:**
```python
circle = Circle(radius=1, color=BLUE)
square = Square(side_length=1.5, color=GREEN).shift(RIGHT*2)
self.play(Create(circle), Create(square), run_time=1)
```

**Use for:** Comparing concepts, showing relationships, binary choices

---

### 2. **Text + Shapes** (`02_animations.py`)
Labels with visual elements.

**Pattern:**
```python
title = Text("Concept", font_size=36).to_edge(UP)
self.play(Write(title), run_time=0.5)

circle = Circle(radius=1.5, color=BLUE)
label = Text("Key Point", font_size=24).next_to(circle, DOWN)
self.play(Create(circle), FadeIn(label), run_time=1)
```

**Use for:** Explaining single concepts, definitions, key terms

---

### 3. **Arrows & Movement**
Show connections and flow.

**Pattern:**
```python
dot1 = Dot(LEFT*2, color=BLUE)
dot2 = Dot(RIGHT*2, color=RED)
arrow = Arrow(dot1.get_center(), dot2.get_center())

self.play(FadeIn(dot1), FadeIn(dot2), run_time=0.5)
self.play(Create(arrow), run_time=1)
```

**Use for:** Processes, transformations, cause-and-effect, sequences

---

### 4. **Simple Formulas** (`03_text_and_formulas.py`)
Mathematical expressions with visuals.

**Pattern:**
```python
title = Text("Formula", font_size=36).to_edge(UP)
equation = MathTex("a^2 + b^2 = c^2")

self.play(Write(title), run_time=0.5)
self.play(Write(equation), run_time=1)

# Optional: Add visual representation
triangle = Polygon(ORIGIN, RIGHT*2, RIGHT*2+UP*1.5, color=BLUE)
self.play(Create(triangle), run_time=1)
```

**Use for:** Theorems, equations, mathematical concepts

---

## Animation Timing Guidelines

### Target: **8-12 seconds**
This is the sweet spot for supplementary educational content.

### Timing Breakdown:
```python
def construct(self):
    # Title (0.8s total)
    title = Text("Concept")
    self.play(Write(title), run_time=0.5)
    self.wait(0.3)

    # Main visual (2s total)
    shape = Circle(radius=1, color=BLUE)
    self.play(Create(shape), run_time=1.2)
    self.wait(0.8)

    # Label (1.5s total)
    label = Text("Key Point").next_to(shape, DOWN)
    self.play(FadeIn(label), run_time=0.5)
    self.wait(1)

    # Exit (1s total)
    self.play(FadeOut(title), FadeOut(shape), FadeOut(label), run_time=1)

    # Total: ~5.3 seconds (leaves room for content)
```

### Quick Reference:
- **Write text:** 0.5-0.8s
- **Create shape:** 0.8-1.2s
- **FadeIn/Out:** 0.3-0.5s
- **Wait between actions:** 0.3-0.5s
- **Final wait:** 0.8-1.5s

---

## Code Minimization Rules

### Keep It Under 20 Lines

**Good (15 lines):**
```python
from manim import *

class GeneratedScene(Scene):
    def construct(self):
        title = Text("Concept", font_size=36)
        self.play(Write(title), run_time=0.5)
        self.play(title.animate.shift(UP*2), run_time=0.3)

        circle = Circle(radius=1, color=BLUE)
        label = Text("Point", font_size=24).next_to(circle, DOWN)

        self.play(Create(circle), FadeIn(label), run_time=1)
        self.wait(1)

        self.play(FadeOut(title), FadeOut(circle), FadeOut(label), run_time=0.5)
```

**Bad (Too complex):**
```python
# DON'T: Complex transformations, loops, functions
def complex_animation():
    for i in range(10):
        # Multiple nested animations...
```

---

## Color Palette

Use these standard Manim colors:
```python
BLUE      # Primary elements
RED       # Contrasting elements, warnings
GREEN     # Success, positive concepts
YELLOW    # Highlights, attention
PURPLE    # Special cases, alternatives
WHITE     # Text (default)
```

---

## Position Helpers

```python
# Edges
.to_edge(UP)      # Top of screen
.to_edge(DOWN)    # Bottom
.to_edge(LEFT)    # Left side
.to_edge(RIGHT)   # Right side

# Relative positioning
.next_to(other, DOWN)   # Below other object
.next_to(other, RIGHT)  # Right of other object

# Absolute positioning
.shift(UP*2)      # Move up 2 units
.shift(LEFT*3)    # Move left 3 units
```

---

## Common Patterns

### Pattern 1: Compare Two Things
```python
item_a = Circle(radius=1, color=BLUE).shift(LEFT*2)
item_b = Square(side_length=1.5, color=RED).shift(RIGHT*2)

label_a = Text("A", font_size=28).next_to(item_a, DOWN)
label_b = Text("B", font_size=28).next_to(item_b, DOWN)

self.play(
    Create(item_a), Create(item_b),
    FadeIn(label_a), FadeIn(label_b),
    run_time=1.2
)
```

### Pattern 2: Show Process/Flow
```python
start = Dot(LEFT*3, color=GREEN)
middle = Dot(ORIGIN, color=YELLOW)
end = Dot(RIGHT*3, color=RED)

arrow1 = Arrow(start, middle)
arrow2 = Arrow(middle, end)

self.play(FadeIn(start), run_time=0.3)
self.play(Create(arrow1), run_time=0.8)
self.play(FadeIn(middle), run_time=0.3)
self.play(Create(arrow2), run_time=0.8)
self.play(FadeIn(end), run_time=0.3)
```

### Pattern 3: Formula + Visual
```python
formula = MathTex("x^2 + y^2 = r^2").to_edge(UP)
self.play(Write(formula), run_time=0.8)

circle = Circle(radius=2, color=BLUE)
center = Dot(ORIGIN, color=RED)

self.play(Create(circle), FadeIn(center), run_time=1.2)
```

---

## Testing Your Templates

### Quick Test Prompts:
1. "Two circles connected by an arrow"
2. "A square transforming into a triangle"
3. "Three dots in a line with labels A, B, C"
4. "Simple addition: 2 + 3 = 5 with shapes"

### Expected Results:
- ✅ Clean, simple visuals
- ✅ Short animation (5-12s)
- ✅ Clear, readable code (<20 lines)
- ✅ No complex math or plots

---

## API Integration

The generation system automatically:
1. **References** these template patterns
2. **Focuses** on visual/drawn elements
3. **Minimizes** code complexity
4. **Targets** 8-12 second animations
5. **Uses** basic shapes and colors

---

## Examples from Sandbox

Explore `manim-sandbox/examples/` for more inspiration:
- `01_basic_shapes.py` - Simple geometric shapes
- `02_animations.py` - Fade, rotate, scale
- `03_text_and_formulas.py` - Text and math
- `vector_projection_simple.py` - Vector concepts
- `binary_search.py` - Algorithm visualization

---

**Goal:** Generate animations that enhance understanding through simple, clear visual metaphors - not complex technical demonstrations.
