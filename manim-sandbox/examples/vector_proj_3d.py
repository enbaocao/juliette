"""
Vector Projection onto a Plane - Working 3D Version

Render command:
  docker-compose run --rm manim manim -ql examples/vector_proj_3d.py Projection3D
"""

from manim import *
import numpy as np


class Projection3D(ThreeDScene):
    def construct(self):
        # Title
        title = Text("Vector Projection onto a Plane", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.add_fixed_in_frame_mobjects(title)
        self.play(Write(title))
        self.wait(0.5)

        # Setup
        axes = ThreeDAxes(
            x_range=[-3, 3, 1],
            y_range=[-3, 3, 1],
            z_range=[-3, 3, 1],
            x_length=5,
            y_length=5,
            z_length=5
        )

        self.set_camera_orientation(phi=70 * DEGREES, theta=45 * DEGREES)
        self.play(Create(axes), run_time=0.8)
        self.wait(0.4)

        # Plane
        plane = Surface(
            lambda u, v: axes.c2p(u, v, 0),
            u_range=[-2, 2],
            v_range=[-2, 2],
            fill_color=BLUE,
            fill_opacity=0.25,
            checkerboard_colors=[BLUE_D, BLUE_E]
        )

        plane_label = Text("Plane", font_size=24, color=BLUE)
        plane_label.to_edge(DOWN, buff=0.5)
        self.add_fixed_in_frame_mobjects(plane_label)

        self.play(Create(plane), Write(plane_label), run_time=1)
        self.wait(0.8)

        # Original vector
        self.play(FadeOut(plane_label), run_time=0.2)

        v = Arrow3D(
            start=axes.c2p(0, 0, 0),
            end=axes.c2p(2, 1.5, 1.8),
            color=YELLOW,
            thickness=0.02
        )

        v_label = Text("v", font_size=24, color=YELLOW)
        v_label.to_edge(DOWN, buff=0.5)
        self.add_fixed_in_frame_mobjects(v_label)

        self.play(Create(v), Write(v_label), run_time=1)
        self.wait(1)

        # Projection
        self.play(FadeOut(v_label), run_time=0.2)

        v_proj = Arrow3D(
            start=axes.c2p(0, 0, 0),
            end=axes.c2p(2, 1.5, 0),
            color=GREEN,
            thickness=0.02
        )

        proj_label = Text("Projection", font_size=24, color=GREEN)
        proj_label.to_edge(DOWN, buff=0.5)
        self.add_fixed_in_frame_mobjects(proj_label)

        self.play(Create(v_proj), Write(proj_label), run_time=1)
        self.wait(1)

        # Perpendicular
        self.play(FadeOut(proj_label), run_time=0.2)

        v_perp = Arrow3D(
            start=axes.c2p(2, 1.5, 0),
            end=axes.c2p(2, 1.5, 1.8),
            color=RED,
            thickness=0.02
        )

        perp_label = Text("Perpendicular", font_size=24, color=RED)
        perp_label.to_edge(DOWN, buff=0.5)
        self.add_fixed_in_frame_mobjects(perp_label)

        self.play(Create(v_perp), Write(perp_label), run_time=1)
        self.wait(1)

        # Decomposition
        self.play(FadeOut(perp_label), run_time=0.2)

        eq = MathTex(r"\vec{v} = \vec{v}_{\parallel} + \vec{v}_{\perp}", font_size=28)
        eq.to_edge(DOWN, buff=0.5)
        self.add_fixed_in_frame_mobjects(eq)

        self.play(Write(eq), run_time=1)
        self.wait(1.5)

        # Rotate
        self.move_camera(phi=50 * DEGREES, theta=80 * DEGREES, run_time=2)
        self.wait(0.8)
        self.move_camera(phi=80 * DEGREES, theta=120 * DEGREES, run_time=2)
        self.wait(0.8)
        self.move_camera(phi=70 * DEGREES, theta=45 * DEGREES, run_time=1.5)
        self.wait(1)
