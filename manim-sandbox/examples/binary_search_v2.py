"""
Binary Search Visualization (Two-Layer Generated)
Generated using the two-layer prompting approach for Juliette

Animation Script Parameters:
- Array: [2, 5, 8, 12, 16, 23, 38, 45, 56, 67, 78]
- Target: 45
- Emphasis: Halving search space, O(log n) efficiency

Render command:
  docker-compose run --rm manim manim -ql examples/binary_search_v2.py BinarySearchV2
"""

from manim import *


class BinarySearchV2(Scene):
    def construct(self):
        # Story Beat 1: Display title and sorted array
        title = Text("Binary Search", font_size=52, color=YELLOW)
        self.play(Write(title))
        self.wait(0.5)
        self.play(title.animate.scale(0.6).to_edge(UP))

        # Target display
        target_val = 45
        target_text = Text(f"Target: {target_val}", font_size=36, color=YELLOW)
        target_text.next_to(title, DOWN)
        self.play(FadeIn(target_text, shift=DOWN))
        self.wait(0.5)

        # Array setup
        array_values = [2, 5, 8, 12, 16, 23, 38, 45, 56, 67, 78]
        box_size = 0.65
        start_x = -5.5

        # Create array boxes
        boxes = VGroup()
        value_labels = VGroup()
        index_labels = VGroup()

        for i, val in enumerate(array_values):
            # Box
            box = Square(side_length=box_size, color=BLUE, stroke_width=2)
            box.shift(RIGHT * (start_x + i * box_size))
            boxes.add(box)

            # Value
            val_label = Text(str(val), font_size=22)
            val_label.move_to(box.get_center())
            value_labels.add(val_label)

            # Index
            idx_label = Text(str(i), font_size=14, color=GRAY)
            idx_label.next_to(box, DOWN, buff=0.08)
            index_labels.add(idx_label)

        array_group = VGroup(boxes, value_labels, index_labels)
        array_group.shift(DOWN * 0.8)

        # Animate array creation
        self.play(
            LaggedStart(
                *[FadeIn(box, shift=UP) for box in boxes],
                lag_ratio=0.05
            ),
            run_time=1.5
        )
        self.play(Write(value_labels), Write(index_labels))
        self.wait(1)

        # Story Beat 2: Show left and right pointers
        left = 0
        right = len(array_values) - 1

        left_arrow = Arrow(ORIGIN, DOWN * 0.4, color=GREEN, buff=0.05)
        left_arrow.next_to(boxes[left], UP, buff=0.1)
        left_label = Text("L", font_size=24, color=GREEN, weight=BOLD)
        left_label.next_to(left_arrow, UP, buff=0.05)

        right_arrow = Arrow(ORIGIN, DOWN * 0.4, color=RED, buff=0.05)
        right_arrow.next_to(boxes[right], UP, buff=0.1)
        right_label = Text("R", font_size=24, color=RED, weight=BOLD)
        right_label.next_to(right_arrow, UP, buff=0.05)

        self.play(
            GrowArrow(left_arrow),
            Write(left_label),
            GrowArrow(right_arrow),
            Write(right_label)
        )
        self.wait(0.8)

        # Binary search loop
        step_num = 0
        while left <= right:
            step_num += 1
            mid = (left + right) // 2

            # Story Beat 3: Calculate and highlight middle
            calc = Text(
                f"Step {step_num}: mid = ({left} + {right}) ÷ 2 = {mid}",
                font_size=24,
                color=BLUE_C
            )
            calc.to_edge(DOWN, buff=0.5)
            self.play(Write(calc), run_time=0.7)

            # Middle pointer
            mid_arrow = Arrow(ORIGIN, DOWN * 0.4, color=YELLOW, buff=0.05)
            mid_arrow.next_to(boxes[mid], UP, buff=0.1)
            mid_label = Text("M", font_size=24, color=YELLOW, weight=BOLD)
            mid_label.next_to(mid_arrow, UP, buff=0.05)

            self.play(
                GrowArrow(mid_arrow),
                Write(mid_label),
                boxes[mid].animate.set_fill(YELLOW, opacity=0.3),
                run_time=0.6
            )
            self.wait(0.5)

            # Story Beat 4: Compare
            comparison = Text(
                f"Compare: {array_values[mid]} {'=' if array_values[mid] == target_val else '<' if array_values[mid] < target_val else '>'} {target_val}",
                font_size=26,
                color=WHITE
            )
            comparison.next_to(calc, UP, buff=0.15)
            self.play(Write(comparison), run_time=0.7)
            self.wait(0.8)

            if array_values[mid] == target_val:
                # Story Beat 8: FOUND!
                # Flash the box
                self.play(
                    boxes[mid].animate.set_fill(GREEN, opacity=0.6),
                    boxes[mid].animate.set_stroke(GREEN, width=4),
                    value_labels[mid].animate.set_color(BLACK).scale(1.3),
                    run_time=0.5
                )

                # Success message
                success = Text("FOUND!", font_size=56, color=GREEN, weight=BOLD)
                success.move_to(ORIGIN + UP * 2.2)
                checkmark = Text("✓", font_size=64, color=GREEN)
                checkmark.next_to(success, LEFT)

                self.play(
                    Write(success),
                    FadeIn(checkmark, scale=0.5),
                    Flash(boxes[mid].get_center(), color=GREEN, line_length=0.5),
                    run_time=1
                )
                self.wait(1.5)

                # Summary
                summary = Text(
                    f"Found in {step_num} step{'s' if step_num > 1 else ''}! (O(log n))",
                    font_size=28,
                    color=BLUE_B
                )
                summary.next_to(comparison, UP, buff=0.3)
                self.play(Write(summary), run_time=0.8)
                self.wait(2)
                break

            elif array_values[mid] < target_val:
                # Story Beat 5: Target is larger, search right half
                direction = Text(
                    "Target is larger → Search right half",
                    font_size=22,
                    color=RED_C
                )
                direction.next_to(comparison, UP, buff=0.15)
                self.play(Write(direction), run_time=0.6)
                self.wait(0.6)

                # Fade out left half
                fade_anims = []
                for i in range(left, mid + 1):
                    fade_anims.extend([
                        boxes[i].animate.set_opacity(0.15),
                        value_labels[i].animate.set_opacity(0.15),
                        index_labels[i].animate.set_opacity(0.15)
                    ])

                self.play(*fade_anims, run_time=0.8)

                # Update left pointer
                left = mid + 1
                self.play(
                    left_arrow.animate.next_to(boxes[left], UP, buff=0.1),
                    left_label.animate.next_to(boxes[left], UP, buff=0.55),
                    run_time=0.5
                )

            else:
                # Story Beat 6: Target is smaller, search left half
                direction = Text(
                    "Target is smaller → Search left half",
                    font_size=22,
                    color=RED_C
                )
                direction.next_to(comparison, UP, buff=0.15)
                self.play(Write(direction), run_time=0.6)
                self.wait(0.6)

                # Fade out right half
                fade_anims = []
                for i in range(mid, right + 1):
                    fade_anims.extend([
                        boxes[i].animate.set_opacity(0.15),
                        value_labels[i].animate.set_opacity(0.15),
                        index_labels[i].animate.set_opacity(0.15)
                    ])

                self.play(*fade_anims, run_time=0.8)

                # Update right pointer
                right = mid - 1
                self.play(
                    right_arrow.animate.next_to(boxes[right], UP, buff=0.1),
                    right_label.animate.next_to(boxes[right], UP, buff=0.55),
                    run_time=0.5
                )

            # Clean up for next iteration
            self.play(
                FadeOut(mid_arrow),
                FadeOut(mid_label),
                FadeOut(calc),
                FadeOut(comparison),
                FadeOut(direction) if 'direction' in locals() else Wait(0),
                boxes[mid].animate.set_fill(opacity=0),
                run_time=0.4
            )
            self.wait(0.3)


class ComparisonScene(Scene):
    """Show why binary search is efficient"""

    def construct(self):
        title = Text("Why Binary Search?", font_size=48)
        self.play(Write(title))
        self.wait(0.5)
        self.play(title.animate.to_edge(UP))

        # Comparison
        left_title = Text("Linear Search", font_size=32, color=RED)
        left_title.shift(LEFT * 3 + UP * 1.5)

        right_title = Text("Binary Search", font_size=32, color=GREEN)
        right_title.shift(RIGHT * 3 + UP * 1.5)

        self.play(Write(left_title), Write(right_title))
        self.wait(0.5)

        # Stats
        sizes = [100, 1000, 10000, 1000000]

        comparisons = VGroup()
        for i, n in enumerate(sizes):
            import math
            linear = n
            binary = math.ceil(math.log2(n))

            row = VGroup(
                Text(f"n = {n:,}", font_size=24, color=BLUE),
                Text(f"{linear:,} steps", font_size=22, color=RED).shift(LEFT * 3),
                Text(f"{binary} steps", font_size=22, color=GREEN).shift(RIGHT * 3)
            )
            row.arrange(RIGHT, buff=1.5)
            comparisons.add(row)

        comparisons.arrange(DOWN, buff=0.5)
        comparisons.shift(DOWN * 0.5)

        self.play(LaggedStart(
            *[Write(row) for row in comparisons],
            lag_ratio=0.3
        ), run_time=3)

        self.wait(2)
