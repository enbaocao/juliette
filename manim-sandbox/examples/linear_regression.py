"""
Linear Regression Visualization
Clear explanation of fitting a line to data points

Shows:
- Scatter plot with data points
- Multiple candidate lines
- Best fit line
- Residuals and squared errors
- The equation y = mx + b
- Goal: minimize sum of squared errors

Render command:
  docker-compose run --rm manim manim -ql examples/linear_regression.py LinearRegression
"""

from manim import *
import numpy as np


class LinearRegression(Scene):
    def construct(self):
        # SECTION 1: Title and Setup
        title = Text("Linear Regression", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.5)

        # SECTION 2: Show the data points
        subtitle = Text("Find the best line through the data", font_size=28, color=BLUE_B)
        subtitle.next_to(title, DOWN, buff=0.5)
        self.play(Write(subtitle))
        self.wait(0.8)

        # Create axes
        axes = Axes(
            x_range=[0, 10, 1],
            y_range=[0, 10, 1],
            x_length=7,
            y_length=5,
            axis_config={"color": GREY},
            tips=False
        )
        axes.shift(DOWN * 0.5)

        # Data points with a linear trend plus noise
        np.random.seed(42)
        x_data = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9])
        y_data = 0.8 * x_data + 2 + np.random.normal(0, 0.5, len(x_data))

        # Ensure y values are in range
        y_data = np.clip(y_data, 1, 9)

        dots = VGroup(*[
            Dot(axes.c2p(x, y), color=BLUE, radius=0.08)
            for x, y in zip(x_data, y_data)
        ])

        self.play(
            FadeOut(subtitle),
            Create(axes),
            run_time=1
        )
        self.play(
            LaggedStart(
                *[GrowFromCenter(dot) for dot in dots],
                lag_ratio=0.1
            ),
            run_time=1.5
        )
        self.wait(1)

        # SECTION 3: Show bad fits first
        bad_fit_label = Text("Which line fits best?", font_size=26, color=YELLOW)
        bad_fit_label.to_edge(DOWN, buff=0.4)
        self.play(Write(bad_fit_label))
        self.wait(0.5)

        # Show a few bad lines
        bad_line1 = axes.plot(lambda x: 0.3 * x + 5, color=RED_C, stroke_width=3)
        bad_line2 = axes.plot(lambda x: 1.2 * x + 0.5, color=RED_C, stroke_width=3)

        self.play(Create(bad_line1), run_time=0.8)
        self.wait(0.5)
        self.play(FadeOut(bad_line1), run_time=0.4)

        self.play(Create(bad_line2), run_time=0.8)
        self.wait(0.5)
        self.play(FadeOut(bad_line2), run_time=0.4)

        # SECTION 4: Show the best fit line
        self.play(FadeOut(bad_fit_label), run_time=0.3)

        # Calculate actual best fit using least squares
        slope = np.polyfit(x_data, y_data, 1)[0]
        intercept = np.polyfit(x_data, y_data, 1)[1]

        best_fit = axes.plot(
            lambda x: slope * x + intercept,
            color=GREEN,
            stroke_width=4
        )

        best_label = Text("Best Fit Line!", font_size=28, color=GREEN, weight=BOLD)
        best_label.to_edge(DOWN, buff=0.4)

        self.play(
            Create(best_fit),
            Write(best_label),
            run_time=1.2
        )
        self.wait(1)

        # SECTION 5: Show the equation
        equation = MathTex(
            f"y = {slope:.2f}x + {intercept:.2f}",
            font_size=36,
            color=GREEN
        )
        equation.next_to(title, DOWN, buff=0.5)

        self.play(Write(equation))
        self.wait(1)

        # SECTION 6: Explain residuals
        self.play(FadeOut(best_label), run_time=0.3)

        residual_label = Text("Residuals (errors)", font_size=26, color=RED)
        residual_label.to_edge(DOWN, buff=0.4)
        self.play(Write(residual_label))
        self.wait(0.5)

        # Draw residuals (vertical lines from points to line)
        residuals = VGroup()
        for x, y in zip(x_data, y_data):
            y_pred = slope * x + intercept
            residual_line = Line(
                axes.c2p(x, y),
                axes.c2p(x, y_pred),
                color=RED,
                stroke_width=2
            )
            residuals.add(residual_line)

        self.play(
            LaggedStart(
                *[Create(r) for r in residuals],
                lag_ratio=0.1
            ),
            run_time=2
        )
        self.wait(1.5)

        # SECTION 7: Show squared errors concept
        self.play(
            FadeOut(VGroup(residuals, residual_label)),
            run_time=0.5
        )

        # Show just a few residuals with squares
        sample_indices = [2, 4, 6]  # Show 3 examples
        squares = VGroup()
        sample_residuals = VGroup()

        for idx in sample_indices:
            x, y = x_data[idx], y_data[idx]
            y_pred = slope * x + intercept
            error = abs(y - y_pred)

            # Residual line
            res_line = Line(
                axes.c2p(x, y),
                axes.c2p(x, y_pred),
                color=RED,
                stroke_width=3
            )
            sample_residuals.add(res_line)

            # Square representing squared error
            side_length = axes.x_axis.unit_size * error
            square = Square(
                side_length=side_length,
                fill_color=RED,
                fill_opacity=0.3,
                stroke_color=RED,
                stroke_width=2
            )

            # Position square next to the residual
            if y > y_pred:
                square.next_to(axes.c2p(x, y), RIGHT, buff=0.05)
            else:
                square.next_to(axes.c2p(x, y_pred), RIGHT, buff=0.05)

            squares.add(square)

        squared_label = Text("Squared Errors", font_size=26, color=RED)
        squared_label.to_edge(DOWN, buff=0.4)

        self.play(
            LaggedStart(
                *[Create(r) for r in sample_residuals],
                lag_ratio=0.15
            ),
            Write(squared_label),
            run_time=1.2
        )
        self.wait(0.5)

        self.play(
            LaggedStart(
                *[FadeIn(s, scale=0.5) for s in squares],
                lag_ratio=0.2
            ),
            run_time=1.5
        )
        self.wait(1.5)

        # SECTION 8: The goal
        self.play(
            FadeOut(VGroup(sample_residuals, squares, squared_label)),
            run_time=0.5
        )

        goal = VGroup(
            Text("Goal: Minimize", font_size=28, color=YELLOW),
            MathTex(
                r"\sum_{i=1}^{n} (y_i - \hat{y}_i)^2",
                font_size=32,
                color=RED
            )
        )
        goal.arrange(DOWN, buff=0.3)
        goal.to_edge(DOWN, buff=0.5)

        explanation = Text(
            "Sum of Squared Errors",
            font_size=22,
            color=BLUE_B
        )
        explanation.next_to(goal, UP, buff=0.3)

        self.play(Write(explanation))
        self.play(
            LaggedStart(
                Write(goal[0]),
                Write(goal[1]),
                lag_ratio=0.3
            ),
            run_time=1.5
        )
        self.wait(2)

        # SECTION 9: Key insight
        self.play(
            FadeOut(VGroup(explanation, goal)),
            run_time=0.5
        )

        insight_box = Rectangle(
            width=11,
            height=1.5,
            fill_color=GREEN,
            fill_opacity=0.2,
            stroke_color=GREEN,
            stroke_width=3
        )
        insight_box.to_edge(DOWN, buff=0.5)

        insight = VGroup(
            Text("The line that minimizes errors", font_size=26),
            Text("is the best predictor!", font_size=26, weight=BOLD)
        )
        insight.arrange(DOWN, buff=0.15)
        insight.move_to(insight_box)

        self.play(
            FadeIn(insight_box),
            Write(insight),
            Flash(best_fit, color=GREEN, line_length=0.4),
            run_time=1.5
        )
        self.wait(3)


class LinearRegressionInteractive(Scene):
    """Show how changing slope/intercept affects the fit"""

    def construct(self):
        title = Text("How Parameters Affect the Fit", font_size=40, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.5)

        # Create axes
        axes = Axes(
            x_range=[0, 10, 1],
            y_range=[0, 10, 1],
            x_length=6,
            y_length=4.5,
            axis_config={"color": GREY},
            tips=False
        )
        axes.shift(DOWN * 0.3)

        # Simple data
        x_data = np.array([2, 4, 6, 8])
        y_data = np.array([3, 5, 6, 8])

        dots = VGroup(*[
            Dot(axes.c2p(x, y), color=BLUE, radius=0.1)
            for x, y in zip(x_data, y_data)
        ])

        self.play(Create(axes))
        self.play(
            LaggedStart(
                *[GrowFromCenter(dot) for dot in dots],
                lag_ratio=0.15
            ),
            run_time=1
        )
        self.wait(0.8)

        # Show changing slope
        slope_label = Text("Changing slope (m):", font_size=28, color=YELLOW)
        slope_label.to_edge(DOWN, buff=0.4)
        self.play(Write(slope_label))
        self.wait(0.5)

        slopes = [0.3, 0.6, 0.9]
        intercept = 2

        for slope in slopes:
            line = axes.plot(lambda x: slope * x + intercept, color=GREEN, stroke_width=3)
            eq = MathTex(f"y = {slope:.1f}x + {intercept}", font_size=30, color=GREEN)
            eq.next_to(title, DOWN, buff=0.5)

            self.play(
                Create(line),
                Write(eq),
                run_time=0.8
            )
            self.wait(0.6)
            self.play(
                FadeOut(line),
                FadeOut(eq),
                run_time=0.4
            )

        self.play(FadeOut(slope_label), run_time=0.3)

        # Show changing intercept
        intercept_label = Text("Changing intercept (b):", font_size=28, color=YELLOW)
        intercept_label.to_edge(DOWN, buff=0.4)
        self.play(Write(intercept_label))
        self.wait(0.5)

        slope = 0.7
        intercepts = [1, 2.5, 4]

        for intercept in intercepts:
            line = axes.plot(lambda x: slope * x + intercept, color=PURPLE, stroke_width=3)
            eq = MathTex(f"y = {slope:.1f}x + {intercept:.1f}", font_size=30, color=PURPLE)
            eq.next_to(title, DOWN, buff=0.5)

            self.play(
                Create(line),
                Write(eq),
                run_time=0.8
            )
            self.wait(0.6)
            self.play(
                FadeOut(line),
                FadeOut(eq),
                run_time=0.4
            )

        self.play(FadeOut(intercept_label), run_time=0.3)

        # Show best fit
        best_slope = np.polyfit(x_data, y_data, 1)[0]
        best_intercept = np.polyfit(x_data, y_data, 1)[1]

        best_line = axes.plot(
            lambda x: best_slope * x + best_intercept,
            color=GREEN,
            stroke_width=4
        )
        best_eq = MathTex(
            f"y = {best_slope:.2f}x + {best_intercept:.2f}",
            font_size=32,
            color=GREEN
        )
        best_eq.next_to(title, DOWN, buff=0.5)

        best_text = Text("Best Fit!", font_size=32, color=GREEN, weight=BOLD)
        best_text.to_edge(DOWN, buff=0.4)

        self.play(
            Create(best_line),
            Write(best_eq),
            Write(best_text),
            Flash(best_line, color=GREEN),
            run_time=1.5
        )
        self.wait(2)
