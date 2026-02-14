"""
Matrix Multiplication - IMPROVED VERSION
Much clearer visualization with better highlighting and flow

Key improvements:
- Larger, clearer matrices
- Better color coding and highlighting
- Smoother animations
- Visual dot product representation
- Cleaner layout

Render command:
  docker-compose run --rm manim manim -ql examples/matmul_v2.py MatMulV2
"""

from manim import *


class MatMulV2(Scene):
    def construct(self):
        # SECTION 1: Title
        title = Text("Matrix Multiplication", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title), run_time=0.8)
        self.wait(0.5)

        # SECTION 2: Show the matrices - BIGGER and CLEARER
        A_vals = [[2, 3], [1, 4]]
        B_vals = [[5, 1], [2, 3]]

        # Create matrices with better spacing
        A = IntegerMatrix(A_vals, element_to_mobject_config={"font_size": 48})
        A.set_color(BLUE)

        B = IntegerMatrix(B_vals, element_to_mobject_config={"font_size": 48})
        B.set_color(GREEN)

        # Result matrix - start empty
        C = IntegerMatrix([[0, 0], [0, 0]], element_to_mobject_config={"font_size": 48})
        C.set_color(YELLOW)

        # Labels
        A_label = MathTex("A", font_size=40, color=BLUE).next_to(A, LEFT)
        B_label = MathTex("B", font_size=40, color=GREEN).next_to(B, LEFT)
        C_label = MathTex("C", font_size=40, color=YELLOW).next_to(C, LEFT)

        # Position matrices
        A_group = VGroup(A_label, A).arrange(RIGHT, buff=0.3)
        B_group = VGroup(B_label, B).arrange(RIGHT, buff=0.3)
        C_group = VGroup(C_label, C).arrange(RIGHT, buff=0.3)

        # Layout: A and B on top, C below
        top_row = VGroup(A_group, MathTex(r"\times", font_size=40), B_group)
        top_row.arrange(RIGHT, buff=0.5)
        top_row.next_to(title, DOWN, buff=0.7)

        equals = MathTex("=", font_size=40)
        equals.next_to(top_row, DOWN, buff=0.5)

        C_group.next_to(equals, DOWN, buff=0.3)

        # Show matrices
        self.play(
            FadeIn(A_group, shift=DOWN),
            FadeIn(top_row[1]),
            FadeIn(B_group, shift=DOWN),
            run_time=1
        )
        self.wait(0.8)

        self.play(Write(equals))
        self.play(FadeIn(C_group, shift=DOWN))
        self.wait(1)

        # SECTION 3: Show the pattern once
        pattern = Text("Row × Column = Element", font_size=28, color=YELLOW)
        pattern.to_edge(DOWN, buff=0.4)
        self.play(Write(pattern))
        self.wait(1)

        # SECTION 4: Calculate each element with CLEAR visualization
        positions = [(0, 0), (0, 1), (1, 0), (1, 1)]

        for row, col in positions:
            self.calc_element_visual(
                A, B, C, A_vals, B_vals,
                row, col, pattern
            )

        # SECTION 5: Final result celebration
        self.play(FadeOut(pattern))

        final_text = Text("Result!", font_size=36, color=GREEN, weight=BOLD)
        final_text.to_edge(DOWN, buff=0.4)

        self.play(
            Write(final_text),
            C.animate.set_color(GREEN),
            Flash(C, color=GREEN, line_length=0.5),
            run_time=1.2
        )
        self.wait(2)

    def calc_element_visual(self, A, B, C, A_vals, B_vals, i, j, pattern_text):
        """Calculate C[i,j] with VISUAL dot product"""

        # Get the row and column values
        row_vals = A_vals[i]
        col_vals = [B_vals[k][j] for k in range(len(B_vals))]

        # HIGHLIGHT the row in A
        row_indices = [i * 2 + k for k in range(2)]
        row_boxes = VGroup(*[
            SurroundingRectangle(A.get_entries()[idx], color=RED, buff=0.1, stroke_width=4)
            for idx in row_indices
        ])

        # HIGHLIGHT the column in B
        col_indices = [k * 2 + j for k in range(2)]
        col_boxes = VGroup(*[
            SurroundingRectangle(B.get_entries()[idx], color=RED, buff=0.1, stroke_width=4)
            for idx in col_indices
        ])

        self.play(
            Create(row_boxes),
            Create(col_boxes),
            run_time=0.5
        )
        self.wait(0.4)

        # VISUAL calculation - show the multiplication
        calc_parts = []
        for k, (a_val, b_val) in enumerate(zip(row_vals, col_vals)):
            part = VGroup(
                Text(str(a_val), font_size=32, color=BLUE),
                MathTex(r"\times", font_size=28),
                Text(str(b_val), font_size=32, color=GREEN),
                MathTex("=", font_size=28),
                Text(str(a_val * b_val), font_size=32, color=YELLOW)
            ).arrange(RIGHT, buff=0.15)
            calc_parts.append(part)

        if len(calc_parts) > 1:
            plus = MathTex("+", font_size=32)
            calculation = VGroup(calc_parts[0], plus, calc_parts[1])
            calculation.arrange(RIGHT, buff=0.3)
        else:
            calculation = calc_parts[0]

        calculation.next_to(pattern_text, UP, buff=0.4)

        # Animate the calculation
        for part in calc_parts:
            self.play(FadeIn(part, shift=UP), run_time=0.4)
        if len(calc_parts) > 1:
            self.play(Write(plus), run_time=0.3)
        self.wait(0.5)

        # Show final sum
        result = sum(a * b for a, b in zip(row_vals, col_vals))
        result_text = VGroup(
            MathTex("=", font_size=32),
            Text(str(result), font_size=40, color=YELLOW, weight=BOLD)
        ).arrange(RIGHT, buff=0.2)
        result_text.next_to(calculation, RIGHT, buff=0.4)

        self.play(Write(result_text), run_time=0.5)
        self.wait(0.5)

        # UPDATE the result matrix
        c_idx = i * 2 + j
        new_val = Integer(result, font_size=48, color=YELLOW)
        new_val.move_to(C.get_entries()[c_idx])

        self.play(
            Transform(C.get_entries()[c_idx], new_val),
            Flash(C.get_entries()[c_idx], color=YELLOW),
            run_time=0.6
        )
        self.wait(0.4)

        # CLEAN UP
        self.play(
            FadeOut(row_boxes),
            FadeOut(col_boxes),
            FadeOut(calculation),
            FadeOut(result_text),
            run_time=0.4
        )
        self.wait(0.2)


class MatMulVisual(Scene):
    """Even more visual version - show the flow"""

    def construct(self):
        title = Text("Matrix Multiplication: The Visual Way", font_size=40)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.5)

        # Simple example
        A_vals = [[2, 3]]  # 1x2
        B_vals = [[4], [5]]  # 2x1

        A = IntegerMatrix(A_vals, element_to_mobject_config={"font_size": 48})
        A.set_color(BLUE)
        A_label = Text("A", font_size=36, color=BLUE).next_to(A, LEFT)

        B = IntegerMatrix(B_vals, element_to_mobject_config={"font_size": 48})
        B.set_color(GREEN)
        B_label = Text("B", font_size=36, color=GREEN).next_to(B, LEFT)

        # Position side by side
        A_group = VGroup(A_label, A).arrange(RIGHT, buff=0.3)
        times = MathTex(r"\times", font_size=36)
        B_group = VGroup(B_label, B).arrange(RIGHT, buff=0.3)

        equation = VGroup(A_group, times, B_group)
        equation.arrange(RIGHT, buff=0.5)
        equation.next_to(title, DOWN, buff=0.8)

        self.play(
            FadeIn(A_group, shift=RIGHT),
            Write(times),
            FadeIn(B_group, shift=LEFT),
            run_time=1.2
        )
        self.wait(1)

        # Show the DOT PRODUCT visually
        explanation = Text("Dot Product:", font_size=32, color=YELLOW)
        explanation.to_edge(DOWN, buff=2)
        self.play(Write(explanation))

        # Extract and show the values
        a_val1 = Text("2", font_size=48, color=BLUE).shift(LEFT * 2 + DOWN * 1)
        times1 = MathTex(r"\times", font_size=36).next_to(a_val1, RIGHT, buff=0.2)
        b_val1 = Text("4", font_size=48, color=GREEN).next_to(times1, RIGHT, buff=0.2)
        equals1 = MathTex("=", font_size=36).next_to(b_val1, RIGHT, buff=0.2)
        prod1 = Text("8", font_size=48, color=YELLOW).next_to(equals1, RIGHT, buff=0.2)

        line1 = VGroup(a_val1, times1, b_val1, equals1, prod1)
        line1.next_to(explanation, DOWN, buff=0.4)

        self.play(LaggedStart(
            *[FadeIn(item, scale=0.8) for item in line1],
            lag_ratio=0.15
        ), run_time=1.5)
        self.wait(0.5)

        # Second multiplication
        a_val2 = Text("3", font_size=48, color=BLUE).shift(LEFT * 2 + DOWN * 2)
        times2 = MathTex(r"\times", font_size=36).next_to(a_val2, RIGHT, buff=0.2)
        b_val2 = Text("5", font_size=48, color=GREEN).next_to(times2, RIGHT, buff=0.2)
        equals2 = MathTex("=", font_size=36).next_to(b_val2, RIGHT, buff=0.2)
        prod2 = Text("15", font_size=48, color=YELLOW).next_to(equals2, RIGHT, buff=0.2)

        line2 = VGroup(a_val2, times2, b_val2, equals2, prod2)
        line2.next_to(line1, DOWN, buff=0.3)

        self.play(LaggedStart(
            *[FadeIn(item, scale=0.8) for item in line2],
            lag_ratio=0.15
        ), run_time=1.5)
        self.wait(0.8)

        # Sum them up
        plus_sign = MathTex("+", font_size=40, color=WHITE)
        plus_sign.move_to((line1.get_bottom() + line2.get_top()) / 2 + LEFT * 3.5)

        self.play(Write(plus_sign))
        self.wait(0.5)

        # Final result
        final_calc = VGroup(
            Text("8", font_size=40, color=YELLOW),
            MathTex("+", font_size=36),
            Text("15", font_size=40, color=YELLOW),
            MathTex("=", font_size=36),
            Text("23", font_size=52, color=GREEN, weight=BOLD)
        ).arrange(RIGHT, buff=0.2)
        final_calc.next_to(line2, DOWN, buff=0.6)

        self.play(Write(final_calc), run_time=1.2)
        self.wait(0.5)

        # Show in result
        result_box = Rectangle(
            width=1.2, height=1.2,
            fill_color=GREEN, fill_opacity=0.3,
            stroke_color=GREEN, stroke_width=3
        )
        result_val = Text("23", font_size=48, color=GREEN, weight=BOLD)
        result = VGroup(result_box, result_val)
        result.next_to(equation, DOWN, buff=1)

        self.play(
            FadeIn(result, scale=0.5),
            Flash(result, color=GREEN),
            run_time=1
        )
        self.wait(2)
