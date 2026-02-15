"""
Binary Search Visualization
Shows how binary search efficiently finds an element in a sorted array

Render command:
  docker-compose run --rm manim manim -ql examples/binary_search.py BinarySearchDemo
"""

from manim import *


class BinarySearchDemo(Scene):
    def construct(self):
        # Title
        title = Text("Binary Search", font_size=48)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Create sorted array
        array_values = [2, 5, 8, 12, 16, 23, 38, 45, 56, 67, 78]
        target = 23

        # Subtitle
        subtitle = Text(f"Find: {target}", font_size=36, color=YELLOW)
        subtitle.next_to(title, DOWN)
        self.play(FadeIn(subtitle))
        self.wait(0.5)

        # Draw array
        boxes = VGroup()
        labels = VGroup()

        box_width = 0.7
        start_x = -5

        for i, val in enumerate(array_values):
            # Box
            box = Square(side_length=box_width, color=BLUE)
            box.shift(RIGHT * (start_x + i * box_width))

            # Value label
            label = Text(str(val), font_size=24)
            label.move_to(box.get_center())

            # Index label
            index_label = Text(str(i), font_size=16, color=GRAY)
            index_label.next_to(box, DOWN, buff=0.1)

            boxes.add(box)
            labels.add(VGroup(label, index_label))

        array_group = VGroup(boxes, labels)
        array_group.shift(DOWN * 0.5)

        self.play(Create(boxes), Write(labels))
        self.wait(1)

        # Binary search steps
        left = 0
        right = len(array_values) - 1
        steps = 0

        # Pointers
        left_arrow = Arrow(ORIGIN, DOWN * 0.5, color=GREEN, buff=0.1)
        left_arrow.next_to(boxes[left], UP, buff=0.1)
        left_label = Text("L", font_size=20, color=GREEN)
        left_label.next_to(left_arrow, UP, buff=0.1)

        right_arrow = Arrow(ORIGIN, DOWN * 0.5, color=RED, buff=0.1)
        right_arrow.next_to(boxes[right], UP, buff=0.1)
        right_label = Text("R", font_size=20, color=RED)
        right_label.next_to(right_arrow, UP, buff=0.1)

        self.play(
            GrowArrow(left_arrow),
            Write(left_label),
            GrowArrow(right_arrow),
            Write(right_label)
        )
        self.wait(1)

        # Search loop
        while left <= right:
            steps += 1
            mid = (left + right) // 2

            # Show middle calculation
            calc_text = Text(
                f"Step {steps}: mid = ({left} + {right}) // 2 = {mid}",
                font_size=24,
                color=YELLOW
            )
            calc_text.to_edge(DOWN, buff=0.5)
            self.play(Write(calc_text))

            # Highlight middle element
            mid_arrow = Arrow(ORIGIN, DOWN * 0.5, color=YELLOW, buff=0.1)
            mid_arrow.next_to(boxes[mid], UP, buff=0.1)
            mid_label = Text("M", font_size=20, color=YELLOW)
            mid_label.next_to(mid_arrow, UP, buff=0.1)

            self.play(
                GrowArrow(mid_arrow),
                Write(mid_label),
                boxes[mid].animate.set_fill(YELLOW, opacity=0.3)
            )
            self.wait(1)

            # Compare
            comparison = Text(
                f"Compare: {array_values[mid]} vs {target}",
                font_size=24,
                color=BLUE
            )
            comparison.next_to(calc_text, UP, buff=0.2)
            self.play(Write(comparison))
            self.wait(1)

            if array_values[mid] == target:
                # Found!
                success = Text("FOUND!", font_size=48, color=GREEN)
                success.move_to(ORIGIN + UP * 1.5)

                self.play(
                    boxes[mid].animate.set_fill(GREEN, opacity=0.5),
                    Write(success)
                )
                self.wait(2)
                break

            elif array_values[mid] < target:
                # Search right half
                direction = Text("Target is larger → Search right half", font_size=20, color=RED)
                direction.next_to(comparison, UP, buff=0.2)
                self.play(Write(direction))
                self.wait(1)

                # Fade out left half
                for i in range(left, mid + 1):
                    self.play(
                        boxes[i].animate.set_opacity(0.2),
                        labels[i].animate.set_opacity(0.2),
                        run_time=0.1
                    )

                left = mid + 1

                # Move left pointer
                self.play(
                    left_arrow.animate.next_to(boxes[left], UP, buff=0.1),
                    left_label.animate.next_to(boxes[left], UP, buff=0.6),
                    run_time=0.5
                )

            else:
                # Search left half
                direction = Text("Target is smaller → Search left half", font_size=20, color=RED)
                direction.next_to(comparison, UP, buff=0.2)
                self.play(Write(direction))
                self.wait(1)

                # Fade out right half
                for i in range(mid, right + 1):
                    self.play(
                        boxes[i].animate.set_opacity(0.2),
                        labels[i].animate.set_opacity(0.2),
                        run_time=0.1
                    )

                right = mid - 1

                # Move right pointer
                self.play(
                    right_arrow.animate.next_to(boxes[right], UP, buff=0.1),
                    right_label.animate.next_to(boxes[right], UP, buff=0.6),
                    run_time=0.5
                )

            # Clean up for next iteration
            self.play(
                FadeOut(mid_arrow),
                FadeOut(mid_label),
                FadeOut(calc_text),
                FadeOut(comparison),
                run_time=0.3
            )
            if 'direction' in locals():
                self.play(FadeOut(direction), run_time=0.3)

            self.wait(0.5)

        # Summary
        summary = Text(
            f"Time Complexity: O(log n) - Found in {steps} steps!",
            font_size=28,
            color=BLUE
        )
        summary.to_edge(DOWN)
        self.play(Write(summary))
        self.wait(3)


class BinarySearchComparison(Scene):
    """Compare binary search vs linear search"""

    def construct(self):
        title = Text("Binary Search vs Linear Search", font_size=40)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Array size
        n_values = [10, 100, 1000, 10000]

        # Create comparison table
        table_data = [
            ["Array Size", "Linear Search", "Binary Search"],
            ["10", "10 ops", "4 ops"],
            ["100", "100 ops", "7 ops"],
            ["1,000", "1,000 ops", "10 ops"],
            ["10,000", "10,000 ops", "14 ops"],
        ]

        table = VGroup()
        row_height = 0.6
        col_widths = [2, 2.5, 2.5]

        for i, row in enumerate(table_data):
            row_group = VGroup()
            x_offset = -3

            for j, cell in enumerate(row):
                # Cell box
                cell_box = Rectangle(
                    width=col_widths[j],
                    height=row_height,
                    color=WHITE if i == 0 else BLUE
                )
                cell_box.shift(RIGHT * x_offset)

                # Cell text
                cell_text = Text(
                    cell,
                    font_size=20 if i == 0 else 18,
                    color=YELLOW if i == 0 else WHITE
                )
                cell_text.move_to(cell_box.get_center())

                row_group.add(VGroup(cell_box, cell_text))
                x_offset += col_widths[j]

            row_group.shift(DOWN * (i * row_height + 1))
            table.add(row_group)

        self.play(Create(table), run_time=2)
        self.wait(2)

        # Key insight
        insight = Text(
            "Binary search is exponentially faster!",
            font_size=32,
            color=GREEN
        )
        insight.to_edge(DOWN)
        self.play(Write(insight))
        self.wait(3)
