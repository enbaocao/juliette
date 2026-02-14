"""
Vector Projection onto a Plane - 3D Visualization
Beautiful 3D animation showing how vectors project onto planes

Shows:
- 3D axes and a plane
- Original vector in 3D space
- Projection onto the plane (parallel component)
- Perpendicular component (normal to plane)
- Decomposition: v = v_parallel + v_perp
- Rotating view for better understanding

Render command:
  docker-compose run --rm manim manim -ql examples/vector_projection_plane.py VectorProjectionPlane
"""

from manim import *
import numpy as np


class VectorProjectionPlane(ThreeDScene):
    def construct(self):
        # SECTION 1: Title
        title = Text("Vector Projection onto a Plane", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.add_fixed_in_frame_mobjects(title)
        self.play(Write(title))
        self.wait(0.5)

        # SECTION 2: Setup 3D scene
        axes = ThreeDAxes(
            x_range=[-4, 4, 1],
            y_range=[-4, 4, 1],
            z_range=[-4, 4, 1],
            x_length=6,
            y_length=6,
            z_length=6
        )

        # Add axis labels
        x_label = MathTex("x", font_size=24).next_to(axes.x_axis, RIGHT)
        y_label = MathTex("y", font_size=24).next_to(axes.y_axis, UP)
        z_label = MathTex("z", font_size=24).next_to(axes.z_axis, OUT)

        self.set_camera_orientation(phi=70 * DEGREES, theta=45 * DEGREES)

        self.play(Create(axes), run_time=1)
        self.add_fixed_in_frame_mobjects(x_label, y_label, z_label)
        self.wait(0.5)

        # SECTION 3: Create the plane (xy-plane for simplicity)
        # We'll use the plane z = 0
        plane = Surface(
            lambda u, v: axes.c2p(u, v, 0),
            u_range=[-3, 3],
            v_range=[-3, 3],
            fill_color=BLUE,
            fill_opacity=0.3,
            stroke_color=BLUE,
            checkerboard_colors=[BLUE_D, BLUE_E],
            resolution=(10, 10)
        )

        plane_label = Text("Plane (z = 0)", font_size=24, color=BLUE)
        plane_label.to_edge(DOWN, buff=0.5)
        self.add_fixed_in_frame_mobjects(plane_label)

        self.play(
            Create(plane),
            Write(plane_label),
            run_time=1.5
        )
        self.wait(1)

        # SECTION 4: Show the original vector
        self.play(FadeOut(plane_label), run_time=0.3)

        # Vector pointing into 3D space
        v_coords = np.array([2, 1.5, 2])
        v_arrow = Arrow3D(
            start=axes.c2p(0, 0, 0),
            end=axes.c2p(*v_coords),
            color=YELLOW,
            thickness=0.03,
            height=0.3,
            base_radius=0.15
        )

        v_label = MathTex(r"\vec{v}", font_size=32, color=YELLOW)
        v_label.next_to(axes.c2p(*v_coords), OUT + RIGHT)
        self.add_fixed_orientation_mobjects(v_label)

        vector_text = Text("Original Vector", font_size=26, color=YELLOW)
        vector_text.to_edge(DOWN, buff=0.5)
        self.add_fixed_in_frame_mobjects(vector_text)

        self.play(
            Create(v_arrow),
            Write(v_label),
            Write(vector_text),
            run_time=1.2
        )
        self.wait(1.5)

        # SECTION 5: Rotate camera to see better
        self.play(FadeOut(vector_text), run_time=0.3)

        rotate_text = Text("Let's rotate the view", font_size=24, color=BLUE_B)
        rotate_text.to_edge(DOWN, buff=0.5)
        self.add_fixed_in_frame_mobjects(rotate_text)
        self.play(Write(rotate_text))

        self.begin_ambient_camera_rotation(rate=0.3)
        self.wait(3)
        self.stop_ambient_camera_rotation()

        self.play(FadeOut(rotate_text), run_time=0.3)
        self.set_camera_orientation(phi=70 * DEGREES, theta=45 * DEGREES)
        self.wait(0.5)

        # SECTION 6: Show the projection
        proj_text = Text("Projection onto plane", font_size=26, color=GREEN)
        proj_text.to_edge(DOWN, buff=0.5)
        self.add_fixed_in_frame_mobjects(proj_text)
        self.play(Write(proj_text))
        self.wait(0.5)

        # Projection is just (x, y, 0) for our plane
        v_proj_coords = np.array([v_coords[0], v_coords[1], 0])
        v_proj_arrow = Arrow3D(
            start=axes.c2p(0, 0, 0),
            end=axes.c2p(*v_proj_coords),
            color=GREEN,
            thickness=0.03,
            height=0.3,
            base_radius=0.15
        )

        v_proj_label = MathTex(r"\vec{v}_{\parallel}", font_size=32, color=GREEN)
        v_proj_label.next_to(axes.c2p(*v_proj_coords), RIGHT)
        self.add_fixed_orientation_mobjects(v_proj_label)

        # Draw dashed line from tip of v to the plane
        projection_line = DashedLine3D(
            start=axes.c2p(*v_coords),
            end=axes.c2p(*v_proj_coords),
            color=WHITE,
            dash_length=0.1,
            dashed_ratio=0.5
        )

        self.play(Create(projection_line), run_time=0.8)
        self.play(
            Create(v_proj_arrow),
            Write(v_proj_label),
            run_time=1.2
        )
        self.wait(1.5)

        # SECTION 7: Show the perpendicular component
        self.play(FadeOut(proj_text), run_time=0.3)

        perp_text = Text("Perpendicular component", font_size=26, color=RED)
        perp_text.to_edge(DOWN, buff=0.5)
        self.add_fixed_in_frame_mobjects(perp_text)
        self.play(Write(perp_text))
        self.wait(0.5)

        # Perpendicular component
        v_perp_coords = v_coords - v_proj_coords
        v_perp_arrow = Arrow3D(
            start=axes.c2p(*v_proj_coords),
            end=axes.c2p(*v_coords),
            color=RED,
            thickness=0.03,
            height=0.3,
            base_radius=0.15
        )

        v_perp_label = MathTex(r"\vec{v}_{\perp}", font_size=32, color=RED)
        v_perp_label.next_to(axes.c2p(*v_coords), UP)
        self.add_fixed_orientation_mobjects(v_perp_label)

        self.play(
            FadeOut(projection_line),
            Create(v_perp_arrow),
            Write(v_perp_label),
            run_time=1.2
        )
        self.wait(1.5)

        # SECTION 8: Show the decomposition
        self.play(FadeOut(perp_text), run_time=0.3)

        decomp_text = Text("Decomposition", font_size=26, color=YELLOW)
        decomp_text.to_edge(DOWN, buff=0.5)
        self.add_fixed_in_frame_mobjects(decomp_text)
        self.play(Write(decomp_text))
        self.wait(0.5)

        # Flash the components
        self.play(
            Flash(v_proj_arrow, color=GREEN, line_length=0.3),
            Flash(v_perp_arrow, color=RED, line_length=0.3),
            run_time=1
        )
        self.wait(0.5)

        # Show equation
        equation = MathTex(
            r"\vec{v} = \vec{v}_{\parallel} + \vec{v}_{\perp}",
            font_size=32
        )
        equation.to_edge(DOWN, buff=1.5)
        self.add_fixed_in_frame_mobjects(equation)

        self.play(
            FadeOut(decomp_text),
            Write(equation),
            run_time=1
        )
        self.wait(2)

        # SECTION 9: Rotate to show from different angles
        rotate_again = Text("Different angle", font_size=24, color=BLUE_B)
        rotate_again.to_edge(DOWN, buff=0.5)
        self.add_fixed_in_frame_mobjects(rotate_again)
        self.play(Write(rotate_again))

        self.move_camera(phi=45 * DEGREES, theta=70 * DEGREES, run_time=2)
        self.wait(1)
        self.move_camera(phi=80 * DEGREES, theta=120 * DEGREES, run_time=2)
        self.wait(1)
        self.move_camera(phi=70 * DEGREES, theta=45 * DEGREES, run_time=1.5)
        self.wait(1)

        # SECTION 10: Final insight
        self.play(
            FadeOut(VGroup(equation, rotate_again)),
            run_time=0.5
        )

        insight = VGroup(
            Text("The projection is the 'shadow'", font_size=24),
            Text("of the vector on the plane!", font_size=24, weight=BOLD)
        )
        insight.arrange(DOWN, buff=0.15)
        insight.to_edge(DOWN, buff=0.5)
        self.add_fixed_in_frame_mobjects(insight)

        self.play(Write(insight), run_time=1.2)
        self.wait(2)

        # Final rotation
        self.begin_ambient_camera_rotation(rate=0.2)
        self.wait(4)
        self.stop_ambient_camera_rotation()


class ProjectionFormula(ThreeDScene):
    """Show the general formula for projection onto a plane"""

    def construct(self):
        title = Text("Projection Formula", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.add_fixed_in_frame_mobjects(title)
        self.play(Write(title))
        self.wait(0.5)

        # SECTION 1: Setup scene
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
        self.wait(0.5)

        # Plane with normal vector
        plane = Surface(
            lambda u, v: axes.c2p(u, v, 0),
            u_range=[-2, 2],
            v_range=[-2, 2],
            fill_color=BLUE,
            fill_opacity=0.3,
            stroke_color=BLUE,
            checkerboard_colors=[BLUE_D, BLUE_E],
            resolution=(8, 8)
        )

        # Normal vector to the plane
        n_coords = np.array([0, 0, 1.5])
        n_arrow = Arrow3D(
            start=axes.c2p(0, 0, 0),
            end=axes.c2p(*n_coords),
            color=PURPLE,
            thickness=0.03,
            height=0.3,
            base_radius=0.15
        )

        n_label = MathTex(r"\vec{n}", font_size=32, color=PURPLE)
        n_label.next_to(axes.c2p(*n_coords), UP)
        self.add_fixed_orientation_mobjects(n_label)

        normal_text = Text("Plane normal", font_size=24, color=PURPLE)
        normal_text.to_edge(DOWN, buff=0.5)
        self.add_fixed_in_frame_mobjects(normal_text)

        self.play(Create(plane), run_time=1)
        self.play(
            Create(n_arrow),
            Write(n_label),
            Write(normal_text),
            run_time=1.2
        )
        self.wait(1.5)

        # SECTION 2: Show the formula
        self.play(FadeOut(normal_text), run_time=0.3)

        formula_title = Text("The Formula:", font_size=28, color=YELLOW)
        formula_title.to_edge(DOWN, buff=2.2)
        self.add_fixed_in_frame_mobjects(formula_title)
        self.play(Write(formula_title))
        self.wait(0.5)

        # Projection formula
        formula = MathTex(
            r"\vec{v}_{\parallel} = \vec{v} - \frac{\vec{v} \cdot \vec{n}}{|\vec{n}|^2} \vec{n}",
            font_size=28,
            color=GREEN
        )
        formula.to_edge(DOWN, buff=0.8)
        self.add_fixed_in_frame_mobjects(formula)

        self.play(Write(formula), run_time=1.5)
        self.wait(2)

        # Show breakdown
        breakdown = VGroup(
            Text("v · n = how much v points along n", font_size=20, color=BLUE_B),
            Text("We subtract that component!", font_size=20, color=BLUE_B)
        )
        breakdown.arrange(DOWN, aligned_edge=LEFT, buff=0.15)
        breakdown.to_edge(DOWN, buff=0.3)
        self.add_fixed_in_frame_mobjects(breakdown)

        self.play(
            FadeOut(VGroup(formula_title, formula)),
            Write(breakdown),
            run_time=1.2
        )
        self.wait(2)

        # Add a vector to demonstrate
        v_coords = np.array([1.5, 1, 1.2])
        v_arrow = Arrow3D(
            start=axes.c2p(0, 0, 0),
            end=axes.c2p(*v_coords),
            color=YELLOW,
            thickness=0.03,
            height=0.3,
            base_radius=0.15
        )

        self.play(
            FadeOut(breakdown),
            Create(v_arrow),
            run_time=1
        )
        self.wait(1)

        # Calculate and show projection
        n_unit = np.array([0, 0, 1])
        v_dot_n = np.dot(v_coords, n_unit)
        v_parallel = v_coords - v_dot_n * n_unit

        v_proj = Arrow3D(
            start=axes.c2p(0, 0, 0),
            end=axes.c2p(*v_parallel),
            color=GREEN,
            thickness=0.03,
            height=0.3,
            base_radius=0.15
        )

        result_text = Text("Result!", font_size=28, color=GREEN, weight=BOLD)
        result_text.to_edge(DOWN, buff=0.5)
        self.add_fixed_in_frame_mobjects(result_text)

        self.play(
            Create(v_proj),
            Write(result_text),
            Flash(v_proj, color=GREEN),
            run_time=1.5
        )
        self.wait(2)

        # Rotate view
        self.begin_ambient_camera_rotation(rate=0.25)
        self.wait(4)
        self.stop_ambient_camera_rotation()


class ProjectionAnimation(ThreeDScene):
    """Animated version showing multiple vectors projecting"""

    def construct(self):
        title = Text("Multiple Projections", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.add_fixed_in_frame_mobjects(title)
        self.play(Write(title))
        self.wait(0.5)

        # Setup
        axes = ThreeDAxes(
            x_range=[-3, 3, 1],
            y_range=[-3, 3, 1],
            z_range=[-3, 3, 1],
            x_length=6,
            y_length=6,
            z_length=6
        )

        plane = Surface(
            lambda u, v: axes.c2p(u, v, 0),
            u_range=[-2.5, 2.5],
            v_range=[-2.5, 2.5],
            fill_color=BLUE,
            fill_opacity=0.25,
            stroke_color=BLUE,
            checkerboard_colors=[BLUE_D, BLUE_E],
            resolution=(10, 10)
        )

        self.set_camera_orientation(phi=65 * DEGREES, theta=50 * DEGREES)
        self.play(Create(axes), Create(plane), run_time=1.2)
        self.wait(0.5)

        # Multiple vectors
        vectors_3d = [
            np.array([2, 1, 1.5]),
            np.array([-1.5, 1.5, 1]),
            np.array([1, -1.5, 2]),
            np.array([-1, -1, 1.2])
        ]

        for v_coords in vectors_3d:
            # Original vector
            v_arrow = Arrow3D(
                start=axes.c2p(0, 0, 0),
                end=axes.c2p(*v_coords),
                color=YELLOW,
                thickness=0.025,
                height=0.25,
                base_radius=0.12
            )

            # Projection
            v_proj_coords = np.array([v_coords[0], v_coords[1], 0])
            v_proj_arrow = Arrow3D(
                start=axes.c2p(0, 0, 0),
                end=axes.c2p(*v_proj_coords),
                color=GREEN,
                thickness=0.025,
                height=0.25,
                base_radius=0.12
            )

            # Connecting line
            proj_line = DashedLine3D(
                start=axes.c2p(*v_coords),
                end=axes.c2p(*v_proj_coords),
                color=WHITE,
                dash_length=0.08
            )

            self.play(Create(v_arrow), run_time=0.5)
            self.play(Create(proj_line), run_time=0.4)
            self.play(Create(v_proj_arrow), run_time=0.5)
            self.wait(0.3)

        # Rotate to show all projections
        self.begin_ambient_camera_rotation(rate=0.3)
        self.wait(5)
        self.stop_ambient_camera_rotation()
