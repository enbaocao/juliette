"""
Template: vector_addition
Description: Visualize 2D vector addition

Parameters:
  - vector1_x: float - x-component of first vector
  - vector1_y: float - y-component of first vector
  - vector2_x: float - x-component of second vector
  - vector2_y: float - y-component of second vector
  - show_components: bool (optional) - Show component breakdown

Example usage:
  python:
    VectorAdditionScene(vector1=[2, 1], vector2=[1, 3])

  CLI:
    docker-compose run --rm manim manim -pql templates/vector_addition.py VectorAdditionScene

Render command for testing:
  docker-compose run --rm manim manim -pql templates/vector_addition.py
"""

from manim import *
import numpy as np


class VectorAdditionScene(Scene):
    """
    Visualize vector addition in 2D.
    Customize by setting class attributes.
    """

    # Default parameters
    vector1 = [2, 1]
    vector2 = [1, 3]
    show_components = True

    def construct(self):
        # Title
        title = Text("Vector Addition", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))

        # Create coordinate plane
        plane = NumberPlane(
            x_range=[-5, 5, 1],
            y_range=[-5, 5, 1],
            background_line_style={
                "stroke_color": GREY,
                "stroke_width": 1,
            }
        )

        self.play(Create(plane))
        self.wait(0.5)

        # First vector
        v1 = Arrow(
            plane.c2p(0, 0),
            plane.c2p(self.vector1[0], self.vector1[1]),
            buff=0,
            color=BLUE
        )
        v1_label = MathTex(r"\vec{v_1}", color=BLUE)
        v1_label.next_to(v1.get_center(), LEFT)

        self.play(GrowArrow(v1), Write(v1_label))
        self.wait(0.5)

        # Second vector (from origin)
        v2_origin = Arrow(
            plane.c2p(0, 0),
            plane.c2p(self.vector2[0], self.vector2[1]),
            buff=0,
            color=GREEN
        )
        v2_label_origin = MathTex(r"\vec{v_2}", color=GREEN)
        v2_label_origin.next_to(v2_origin.get_center(), RIGHT)

        self.play(GrowArrow(v2_origin), Write(v2_label_origin))
        self.wait(1)

        # Second vector (from tip of first)
        v2_shifted = Arrow(
            plane.c2p(self.vector1[0], self.vector1[1]),
            plane.c2p(self.vector1[0] + self.vector2[0], self.vector1[1] + self.vector2[1]),
            buff=0,
            color=GREEN
        )
        v2_label_shifted = MathTex(r"\vec{v_2}", color=GREEN)
        v2_label_shifted.next_to(v2_shifted.get_center(), RIGHT)

        # Animate shifting v2
        self.play(
            Transform(v2_origin, v2_shifted),
            Transform(v2_label_origin, v2_label_shifted)
        )
        self.wait(1)

        # Result vector
        result = Arrow(
            plane.c2p(0, 0),
            plane.c2p(self.vector1[0] + self.vector2[0], self.vector1[1] + self.vector2[1]),
            buff=0,
            color=YELLOW,
            stroke_width=6
        )
        result_label = MathTex(r"\vec{v_1} + \vec{v_2}", color=YELLOW)
        result_label.next_to(result.get_center(), UP)

        self.play(GrowArrow(result), Write(result_label))
        self.wait(1)

        # Show components if requested
        if self.show_components:
            self.show_component_breakdown(plane)

        self.wait(2)

    def show_component_breakdown(self, plane):
        """Display the component-wise addition."""
        # Component equations
        comp_eq = VGroup(
            MathTex(f"v_1 = ({self.vector1[0]}, {self.vector1[1]})", color=BLUE),
            MathTex(f"v_2 = ({self.vector2[0]}, {self.vector2[1]})", color=GREEN),
            MathTex(
                f"v_1 + v_2 = ({self.vector1[0] + self.vector2[0]}, {self.vector1[1] + self.vector2[1]})",
                color=YELLOW
            )
        ).arrange(DOWN, aligned_edge=LEFT)

        comp_eq.to_corner(UR)

        self.play(Write(comp_eq))
        self.wait(2)


# Example scenes
class SimpleAddition(VectorAdditionScene):
    vector1 = [2, 1]
    vector2 = [1, 3]
    show_components = True


class OppositeVectors(VectorAdditionScene):
    vector1 = [3, 2]
    vector2 = [-3, -2]
    show_components = True


class PerpendicularVectors(VectorAdditionScene):
    vector1 = [2, 0]
    vector2 = [0, 3]
    show_components = True
