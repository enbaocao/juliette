"""
Template: calculus_derivative
Description: Visualize derivatives as rate of change

Parameters:
  - function: str - Function expression (e.g., "x**2")
  - point: float - Point at which to show derivative
  - show_tangent: bool - Whether to show tangent line
  - show_secant: bool - Whether to animate secant lines approaching tangent

Example usage:
  python:
    DerivativeScene(function="x**2", point=1, show_tangent=True, show_secant=True)

Render command for testing:
  docker-compose run --rm manim manim -pql templates/calculus_derivative.py DerivativeScene
"""

from manim import *
import numpy as np


class DerivativeScene(Scene):
    """
    Visualize the concept of derivatives.
    Shows how secant lines approach the tangent line.
    """

    # Default parameters
    function_str = "x**2"
    point = 1.5
    show_tangent = True
    show_secant = True
    title_text = "Derivative as Rate of Change"

    def construct(self):
        # Title
        title = Text(self.title_text, font_size=36)
        title.to_edge(UP)
        self.play(Write(title))

        # Create axes
        axes = Axes(
            x_range=[-1, 4, 1],
            y_range=[-1, 10, 1],
            axis_config={"include_tip": True},
        )
        labels = axes.get_axis_labels(x_label="x", y_label="f(x)")

        # Define function
        def func(x):
            return eval(self.function_str, {"x": x, "np": np, "sin": np.sin, "cos": np.cos})

        # Create graph
        graph = axes.plot(func, color=BLUE)
        func_label = MathTex(f"f(x) = {self.function_str}", color=BLUE)
        func_label.next_to(title, DOWN)

        self.play(Create(axes), Write(labels))
        self.play(Create(graph), Write(func_label))
        self.wait(1)

        # Point of interest
        x_point = self.point
        y_point = func(x_point)
        dot = Dot(axes.c2p(x_point, y_point), color=YELLOW, radius=0.08)
        dot_label = MathTex(f"x = {x_point:.2f}", color=YELLOW)
        dot_label.next_to(dot, UP + RIGHT)

        self.play(Create(dot), Write(dot_label))
        self.wait(1)

        # Show secant lines approaching tangent
        if self.show_secant:
            self.animate_secant_lines(axes, func, x_point, y_point)

        # Show tangent line
        if self.show_tangent:
            self.show_tangent_line(axes, func, x_point, y_point)

        self.wait(2)

    def animate_secant_lines(self, axes, func, x_point, y_point):
        """Animate secant lines getting closer to the tangent."""
        # Information box
        info_text = Text("Secant lines approaching tangent", font_size=24, color=RED)
        info_text.to_corner(DL)
        self.play(Write(info_text))

        # Animate secant lines with decreasing h
        h_values = [2.0, 1.0, 0.5, 0.2, 0.1]

        for h in h_values:
            # Second point
            x2 = x_point + h
            y2 = func(x2)

            # Secant line
            slope = (y2 - y_point) / h
            secant = axes.plot(
                lambda x: slope * (x - x_point) + y_point,
                color=RED,
                x_range=[-1, 4]
            )

            # Second dot
            dot2 = Dot(axes.c2p(x2, y2), color=RED)

            # Slope label
            slope_label = MathTex(f"m = {slope:.2f}", color=RED)
            slope_label.next_to(axes.c2p(x_point + 1, func(x_point + 1)), RIGHT)

            # Animate
            self.play(
                Create(secant),
                Create(dot2),
                Write(slope_label),
                run_time=0.8
            )
            self.wait(0.5)

            # Remove for next iteration
            if h != h_values[-1]:
                self.play(
                    FadeOut(secant),
                    FadeOut(dot2),
                    FadeOut(slope_label),
                    run_time=0.3
                )

        self.play(FadeOut(info_text))

    def show_tangent_line(self, axes, func, x_point, y_point):
        """Show the tangent line and derivative value."""
        # Calculate derivative
        h = 0.0001
        derivative = (func(x_point + h) - func(x_point - h)) / (2 * h)

        # Tangent line
        tangent = axes.plot(
            lambda x: derivative * (x - x_point) + y_point,
            color=GREEN,
            x_range=[-1, 4],
            stroke_width=6
        )

        # Derivative label
        deriv_label = MathTex(f"f'({x_point:.2f}) = {derivative:.2f}", color=GREEN)
        deriv_label.to_corner(DR)

        tangent_text = Text("Tangent Line", font_size=28, color=GREEN)
        tangent_text.next_to(deriv_label, UP)

        self.play(Create(tangent), Write(tangent_text), Write(deriv_label))
        self.wait(2)


# Example scenes
class ParabolaDerivative(DerivativeScene):
    function_str = "x**2"
    point = 1.5
    show_tangent = True
    show_secant = True
    title_text = "Derivative of x²"


class SineDerivative(DerivativeScene):
    function_str = "2 * np.sin(x) + 2"
    point = 1.0
    show_tangent = True
    show_secant = True
    title_text = "Derivative of sin(x)"


class CubicDerivative(DerivativeScene):
    function_str = "0.3 * x**3 - x + 2"
    point = 1.5
    show_tangent = True
    show_secant = True
    title_text = "Derivative of Cubic Function"
