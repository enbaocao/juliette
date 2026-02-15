"""
Template: function_graph
Description: Plot a mathematical function with optional tangent line

Parameters:
  - function: str - Function expression (e.g., "x**2", "np.sin(x)", "x**3 - 2*x")
  - x_range: [min, max, step] - Range for x-axis (e.g., [-3, 3, 0.1])
  - tangent_point: float (optional) - x-coordinate where to draw tangent line

Example usage:
  python:
    FunctionGraphScene(function="x**2", x_range=[-3, 3, 0.1], tangent_point=1)

  CLI:
    docker-compose run --rm manim manim -pql templates/function_graph.py FunctionGraphScene

Render command for testing:
  docker-compose run --rm manim manim -pql templates/function_graph.py
"""

from manim import *
import numpy as np


class FunctionGraphScene(Scene):
    """
    Renders a function graph with optional tangent line.
    Customize by setting class attributes before constructing.
    """

    # Default parameters
    function_str = "x**2"
    x_range = [-3, 3, 0.1]
    tangent_point = None
    title_text = "Function Graph"

    def construct(self):
        # Create axes
        axes = Axes(
            x_range=[self.x_range[0], self.x_range[1], 1],
            y_range=[-1, 10, 1],
            axis_config={"include_tip": True},
        )

        # Create labels
        labels = axes.get_axis_labels(x_label="x", y_label="f(x)")

        # Title
        title = Text(self.title_text, font_size=36)
        title.to_edge(UP)

        # Define function
        def func(x):
            return eval(self.function_str, {"x": x, "np": np, "sin": np.sin, "cos": np.cos, "tan": np.tan})

        # Create graph
        graph = axes.plot(func, color=BLUE)

        # Function label
        func_label = MathTex(f"f(x) = {self.function_str}")
        func_label.next_to(title, DOWN)

        # Animate
        self.play(Write(title))
        self.play(Create(axes), Write(labels))
        self.play(Create(graph), Write(func_label))
        self.wait(1)

        # Draw tangent line if specified
        if self.tangent_point is not None:
            self.draw_tangent(axes, graph, func, self.tangent_point)

        self.wait(2)

    def draw_tangent(self, axes, graph, func, x_point):
        """Draw a tangent line at the specified point."""
        # Calculate derivative numerically
        h = 0.0001
        slope = (func(x_point + h) - func(x_point - h)) / (2 * h)
        y_point = func(x_point)

        # Create point
        dot = Dot(axes.c2p(x_point, y_point), color=YELLOW)

        # Tangent line
        tangent = axes.plot(
            lambda x: slope * (x - x_point) + y_point,
            color=RED,
            x_range=[self.x_range[0], self.x_range[1]]
        )

        # Label
        tangent_label = MathTex(f"m = {slope:.2f}", color=RED)
        tangent_label.next_to(dot, UP + RIGHT)

        self.play(Create(dot))
        self.play(Create(tangent), Write(tangent_label))
        self.wait(1)


# Example scenes with different parameters
class ParabolaWithTangent(FunctionGraphScene):
    function_str = "x**2"
    x_range = [-3, 3, 0.1]
    tangent_point = 1.5
    title_text = "Parabola with Tangent"


class SineWave(FunctionGraphScene):
    function_str = "2 * np.sin(x)"
    x_range = [-2 * np.pi, 2 * np.pi, 0.1]
    tangent_point = np.pi / 2
    title_text = "Sine Wave"


class CubicFunction(FunctionGraphScene):
    function_str = "0.2 * x**3 - x"
    x_range = [-4, 4, 0.1]
    tangent_point = 2
    title_text = "Cubic Function"
