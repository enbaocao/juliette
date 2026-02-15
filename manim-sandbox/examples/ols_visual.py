"""
OLS Method - VISUAL VERSION
Less text, more animation and visual representation

Shows:
- Data points and the search for best line
- Animated optimization (trying different slopes)
- Visual squares growing/shrinking with error
- Geometric interpretation of formulas
- Mean lines and deviations visualized
- The "eureka" moment when we find the minimum

Render command:
  docker-compose run --rm manim manim -ql examples/ols_visual.py OLSVisual
"""

from manim import *
import numpy as np


class OLSVisual(Scene):
    def construct(self):
        # SECTION 1: Title
        title = Text("How Does OLS Work?", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.5)

        # SECTION 2: Show data immediately
        axes = Axes(
            x_range=[0, 10, 1],
            y_range=[0, 10, 1],
            x_length=7,
            y_length=5,
            axis_config={"color": GREY},
            tips=False
        )
        axes.shift(DOWN * 0.5)

        # Data with clear linear trend
        np.random.seed(42)
        x_data = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9])
        y_data = 0.8 * x_data + 2 + np.random.normal(0, 0.5, len(x_data))
        y_data = np.clip(y_data, 1, 9)

        dots = VGroup(*[
            Dot(axes.c2p(x, y), color=BLUE, radius=0.09)
            for x, y in zip(x_data, y_data)
        ])

        self.play(Create(axes), run_time=0.8)
        self.play(LaggedStart(
            *[GrowFromCenter(dot) for dot in dots],
            lag_ratio=0.1
        ), run_time=1.5)
        self.wait(0.8)

        question = Text("Which line minimizes total error?", font_size=28, color=YELLOW)
        question.to_edge(DOWN, buff=0.4)
        self.play(Write(question))
        self.wait(1)

        # SECTION 3: Try different lines - VISUAL search
        self.play(FadeOut(question), run_time=0.3)

        trying_text = Text("Trying different lines...", font_size=26, color=YELLOW)
        trying_text.to_edge(DOWN, buff=0.4)
        self.play(Write(trying_text))
        self.wait(0.5)

        # Try several bad lines with error visualization
        test_params = [
            (0.3, 5.0, RED_C),    # Too flat
            (1.2, 0.5, RED_C),    # Too steep
            (0.6, 3.5, ORANGE),   # Better but not quite
        ]

        for slope, intercept, color in test_params:
            line = axes.plot(lambda x: slope * x + intercept, color=color, stroke_width=3)

            # Show a few residuals as squares
            sample_indices = [2, 5, 7]
            squares = VGroup()

            for idx in sample_indices:
                x, y = x_data[idx], y_data[idx]
                y_pred = slope * x + intercept
                error = abs(y - y_pred)

                side_length = axes.x_axis.unit_size * error
                square = Square(
                    side_length=side_length,
                    fill_color=color,
                    fill_opacity=0.4,
                    stroke_color=color,
                    stroke_width=2
                )

                if y > y_pred:
                    square.next_to(axes.c2p(x, y), RIGHT, buff=0.05)
                else:
                    square.next_to(axes.c2p(x, y_pred), RIGHT, buff=0.05)

                squares.add(square)

            self.play(
                Create(line),
                LaggedStart(
                    *[FadeIn(sq, scale=0.5) for sq in squares],
                    lag_ratio=0.1
                ),
                run_time=0.8
            )
            self.wait(0.5)
            self.play(
                FadeOut(line),
                FadeOut(squares),
                run_time=0.4
            )

        # SECTION 4: Find the best one!
        self.play(FadeOut(trying_text), run_time=0.3)

        # Calculate actual OLS solution
        slope_ols = np.polyfit(x_data, y_data, 1)[0]
        intercept_ols = np.polyfit(x_data, y_data, 1)[1]

        best_line = axes.plot(
            lambda x: slope_ols * x + intercept_ols,
            color=GREEN,
            stroke_width=4
        )

        found_text = Text("BEST FIT!", font_size=32, color=GREEN, weight=BOLD)
        found_text.to_edge(DOWN, buff=0.4)

        self.play(
            Create(best_line),
            Write(found_text),
            Flash(best_line, color=GREEN),
            run_time=1.2
        )
        self.wait(1)

        # Show the squares are minimal
        sample_indices = [1, 3, 5, 7]
        best_squares = VGroup()

        for idx in sample_indices:
            x, y = x_data[idx], y_data[idx]
            y_pred = slope_ols * x + intercept_ols
            error = abs(y - y_pred)

            side_length = axes.x_axis.unit_size * error
            square = Square(
                side_length=side_length,
                fill_color=GREEN,
                fill_opacity=0.3,
                stroke_color=GREEN,
                stroke_width=2
            )

            if y > y_pred:
                square.next_to(axes.c2p(x, y), RIGHT, buff=0.05)
            else:
                square.next_to(axes.c2p(x, y_pred), RIGHT, buff=0.05)

            best_squares.add(square)

        self.play(LaggedStart(
            *[FadeIn(sq, scale=0.5) for sq in best_squares],
            lag_ratio=0.15
        ), run_time=1.2)
        self.wait(1.5)

        # SECTION 5: How do we find it mathematically?
        self.play(
            FadeOut(VGroup(found_text, best_squares)),
            run_time=0.5
        )

        math_title = Text("The Math Behind It:", font_size=28, color=YELLOW)
        math_title.to_edge(DOWN, buff=0.4)
        self.play(Write(math_title))
        self.wait(1)

        # SECTION 6: Visualize the MEANS
        self.play(FadeOut(math_title), run_time=0.3)

        x_mean = np.mean(x_data)
        y_mean = np.mean(y_data)

        # Vertical line at x_mean
        x_mean_line = DashedLine(
            axes.c2p(x_mean, 0),
            axes.c2p(x_mean, 10),
            color=YELLOW,
            stroke_width=3
        )
        x_mean_label = MathTex(r"\bar{x}", font_size=32, color=YELLOW)
        x_mean_label.next_to(axes.c2p(x_mean, 0), DOWN, buff=0.2)

        # Horizontal line at y_mean
        y_mean_line = DashedLine(
            axes.c2p(0, y_mean),
            axes.c2p(10, y_mean),
            color=ORANGE,
            stroke_width=3
        )
        y_mean_label = MathTex(r"\bar{y}", font_size=32, color=ORANGE)
        y_mean_label.next_to(axes.c2p(0, y_mean), LEFT, buff=0.2)

        mean_text = Text("Step 1: Find the means", font_size=26, color=YELLOW)
        mean_text.to_edge(DOWN, buff=0.4)

        self.play(Write(mean_text))
        self.play(
            Create(x_mean_line),
            Write(x_mean_label),
            run_time=0.8
        )
        self.play(
            Create(y_mean_line),
            Write(y_mean_label),
            run_time=0.8
        )
        self.wait(1.5)

        # SECTION 7: Visualize DEVIATIONS
        self.play(FadeOut(mean_text), run_time=0.3)

        deviation_text = Text("Step 2: Measure deviations", font_size=26, color=YELLOW)
        deviation_text.to_edge(DOWN, buff=0.4)
        self.play(Write(deviation_text))
        self.wait(0.5)

        # Show deviations for a few points
        sample_points = [2, 5, 7]
        x_deviations = VGroup()
        y_deviations = VGroup()

        for idx in sample_points:
            x, y = x_data[idx], y_data[idx]

            # X deviation (horizontal)
            x_dev = Line(
                axes.c2p(x_mean, y),
                axes.c2p(x, y),
                color=YELLOW,
                stroke_width=3
            )
            x_deviations.add(x_dev)

            # Y deviation (vertical)
            y_dev = Line(
                axes.c2p(x, y_mean),
                axes.c2p(x, y),
                color=ORANGE,
                stroke_width=3
            )
            y_deviations.add(y_dev)

        self.play(LaggedStart(
            *[Create(dev) for dev in x_deviations],
            lag_ratio=0.2
        ), run_time=1.2)
        self.wait(0.8)

        self.play(LaggedStart(
            *[Create(dev) for dev in y_deviations],
            lag_ratio=0.2
        ), run_time=1.2)
        self.wait(1.5)

        # SECTION 8: Show the COVARIANCE rectangles
        self.play(FadeOut(deviation_text), run_time=0.3)

        covar_text = Text("Step 3: Product of deviations", font_size=26, color=YELLOW)
        covar_text.to_edge(DOWN, buff=0.4)
        self.play(Write(covar_text))
        self.wait(0.5)

        # Show rectangles representing (x - x̄)(y - ȳ)
        rectangles = VGroup()

        for idx in sample_points:
            x, y = x_data[idx], y_data[idx]

            x_dev_val = x - x_mean
            y_dev_val = y - y_mean

            # Create rectangle
            width = abs(axes.x_axis.unit_size * x_dev_val)
            height = abs(axes.y_axis.unit_size * y_dev_val)

            rect = Rectangle(
                width=width,
                height=height,
                fill_color=PURPLE,
                fill_opacity=0.4,
                stroke_color=PURPLE,
                stroke_width=2
            )

            # Position based on quadrant
            if x_dev_val > 0 and y_dev_val > 0:
                rect.move_to(axes.c2p(x_mean + x_dev_val/2, y_mean + y_dev_val/2))
            elif x_dev_val < 0 and y_dev_val > 0:
                rect.move_to(axes.c2p(x_mean + x_dev_val/2, y_mean + y_dev_val/2))
            elif x_dev_val > 0 and y_dev_val < 0:
                rect.move_to(axes.c2p(x_mean + x_dev_val/2, y_mean + y_dev_val/2))
            else:
                rect.move_to(axes.c2p(x_mean + x_dev_val/2, y_mean + y_dev_val/2))

            rectangles.add(rect)

        self.play(LaggedStart(
            *[FadeIn(rect, scale=0.7) for rect in rectangles],
            lag_ratio=0.2
        ), run_time=1.5)
        self.wait(1.5)

        # SECTION 9: The formula appears
        self.play(
            FadeOut(VGroup(
                x_deviations, y_deviations, rectangles,
                x_mean_line, y_mean_line,
                x_mean_label, y_mean_label,
                covar_text
            )),
            run_time=0.6
        )

        formula_text = Text("The OLS Formula:", font_size=28, color=YELLOW)
        formula_text.to_edge(DOWN, buff=1.8)
        self.play(Write(formula_text))

        formula = MathTex(
            r"\text{slope} = \frac{\sum (x_i - \bar{x})(y_i - \bar{y})}{\sum (x_i - \bar{x})^2}",
            font_size=32,
            color=GREEN
        )
        formula.to_edge(DOWN, buff=0.4)

        self.play(Write(formula), run_time=1.5)
        self.wait(2)

        # SECTION 10: Final insight
        self.play(
            FadeOut(VGroup(formula_text, formula)),
            run_time=0.5
        )

        insight_box = Rectangle(
            width=11,
            height=1.8,
            fill_color=GREEN,
            fill_opacity=0.2,
            stroke_color=GREEN,
            stroke_width=3
        )
        insight_box.to_edge(DOWN, buff=0.5)

        insight = VGroup(
            Text("OLS finds the slope that matches", font_size=24),
            Text("how X and Y vary together!", font_size=24, weight=BOLD)
        )
        insight.arrange(DOWN, buff=0.15)
        insight.move_to(insight_box)

        self.play(
            FadeIn(insight_box),
            Write(insight),
            Flash(best_line, color=GREEN),
            run_time=1.5
        )
        self.wait(3)


class OLSAnimation(Scene):
    """Animated optimization - watch the line find the minimum"""

    def construct(self):
        title = Text("OLS in Action", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.5)

        # Setup
        axes = Axes(
            x_range=[0, 6, 1],
            y_range=[0, 7, 1],
            x_length=6,
            y_length=4.5,
            axis_config={"color": GREY},
            tips=False
        )
        axes.shift(DOWN * 0.3)

        # Simple data
        x_data = np.array([1, 2, 3, 4, 5])
        y_data = np.array([2, 4, 5, 4, 6])

        dots = VGroup(*[
            Dot(axes.c2p(x, y), color=BLUE, radius=0.1)
            for x, y in zip(x_data, y_data)
        ])

        self.play(Create(axes), run_time=0.6)
        self.play(LaggedStart(
            *[GrowFromCenter(dot) for dot in dots],
            lag_ratio=0.15
        ), run_time=1)
        self.wait(0.5)

        # Error tracker
        error_text = Text("Total Error:", font_size=24, color=YELLOW)
        error_text.to_edge(DOWN, buff=0.4)
        error_value = DecimalNumber(
            0,
            num_decimal_places=2,
            font_size=28,
            color=RED
        )
        error_value.next_to(error_text, RIGHT, buff=0.3)
        error_group = VGroup(error_text, error_value)

        self.play(Write(error_group))
        self.wait(0.5)

        # Animate through different slopes
        slopes_to_try = [0.3, 0.5, 0.7, 0.8, 0.9, 1.0, 0.8]  # End at optimal
        intercept = 1.8

        line = axes.plot(lambda x: slopes_to_try[0] * x + intercept, color=GREEN, stroke_width=4)
        self.play(Create(line), run_time=0.5)

        for slope in slopes_to_try[1:]:
            # Calculate error
            sse = sum((y - (slope * x + intercept))**2 for x, y in zip(x_data, y_data))

            new_line = axes.plot(lambda x: slope * x + intercept, color=GREEN, stroke_width=4)

            self.play(
                Transform(line, new_line),
                ChangeDecimalToValue(error_value, sse),
                run_time=0.8
            )
            self.wait(0.3)

        # Highlight the minimum
        min_box = SurroundingRectangle(error_value, color=GREEN, buff=0.15)
        self.play(Create(min_box))

        success = Text("MINIMUM!", font_size=28, color=GREEN, weight=BOLD)
        success.next_to(error_group, UP, buff=0.5)

        self.play(
            Write(success),
            Flash(line, color=GREEN),
            run_time=1.2
        )
        self.wait(2)
