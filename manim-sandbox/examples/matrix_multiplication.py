"""
Matrix Multiplication Visualization
Two-layer generated with proper spatial layout

Shows: A × B = C with step-by-step dot products
Example: [[2,3], [1,4]] × [[5,1], [2,3]] = [[16,11], [13,13]]

Render command:
  docker-compose run --rm manim manim -ql examples/matrix_multiplication.py MatrixMultiplication
"""

from manim import *


class MatrixMultiplication(Scene):
    def construct(self):
        # Colors
        A_COLOR = BLUE
        B_COLOR = GREEN
        C_COLOR = YELLOW
        HIGHLIGHT_COLOR = RED

        # Data
        A_data = [[2, 3], [1, 4]]
        B_data = [[5, 1], [2, 3]]
        C_data = [[16, 11], [13, 13]]

        # SECTION 1: Title and Setup
        title = Text("Matrix Multiplication", font_size=42, weight=BOLD)
        title.to_edge(UP, buff=0.4)

        self.play(Write(title))
        self.wait(0.5)

        # Create matrices with proper spacing
        A_matrix = Matrix(A_data, h_buff=0.8)
        A_matrix.set_color(A_COLOR)
        A_label = MathTex("A", color=A_COLOR, font_size=36)
        A_group = VGroup(A_label, A_matrix).arrange(RIGHT, buff=0.3)

        times = MathTex(r"\times", font_size=36)

        B_matrix = Matrix(B_data, h_buff=0.8)
        B_matrix.set_color(B_COLOR)
        B_label = MathTex("B", color=B_COLOR, font_size=36)
        B_group = VGroup(B_label, B_matrix).arrange(RIGHT, buff=0.3)

        equals = MathTex("=", font_size=36)

        C_matrix = Matrix([[0, 0], [0, 0]], h_buff=0.8)  # Start with zeros
        C_matrix.set_color(C_COLOR)
        C_label = MathTex("C", color=C_COLOR, font_size=36)
        C_group = VGroup(C_label, C_matrix).arrange(RIGHT, buff=0.3)

        # Arrange all matrices horizontally with proper spacing
        equation = VGroup(A_group, times, B_group, equals, C_group)
        equation.arrange(RIGHT, buff=0.4)
        equation.next_to(title, DOWN, buff=0.8)

        # Scale to fit if needed
        if equation.width > 12:
            equation.scale_to_fit_width(11.5)

        self.play(
            LaggedStart(
                FadeIn(A_group, shift=DOWN),
                Write(times),
                FadeIn(B_group, shift=DOWN),
                Write(equals),
                FadeIn(C_group, shift=DOWN),
                lag_ratio=0.2
            ),
            run_time=2
        )
        self.wait(1)

        # SECTION 2: Explain the rule
        rule = Text(
            "C[i,j] = row i of A · column j of B",
            font_size=24,
            color=WHITE
        )
        rule.to_edge(DOWN, buff=0.5)

        self.play(Write(rule))
        self.wait(1.5)

        # SECTION 3: Calculate each element
        calculations = [
            (0, 0, [0, 0], [0, 1]),  # C[0,0]: row 0 of A, col 0 of B
            (0, 1, [0, 0], [1, 1]),  # C[0,1]: row 0 of A, col 1 of B
            (1, 0, [1, 0], [0, 1]),  # C[1,0]: row 1 of A, col 0 of B
            (1, 1, [1, 0], [1, 1]),  # C[1,1]: row 1 of A, col 1 of B
        ]

        for c_row, c_col, a_indices, b_indices in calculations:
            self.calculate_element(
                A_matrix, B_matrix, C_matrix,
                A_data, B_data, C_data,
                c_row, c_col, a_indices, b_indices,
                rule
            )

        # SECTION 4: Show complete result
        self.play(FadeOut(rule), run_time=0.5)

        success = Text("Complete!", font_size=32, color=GREEN, weight=BOLD)
        success.to_edge(DOWN, buff=0.5)

        self.play(
            Write(success),
            Circumscribe(C_group, color=YELLOW, buff=0.1),
            run_time=1.2
        )
        self.wait(1)

        # SECTION 5: General formula
        self.play(FadeOut(success), run_time=0.4)

        formula = MathTex(
            r"(A \times B)_{ij} = \sum_{k} A_{ik} \cdot B_{kj}",
            font_size=32
        )
        formula.to_edge(DOWN, buff=0.5)

        self.play(Write(formula))
        self.wait(2)

    def calculate_element(self, A_mat, B_mat, C_mat, A_data, B_data, C_data,
                         c_row, c_col, a_indices, b_indices, rule_text):
        """Calculate one element of C with step-by-step visualization"""

        # Highlight row in A and column in B
        a_row_rect = SurroundingRectangle(
            VGroup(*[A_mat.get_entries()[i] for i in a_indices]),
            color=RED,
            buff=0.1
        )
        b_col_rect = SurroundingRectangle(
            VGroup(*[B_mat.get_entries()[i] for i in b_indices]),
            color=RED,
            buff=0.1
        )

        self.play(
            Create(a_row_rect),
            Create(b_col_rect),
            run_time=0.5
        )
        self.wait(0.5)

        # Show calculation in workspace (clear area)
        a_row = [A_data[c_row][k] for k in range(len(A_data[0]))]
        b_col = [B_data[k][c_col] for k in range(len(B_data))]

        # Build calculation step by step
        calc_parts = []
        for i, (a_val, b_val) in enumerate(zip(a_row, b_col)):
            if i > 0:
                calc_parts.append("+")
            calc_parts.append(f"({a_val}×{b_val})")

        calc_str = " ".join(calc_parts)
        result_val = C_data[c_row][c_col]

        calculation = VGroup(
            Text(f"C[{c_row},{c_col}] = {calc_str}", font_size=22),
            Text(f"= {result_val}", font_size=22, color=YELLOW)
        )
        calculation.arrange(DOWN, buff=0.2)

        # Position below rule text with safe spacing
        calculation.next_to(rule_text, UP, buff=0.4)

        self.play(Write(calculation[0]), run_time=0.8)
        self.wait(0.5)
        self.play(Write(calculation[1]), run_time=0.6)
        self.wait(0.5)

        # Update C matrix entry
        c_entry_index = c_row * len(C_data[0]) + c_col
        new_entry = Integer(result_val, color=YELLOW)
        new_entry.move_to(C_mat.get_entries()[c_entry_index])

        self.play(
            Transform(C_mat.get_entries()[c_entry_index], new_entry),
            Flash(C_mat.get_entries()[c_entry_index], color=YELLOW),
            run_time=0.6
        )
        self.wait(0.5)

        # Clean up
        self.play(
            FadeOut(a_row_rect),
            FadeOut(b_col_rect),
            FadeOut(calculation),
            run_time=0.4
        )
        self.wait(0.3)


class MatrixDimensions(Scene):
    """Explain matrix multiplication dimensions"""

    def construct(self):
        title = Text("Matrix Dimensions Rule", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title))
        self.wait(0.5)

        # Show dimension rule
        rule = VGroup(
            MathTex(r"(m \times n) \times (n \times p) = (m \times p)", font_size=36),
            Text("Inner dimensions must match!", font_size=28, color=RED)
        )
        rule.arrange(DOWN, buff=0.5)
        rule.next_to(title, DOWN, buff=0.8)

        self.play(Write(rule[0]))
        self.wait(1)
        self.play(Write(rule[1]))
        self.wait(1)

        # Examples
        examples_title = Text("Examples:", font_size=32, color=BLUE_B)
        examples_title.next_to(rule, DOWN, buff=0.8)

        examples = VGroup(
            VGroup(
                Text("(2×3) × (3×4) = (2×4)", font_size=24, color=GREEN),
                Text("✓ Valid", font_size=20, color=GREEN, weight=BOLD)
            ).arrange(RIGHT, buff=0.5),
            VGroup(
                Text("(2×3) × (2×4) = ???", font_size=24, color=RED),
                Text("✗ Invalid", font_size=20, color=RED, weight=BOLD)
            ).arrange(RIGHT, buff=0.5),
            VGroup(
                Text("(3×2) × (2×5) = (3×5)", font_size=24, color=GREEN),
                Text("✓ Valid", font_size=20, color=GREEN, weight=BOLD)
            ).arrange(RIGHT, buff=0.5)
        )
        examples.arrange(DOWN, aligned_edge=LEFT, buff=0.4)
        examples.next_to(examples_title, DOWN, buff=0.5)

        self.play(Write(examples_title))
        self.wait(0.5)

        for example in examples:
            self.play(
                LaggedStart(
                    Write(example[0]),
                    FadeIn(example[1], scale=0.5),
                    lag_ratio=0.3
                ),
                run_time=1
            )
            self.wait(0.8)

        self.wait(2)


class MatrixVisualization3D(Scene):
    """Show why matrix multiplication works - geometric interpretation"""

    def construct(self):
        title = Text("Why Matrix Multiplication?", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title))
        self.wait(0.5)

        subtitle = Text(
            "Matrices represent transformations",
            font_size=28,
            color=BLUE_B
        )
        subtitle.next_to(title, DOWN, buff=0.5)
        self.play(Write(subtitle))
        self.wait(1)

        # Show transformation concept
        concepts = VGroup(
            Text("• Rotation", font_size=26),
            Text("• Scaling", font_size=26),
            Text("• Shearing", font_size=26),
            Text("• Projection", font_size=26)
        )
        concepts.arrange(DOWN, aligned_edge=LEFT, buff=0.3)
        concepts.next_to(subtitle, DOWN, buff=0.8)

        self.play(LaggedStart(
            *[FadeIn(concept, shift=RIGHT) for concept in concepts],
            lag_ratio=0.3
        ), run_time=2)
        self.wait(1)

        # Show composition
        self.play(
            FadeOut(VGroup(subtitle, concepts)),
            run_time=0.5
        )

        composition = VGroup(
            Text("Multiplying matrices = ", font_size=28),
            Text("Composing transformations", font_size=28, color=YELLOW, weight=BOLD)
        )
        composition.arrange(DOWN, buff=0.3)
        composition.next_to(title, DOWN, buff=1)

        self.play(Write(composition), run_time=1.5)
        self.wait(2)

        # Example
        example = VGroup(
            MathTex(r"Rotate \times Scale = RotateAndScale", font_size=32),
            Text("Apply transformations right to left!", font_size=24, color=RED)
        )
        example.arrange(DOWN, buff=0.4)
        example.next_to(composition, DOWN, buff=1)

        self.play(Write(example))
        self.wait(3)
