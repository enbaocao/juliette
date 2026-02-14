"""
Example 3: Text and LaTeX Formulas
Learn how to display text and mathematical formulas.

Render command:
  docker-compose run --rm manim manim -pql examples/03_text_and_formulas.py MathFormulas
  docker-compose run --rm manim manim -pql examples/03_text_and_formulas.py QuadraticFormula
"""

from manim import *


class MathFormulas(Scene):
    """Display various mathematical formulas."""

    def construct(self):
        # Simple equation
        eq1 = MathTex("f(x) = x^2")

        self.play(Write(eq1))
        self.wait(1)

        # More complex equation
        eq2 = MathTex(r"\frac{d}{dx} x^2 = 2x")
        eq2.next_to(eq1, DOWN)

        self.play(Write(eq2))
        self.wait(2)

        # Clear screen
        self.play(FadeOut(eq1), FadeOut(eq2))


class QuadraticFormula(Scene):
    """Demonstrate the quadratic formula with animations."""

    def construct(self):
        # Title
        title = Text("Quadratic Formula", font_size=48)
        title.to_edge(UP)

        self.play(Write(title))
        self.wait(0.5)

        # The general form
        general = MathTex("ax^2 + bx + c = 0")
        general.shift(UP * 1.5)

        self.play(Write(general))
        self.wait(1)

        # The solution
        solution = MathTex(
            "x = ",
            r"\frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"
        )
        solution.shift(DOWN * 0.5)

        self.play(Write(solution))
        self.wait(2)

        # Highlight the discriminant
        discriminant = MathTex(r"b^2 - 4ac", color=YELLOW)
        discriminant.shift(DOWN * 2)

        disc_label = Text("Discriminant", font_size=24, color=YELLOW)
        disc_label.next_to(discriminant, DOWN)

        self.play(Write(discriminant), Write(disc_label))
        self.wait(2)


class PythagoreanTheorem(Scene):
    """Visualize the Pythagorean theorem."""

    def construct(self):
        # Title
        title = Text("Pythagorean Theorem", font_size=40)
        title.to_edge(UP)

        self.play(Write(title))
        self.wait(0.5)

        # Formula
        formula = MathTex("a^2 + b^2 = c^2")

        self.play(Write(formula))
        self.wait(1)

        # Move formula up
        self.play(formula.animate.shift(UP * 1))

        # Create a right triangle
        triangle = Polygon(
            ORIGIN,
            RIGHT * 3,
            RIGHT * 3 + UP * 2,
            color=BLUE
        )
        triangle.shift(DOWN * 1)

        # Labels
        a_label = MathTex("a").next_to(triangle, DOWN)
        b_label = MathTex("b").next_to(triangle, RIGHT)
        c_label = MathTex("c").move_to(triangle.get_center() + LEFT * 1 + UP * 0.5)

        self.play(Create(triangle))
        self.play(Write(a_label), Write(b_label), Write(c_label))
        self.wait(2)
