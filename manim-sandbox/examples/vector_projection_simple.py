"""
Vector Projection onto a Plane - Simplified 3D Version
Clean 3D animation focusing on the core concept

Render command:
  docker-compose run --rm manim manim -ql examples/vector_projection_simple.py ProjectionSimple
"""

from manim import *
import numpy as np


class ProjectionSimple(ThreeDScene):
    def construct(self):
        # Title
        title = Text("Vector Projection onto a Plane", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.add_fixed_in_frame_mobjects(title)
        self.play(Write(title))
        self.wait(0.5)

        # Setup 3D axes
        axes = ThreeDAxes(
            x_range=[-3, 3, 1],
            y_range=[-3, 3, 1],
            z_range=[-3, 3, 1],
            x_length=5,
            y_length=5,
            z_length=5
        )

        self.set_camera_orientation(phi=70 * DEGREES, theta=45 * DEGREES)
        self.play(Create(axes), run_time=1)
        self.wait(0.5)

        # Create the plane (xy-plane, z=0)
        plane = Surface(
            lambda u, v: axes.c2p(u, v, 0),
            u_range=[-2, 2],
            v_range=[-2, 2],
            fill_color=BLUE,
            fill_opacity=0.3,
            checkerboard_colors=[BLUE_D, BLUE_E]
        )

        self.play(Create(plane), run_time=1)
        self.wait(0.8)

        # Original vector in 3D
        v_start = axes.c2p(0, 0, 0)
        v_end = axes.c2p(2, 1.5, 1.8)

        v_arrow = Arrow3D(
            start=v_start,
            end=v_end,
            color=YELLOW,
            thickness=0.02
        )

        vector_label = Text("Original vector", font_size=24, color=YELLOW)
        vector_label.to_edge(DOWN, buff=0.5)
        self.add_fixed_in_frame_mobjects(vector_label)

        self.play(
            Create(v_arrow),
            Write(vector_label),
            run_time=1
        )
        self.wait(1)

        # Projection onto plane
        self.play(FadeOut(vector_label), run_time=0.3)

        proj_end = axes.c2p(2, 1.5, 0)  # Same x, y, but z=0

        proj_arrow = Arrow3D(
            start=v_start,
            end=proj_end,
            color=GREEN,
            thickness=0.02
        )

        # Dashed line showing projection
        proj_line = DashedLine3D(
            start=v_end,
            end=proj_end,
            color=WHITE
        )

        proj_label = Text("Projection", font_size=24, color=GREEN)
        proj_label.to_edge(DOWN, buff=0.5)
        self.add_fixed_in_frame_mobjects(proj_label)

        self.play(Create(proj_line), run_time=0.6)
        self.play(
            Create(proj_arrow),
            Write(proj_label),
            run_time=1
        )
        self.wait(1.5)

        # Perpendicular component
        self.play(FadeOut(proj_label), run_time=0.3)

        perp_arrow = Arrow3D(
            start=proj_end,
            end=v_end,
            color=RED,
            thickness=0.02
        )

        perp_label = Text("Perpendicular", font_size=24, color=RED)
        perp_label.to_edge(DOWN, buff=0.5)
        self.add_fixed_in_frame_mobjects(perp_label)

        self.play(
            FadeOut(proj_line),
            Create(perp_arrow),
            Write(perp_label),
            run_time=1
        )
        self.wait(1.5)

        # Show decomposition
        self.play(FadeOut(perp_label), run_time=0.3)

        equation = MathTex(
            r"\vec{v} = \vec{v}_{\parallel} + \vec{v}_{\perp}",
            font_size=28
        )
        equation.to_edge(DOWN, buff=0.5)
        self.add_fixed_in_frame_mobjects(equation)

        self.play(Write(equation), run_time=1)
        self.play(
            Flash(proj_arrow, color=GREEN, line_length=0.2),
            Flash(perp_arrow, color=RED, line_length=0.2),
            run_time=0.8
        )
        self.wait(1.5)

        # Rotate view
        self.move_camera(phi=50 * DEGREES, theta=80 * DEGREES, run_time=2.5)
        self.wait(1)
        self.move_camera(phi=80 * DEGREES, theta=120 * DEGREES, run_time=2.5)
        self.wait(1)

        # Final insight
        self.play(FadeOut(equation), run_time=0.4)

        insight = Text("The projection is the 'shadow' on the plane!", font_size=24)
        insight.to_edge(DOWN, buff=0.5)
        self.add_fixed_in_frame_mobjects(insight)

        self.play(Write(insight), run_time=1)
        self.wait(2)

        # Final rotation
        self.move_camera(phi=70 * DEGREES, theta=45 * DEGREES, run_time=2)
        self.wait(1)
