"""
Template: geometry_diagram
Description: Draw geometric shapes with labels and measurements

Parameters:
  - shapes: list - List of shape specs [{"type": "triangle", "points": [...], "color": "BLUE"}]
  - labels: list - Labels for points and sides
  - measurements: list - Measurements to display

Example usage:
  python:
    GeometryScene(diagram_type="right_triangle")

Render command for testing:
  docker-compose run --rm manim manim -pql templates/geometry_diagram.py GeometryScene
"""

from manim import *
import numpy as np


class GeometryScene(Scene):
    """
    Draw geometric diagrams with labels and measurements.
    Preset diagram types for common scenarios.
    """

    # Default to right triangle
    diagram_type = "right_triangle"  # Options: right_triangle, circle, square, pentagon, parallel_lines
    title_text = "Geometry Diagram"

    def construct(self):
        # Title
        title = Text(self.title_text, font_size=40)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Draw based on diagram type
        if self.diagram_type == "right_triangle":
            self.draw_right_triangle()
        elif self.diagram_type == "circle":
            self.draw_circle_with_radius()
        elif self.diagram_type == "square":
            self.draw_square()
        elif self.diagram_type == "pentagon":
            self.draw_regular_polygon(5)
        elif self.diagram_type == "parallel_lines":
            self.draw_parallel_lines()
        else:
            # Default
            self.draw_right_triangle()

        self.wait(2)

    def draw_right_triangle(self):
        """Draw a right triangle with labels."""
        # Create triangle
        A = ORIGIN + LEFT * 2 + DOWN * 1
        B = ORIGIN + RIGHT * 2 + DOWN * 1
        C = ORIGIN + RIGHT * 2 + UP * 1.5

        triangle = Polygon(A, B, C, color=BLUE)

        # Right angle marker
        right_angle = RightAngle(
            Line(A, B), Line(B, C),
            length=0.3,
            color=WHITE
        )

        self.play(Create(triangle), Create(right_angle))
        self.wait(0.5)

        # Labels
        label_A = MathTex("A").next_to(A, LEFT)
        label_B = MathTex("B").next_to(B, DOWN)
        label_C = MathTex("C").next_to(C, RIGHT)

        self.play(Write(label_A), Write(label_B), Write(label_C))
        self.wait(0.5)

        # Side lengths
        side_a = MathTex("a = 2.5").next_to(Line(B, C).get_center(), RIGHT)
        side_b = MathTex("b = 4").next_to(Line(A, B).get_center(), DOWN)
        side_c = MathTex("c = ?").next_to(Line(A, C).get_center(), UP + LEFT)

        self.play(Write(side_a), Write(side_b), Write(side_c))
        self.wait(1)

        # Pythagorean theorem
        theorem = MathTex("a^2 + b^2 = c^2")
        theorem.to_corner(UR)
        self.play(Write(theorem))
        self.wait(1)

    def draw_circle_with_radius(self):
        """Draw a circle with radius and circumference."""
        # Circle
        circle = Circle(radius=2, color=BLUE)

        self.play(Create(circle))
        self.wait(0.5)

        # Center point
        center = Dot(ORIGIN, color=YELLOW)
        center_label = MathTex("O").next_to(center, DOWN)

        self.play(Create(center), Write(center_label))
        self.wait(0.5)

        # Radius line
        radius_line = Line(ORIGIN, ORIGIN + RIGHT * 2, color=RED)
        radius_label = MathTex("r = 2", color=RED).next_to(radius_line, UP)

        self.play(Create(radius_line), Write(radius_label))
        self.wait(1)

        # Formulas
        area_formula = MathTex(r"A = \pi r^2 = 4\pi", font_size=36)
        circum_formula = MathTex(r"C = 2\pi r = 4\pi", font_size=36)

        formulas = VGroup(area_formula, circum_formula).arrange(DOWN)
        formulas.to_corner(UR)

        self.play(Write(formulas))
        self.wait(2)

    def draw_square(self):
        """Draw a square with side labels."""
        square = Square(side_length=3, color=GREEN)

        self.play(Create(square))
        self.wait(0.5)

        # Side label
        side_label = MathTex("s = 3")
        side_label.next_to(square, DOWN)

        self.play(Write(side_label))
        self.wait(1)

        # Area and perimeter
        area = MathTex(r"A = s^2 = 9", font_size=36)
        perimeter = MathTex(r"P = 4s = 12", font_size=36)

        formulas = VGroup(area, perimeter).arrange(DOWN)
        formulas.to_corner(UR)

        self.play(Write(formulas))
        self.wait(2)

    def draw_regular_polygon(self, n):
        """Draw a regular polygon with n sides."""
        polygon = RegularPolygon(n=n, radius=2, color=PURPLE)

        self.play(Create(polygon))
        self.wait(0.5)

        # Center and radius
        center = Dot(ORIGIN, color=YELLOW)
        radius_line = Line(ORIGIN, ORIGIN + UP * 2, color=RED)

        self.play(Create(center), Create(radius_line))
        self.wait(1)

        # Info
        info = Text(f"Regular {n}-gon", font_size=32)
        info.to_corner(UR)

        angle = MathTex(rf"\text{{Interior angle}} = {(n-2)*180/n:.1f}°", font_size=28)
        angle.next_to(info, DOWN)

        self.play(Write(info), Write(angle))
        self.wait(2)

    def draw_parallel_lines(self):
        """Draw parallel lines with transversal."""
        # Two parallel lines
        line1 = Line(LEFT * 3, RIGHT * 3, color=BLUE).shift(UP)
        line2 = Line(LEFT * 3, RIGHT * 3, color=BLUE).shift(DOWN)

        self.play(Create(line1), Create(line2))
        self.wait(0.5)

        # Transversal
        transversal = Line(LEFT * 2 + DOWN * 2, RIGHT * 2 + UP * 2, color=RED)

        self.play(Create(transversal))
        self.wait(1)

        # Angle markers (simplified)
        angle_text = Text("Corresponding angles are equal", font_size=28)
        angle_text.to_edge(DOWN)

        self.play(Write(angle_text))
        self.wait(2)


# Example scenes
class RightTriangleExample(GeometryScene):
    diagram_type = "right_triangle"
    title_text = "Right Triangle"


class CircleExample(GeometryScene):
    diagram_type = "circle"
    title_text = "Circle Properties"


class SquareExample(GeometryScene):
    diagram_type = "square"
    title_text = "Square Properties"


class PentagonExample(GeometryScene):
    diagram_type = "pentagon"
    title_text = "Regular Pentagon"


class ParallelLinesExample(GeometryScene):
    diagram_type = "parallel_lines"
    title_text = "Parallel Lines and Transversal"
