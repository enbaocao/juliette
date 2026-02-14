"""
Example 1: Basic Shapes
Learn how to create and display simple shapes in Manim.

Render command:
  docker-compose run --rm manim manim -pql examples/01_basic_shapes.py BasicShapes
"""

from manim import *


class BasicShapes(Scene):
    def construct(self):
        # Create a circle
        circle = Circle(radius=1, color=BLUE)
        circle.shift(LEFT * 3)

        # Create a square
        square = Square(side_length=2, color=GREEN)

        # Create a triangle
        triangle = Triangle(color=RED)
        triangle.shift(RIGHT * 3)

        # Display all shapes
        self.play(Create(circle), Create(square), Create(triangle))
        self.wait(1)

        # Change colors
        self.play(
            circle.animate.set_fill(BLUE, opacity=0.5),
            square.animate.set_fill(GREEN, opacity=0.5),
            triangle.animate.set_fill(RED, opacity=0.5)
        )
        self.wait(2)


class MovingShapes(Scene):
    """Learn how to move and transform shapes."""

    def construct(self):
        # Create a circle
        circle = Circle(radius=0.5, color=YELLOW)
        circle.shift(LEFT * 3)

        # Move the circle across the screen
        self.play(Create(circle))
        self.wait(0.5)

        self.play(circle.animate.shift(RIGHT * 6))
        self.wait(0.5)

        # Transform into a square
        square = Square(side_length=1, color=PURPLE)
        square.shift(RIGHT * 3)

        self.play(Transform(circle, square))
        self.wait(1)
