"""
Example 2: Animations
Learn different types of animations in Manim.

Render command:
  docker-compose run --rm manim manim -pql examples/02_animations.py FadeAnimations
  docker-compose run --rm manim manim -pql examples/02_animations.py RotateAndScale
"""

from manim import *


class FadeAnimations(Scene):
    """Demonstrate fade in/out animations."""

    def construct(self):
        # Create objects
        circle = Circle(color=BLUE)
        square = Square(color=GREEN).shift(LEFT * 2)
        triangle = Triangle(color=RED).shift(RIGHT * 2)

        # Fade in
        self.play(FadeIn(square), FadeIn(circle), FadeIn(triangle))
        self.wait(1)

        # Fade out
        self.play(FadeOut(square), FadeOut(triangle))
        self.wait(0.5)

        # Circle remains
        self.play(circle.animate.scale(2))
        self.wait(1)


class RotateAndScale(Scene):
    """Demonstrate rotation and scaling."""

    def construct(self):
        # Create a square
        square = Square(color=YELLOW)

        self.play(Create(square))
        self.wait(0.5)

        # Rotate 90 degrees
        self.play(Rotate(square, angle=PI/2))
        self.wait(0.5)

        # Scale up
        self.play(square.animate.scale(2))
        self.wait(0.5)

        # Rotate while scaling down
        self.play(
            Rotate(square, angle=PI),
            square.animate.scale(0.5)
        )
        self.wait(1)


class WriteText(Scene):
    """Learn how to animate text."""

    def construct(self):
        # Create text
        title = Text("Hello Manim!", font_size=48)
        subtitle = Text("Animated Mathematics", font_size=36, color=BLUE)
        subtitle.next_to(title, DOWN)

        # Write text
        self.play(Write(title))
        self.wait(0.5)

        self.play(FadeIn(subtitle, shift=UP))
        self.wait(2)

        # Transform
        self.play(FadeOut(title), FadeOut(subtitle))
