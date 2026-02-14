"""
Ordinary Least Squares (OLS) Method
Mathematical explanation of how to find the best fit line

Shows:
- The optimization problem
- Deriving the formulas for slope and intercept
- Step-by-step calculation with real data
- Why it's called "least squares"
- The normal equations

Render command:
  docker-compose run --rm manim manim -ql examples/ols_method.py OLSMethod
"""

from manim import *
import numpy as np


class OLSMethod(Scene):
    def construct(self):
        # SECTION 1: Title and Problem Statement
        title = Text("Ordinary Least Squares (OLS)", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.5)

        # SECTION 2: The Problem
        problem_title = Text("The Problem:", font_size=32, color=YELLOW, weight=BOLD)
        problem_title.next_to(title, DOWN, buff=0.6)
        self.play(Write(problem_title))
        self.wait(0.5)

        problem = VGroup(
            Text("Given data points: (x₁, y₁), (x₂, y₂), ..., (xₙ, yₙ)", font_size=24),
            Text("Find the line: y = β₁x + β₀", font_size=24),
            Text("That minimizes the sum of squared errors", font_size=24, color=RED)
        )
        problem.arrange(DOWN, aligned_edge=LEFT, buff=0.3)
        problem.next_to(problem_title, DOWN, buff=0.5)

        self.play(LaggedStart(
            *[FadeIn(line, shift=RIGHT) for line in problem],
            lag_ratio=0.3
        ), run_time=2)
        self.wait(1.5)

        # SECTION 3: The Objective Function
        self.play(
            FadeOut(VGroup(problem_title, problem)),
            run_time=0.5
        )

        objective_title = Text("Minimize:", font_size=32, color=YELLOW)
        objective_title.shift(UP * 2)
        self.play(Write(objective_title))
        self.wait(0.5)

        # The loss function
        loss_function = MathTex(
            r"SSR = \sum_{i=1}^{n} (y_i - \hat{y}_i)^2",
            font_size=40
        )
        loss_function.next_to(objective_title, DOWN, buff=0.5)
        self.play(Write(loss_function))
        self.wait(1)

        # Expand it
        expanded = MathTex(
            r"= \sum_{i=1}^{n} (y_i - (\beta_1 x_i + \beta_0))^2",
            font_size=36
        )
        expanded.next_to(loss_function, DOWN, buff=0.4)
        self.play(Write(expanded))
        self.wait(1.5)

        explanation = Text(
            "SSR = Sum of Squared Residuals",
            font_size=24,
            color=BLUE_B
        )
        explanation.to_edge(DOWN, buff=0.5)
        self.play(Write(explanation))
        self.wait(1.5)

        # SECTION 4: The Solution
        self.play(
            FadeOut(VGroup(objective_title, loss_function, expanded, explanation)),
            run_time=0.5
        )

        solution_title = Text("The OLS Solution:", font_size=32, color=GREEN, weight=BOLD)
        solution_title.shift(UP * 2.5)
        self.play(Write(solution_title))
        self.wait(0.5)

        # Show the formulas
        slope_label = Text("Slope:", font_size=28, color=BLUE_B)
        slope_label.shift(UP * 1.2 + LEFT * 4)
        self.play(Write(slope_label))

        slope_formula = MathTex(
            r"\beta_1 = \frac{\sum (x_i - \bar{x})(y_i - \bar{y})}{\sum (x_i - \bar{x})^2}",
            font_size=36
        )
        slope_formula.next_to(slope_label, RIGHT, buff=0.5)
        self.play(Write(slope_formula))
        self.wait(1.5)

        intercept_label = Text("Intercept:", font_size=28, color=BLUE_B)
        intercept_label.shift(DOWN * 0.2 + LEFT * 3.5)
        self.play(Write(intercept_label))

        intercept_formula = MathTex(
            r"\beta_0 = \bar{y} - \beta_1 \bar{x}",
            font_size=36
        )
        intercept_formula.next_to(intercept_label, RIGHT, buff=0.5)
        self.play(Write(intercept_formula))
        self.wait(1.5)

        # Note about means
        mean_note = Text(
            "where x̄ and ȳ are the means",
            font_size=22,
            color=GREY
        )
        mean_note.next_to(intercept_formula, DOWN, buff=0.8)
        self.play(FadeIn(mean_note))
        self.wait(1.5)

        # SECTION 5: Example Calculation
        self.play(
            FadeOut(VGroup(
                solution_title, slope_label, slope_formula,
                intercept_label, intercept_formula, mean_note
            )),
            run_time=0.5
        )

        calc_title = Text("Example Calculation", font_size=36, color=YELLOW, weight=BOLD)
        calc_title.to_edge(UP, buff=1)
        self.play(Write(calc_title))
        self.wait(0.5)

        # Simple dataset
        data_title = Text("Data:", font_size=28, color=BLUE_B)
        data_title.shift(UP * 1.8 + LEFT * 5)
        self.play(Write(data_title))

        x_vals = np.array([1, 2, 3, 4, 5])
        y_vals = np.array([2, 4, 5, 4, 6])

        data_table = VGroup(
            Text("x: 1, 2, 3, 4, 5", font_size=24),
            Text("y: 2, 4, 5, 4, 6", font_size=24)
        )
        data_table.arrange(DOWN, aligned_edge=LEFT, buff=0.2)
        data_table.next_to(data_title, DOWN, buff=0.3)
        self.play(Write(data_table))
        self.wait(1)

        # Calculate means
        x_mean = np.mean(x_vals)
        y_mean = np.mean(y_vals)

        means = VGroup(
            MathTex(r"\bar{x} = 3", font_size=28),
            MathTex(r"\bar{y} = 4.2", font_size=28)
        )
        means.arrange(DOWN, aligned_edge=LEFT, buff=0.2)
        means.next_to(data_table, DOWN, buff=0.5)
        self.play(Write(means))
        self.wait(1)

        # SECTION 6: Step-by-step calculation
        self.play(
            FadeOut(VGroup(data_title, data_table, means)),
            run_time=0.4
        )

        step1_title = Text("Step 1: Calculate deviations", font_size=26, color=YELLOW)
        step1_title.shift(UP * 1.5)
        self.play(Write(step1_title))
        self.wait(0.5)

        # Show deviations table
        deviations = VGroup(
            Text("(xᵢ - x̄): -2, -1,  0,  1,  2", font_size=22),
            Text("(yᵢ - ȳ): -2.2, -0.2, 0.8, -0.2, 1.8", font_size=22)
        )
        deviations.arrange(DOWN, aligned_edge=LEFT, buff=0.2)
        deviations.next_to(step1_title, DOWN, buff=0.4)
        self.play(Write(deviations))
        self.wait(1.5)

        # Step 2: Products
        self.play(FadeOut(VGroup(step1_title, deviations)), run_time=0.4)

        step2_title = Text("Step 2: Calculate products", font_size=26, color=YELLOW)
        step2_title.shift(UP * 1.5)
        self.play(Write(step2_title))
        self.wait(0.5)

        products = VGroup(
            Text("(xᵢ - x̄)(yᵢ - ȳ): 4.4, 0.2, 0, -0.2, 3.6", font_size=22),
            Text("(xᵢ - x̄)²: 4, 1, 0, 1, 4", font_size=22)
        )
        products.arrange(DOWN, aligned_edge=LEFT, buff=0.2)
        products.next_to(step2_title, DOWN, buff=0.4)
        self.play(Write(products))
        self.wait(1.5)

        # Step 3: Sums
        self.play(FadeOut(VGroup(step2_title, products)), run_time=0.4)

        step3_title = Text("Step 3: Sum them up", font_size=26, color=YELLOW)
        step3_title.shift(UP * 1.5)
        self.play(Write(step3_title))
        self.wait(0.5)

        sums = VGroup(
            MathTex(r"\sum (x_i - \bar{x})(y_i - \bar{y}) = 8.0", font_size=28),
            MathTex(r"\sum (x_i - \bar{x})^2 = 10", font_size=28)
        )
        sums.arrange(DOWN, aligned_edge=LEFT, buff=0.3)
        sums.next_to(step3_title, DOWN, buff=0.4)
        self.play(Write(sums))
        self.wait(1.5)

        # Step 4: Calculate slope
        self.play(FadeOut(VGroup(step3_title, sums)), run_time=0.4)

        step4_title = Text("Step 4: Calculate β₁ (slope)", font_size=26, color=YELLOW)
        step4_title.shift(UP * 1.5)
        self.play(Write(step4_title))
        self.wait(0.5)

        slope_calc = VGroup(
            MathTex(r"\beta_1 = \frac{8.0}{10}", font_size=32),
            MathTex(r"= 0.8", font_size=36, color=GREEN)
        )
        slope_calc.arrange(DOWN, buff=0.4)
        slope_calc.next_to(step4_title, DOWN, buff=0.5)

        self.play(Write(slope_calc[0]))
        self.wait(0.8)
        self.play(Write(slope_calc[1]))
        self.wait(1)

        slope_box = SurroundingRectangle(slope_calc[1], color=GREEN, buff=0.15)
        self.play(Create(slope_box))
        self.wait(1)

        # Step 5: Calculate intercept
        self.play(
            FadeOut(VGroup(step4_title, slope_calc, slope_box)),
            run_time=0.4
        )

        step5_title = Text("Step 5: Calculate β₀ (intercept)", font_size=26, color=YELLOW)
        step5_title.shift(UP * 1.5)
        self.play(Write(step5_title))
        self.wait(0.5)

        intercept_calc = VGroup(
            MathTex(r"\beta_0 = \bar{y} - \beta_1 \bar{x}", font_size=32),
            MathTex(r"= 4.2 - (0.8)(3)", font_size=32),
            MathTex(r"= 4.2 - 2.4", font_size=32),
            MathTex(r"= 1.8", font_size=36, color=GREEN)
        )
        intercept_calc.arrange(DOWN, buff=0.3)
        intercept_calc.next_to(step5_title, DOWN, buff=0.5)

        for step in intercept_calc:
            self.play(Write(step), run_time=0.7)
            self.wait(0.4)

        intercept_box = SurroundingRectangle(intercept_calc[-1], color=GREEN, buff=0.15)
        self.play(Create(intercept_box))
        self.wait(1)

        # SECTION 7: Final Result
        self.play(
            FadeOut(VGroup(
                step5_title, intercept_calc, intercept_box
            )),
            run_time=0.5
        )

        result_title = Text("The Best Fit Line:", font_size=32, color=YELLOW, weight=BOLD)
        result_title.shift(UP * 1.5)
        self.play(Write(result_title))
        self.wait(0.5)

        final_equation = MathTex(
            r"y = 0.8x + 1.8",
            font_size=48,
            color=GREEN
        )
        final_equation.next_to(result_title, DOWN, buff=0.6)

        self.play(
            Write(final_equation),
            Flash(final_equation, color=GREEN),
            run_time=1.2
        )
        self.wait(1)

        # Show it visually
        self.play(
            FadeOut(VGroup(calc_title, result_title, final_equation)),
            run_time=0.5
        )

        # Quick visual
        visual_title = Text("Visualized:", font_size=32, color=YELLOW)
        visual_title.to_edge(UP, buff=1)
        self.play(Write(visual_title))

        axes = Axes(
            x_range=[0, 6, 1],
            y_range=[0, 7, 1],
            x_length=6,
            y_length=4,
            axis_config={"color": GREY},
            tips=False
        )
        axes.shift(DOWN * 0.5)

        dots = VGroup(*[
            Dot(axes.c2p(x, y), color=BLUE, radius=0.1)
            for x, y in zip(x_vals, y_vals)
        ])

        line = axes.plot(lambda x: 0.8 * x + 1.8, color=GREEN, stroke_width=4)

        equation_display = MathTex(r"y = 0.8x + 1.8", font_size=32, color=GREEN)
        equation_display.next_to(visual_title, DOWN, buff=0.4)

        self.play(Create(axes), run_time=0.8)
        self.play(LaggedStart(
            *[GrowFromCenter(dot) for dot in dots],
            lag_ratio=0.15
        ), run_time=1)
        self.play(
            Create(line),
            Write(equation_display),
            run_time=1.2
        )
        self.wait(2)

        # SECTION 8: Key Insight
        insight_box = Rectangle(
            width=11,
            height=1.2,
            fill_color=YELLOW,
            fill_opacity=0.2,
            stroke_color=YELLOW,
            stroke_width=3
        )
        insight_box.to_edge(DOWN, buff=0.4)

        insight = Text(
            "OLS finds the unique line that minimizes squared errors!",
            font_size=24,
            weight=BOLD
        )
        insight.move_to(insight_box)

        self.play(
            FadeIn(insight_box),
            Write(insight),
            run_time=1.2
        )
        self.wait(3)


class OLSMatrix(Scene):
    """Matrix form of OLS for those who want the full picture"""

    def construct(self):
        title = Text("OLS: Matrix Form", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.5)

        subtitle = Text(
            "A more general formulation",
            font_size=28,
            color=BLUE_B
        )
        subtitle.next_to(title, DOWN, buff=0.5)
        self.play(Write(subtitle))
        self.wait(1)

        # The matrix equation
        matrix_title = Text("In matrix form:", font_size=28, color=YELLOW)
        matrix_title.shift(UP * 1.5)
        self.play(Write(matrix_title))
        self.wait(0.5)

        # y = Xβ
        equation1 = MathTex(
            r"\mathbf{y} = \mathbf{X}\boldsymbol{\beta} + \boldsymbol{\epsilon}",
            font_size=40
        )
        equation1.next_to(matrix_title, DOWN, buff=0.5)
        self.play(Write(equation1))
        self.wait(1.5)

        # Where...
        where = VGroup(
            Text("where:", font_size=24),
            MathTex(r"\mathbf{y} = \text{vector of y values}", font_size=24),
            MathTex(r"\mathbf{X} = \text{design matrix (with 1s and x values)}", font_size=22),
            MathTex(r"\boldsymbol{\beta} = \text{coefficients } [\beta_0, \beta_1]^T", font_size=24),
            MathTex(r"\boldsymbol{\epsilon} = \text{errors}", font_size=24)
        )
        where.arrange(DOWN, aligned_edge=LEFT, buff=0.25)
        where.next_to(equation1, DOWN, buff=0.6)

        self.play(LaggedStart(
            *[FadeIn(item, shift=RIGHT) for item in where],
            lag_ratio=0.2
        ), run_time=2.5)
        self.wait(2)

        # The solution
        self.play(
            FadeOut(VGroup(matrix_title, equation1, where)),
            run_time=0.5
        )

        solution_title = Text("The OLS Estimator:", font_size=32, color=GREEN, weight=BOLD)
        solution_title.shift(UP * 1.5)
        self.play(Write(solution_title))
        self.wait(0.5)

        # The famous formula
        ols_formula = MathTex(
            r"\hat{\boldsymbol{\beta}} = (\mathbf{X}^T\mathbf{X})^{-1}\mathbf{X}^T\mathbf{y}",
            font_size=44,
            color=GREEN
        )
        ols_formula.next_to(solution_title, DOWN, buff=0.7)

        self.play(Write(ols_formula), run_time=1.5)
        self.wait(1)

        formula_box = SurroundingRectangle(ols_formula, color=GREEN, buff=0.2)
        self.play(Create(formula_box))
        self.wait(1.5)

        # This is the normal equation
        normal_eq = Text(
            "This is the 'Normal Equation'",
            font_size=26,
            color=BLUE_B
        )
        normal_eq.next_to(ols_formula, DOWN, buff=0.8)
        self.play(Write(normal_eq))
        self.wait(2)

        # Key properties
        self.play(
            FadeOut(VGroup(normal_eq)),
            run_time=0.4
        )

        properties_title = Text("Key Properties:", font_size=28, color=YELLOW)
        properties_title.next_to(ols_formula, DOWN, buff=0.8)
        self.play(Write(properties_title))
        self.wait(0.5)

        properties = VGroup(
            Text("✓ Unique solution (if X'X is invertible)", font_size=22, color=GREEN),
            Text("✓ Unbiased estimator", font_size=22, color=GREEN),
            Text("✓ Minimum variance (BLUE)", font_size=22, color=GREEN)
        )
        properties.arrange(DOWN, aligned_edge=LEFT, buff=0.25)
        properties.next_to(properties_title, DOWN, buff=0.4)

        self.play(LaggedStart(
            *[FadeIn(prop, shift=RIGHT) for prop in properties],
            lag_ratio=0.3
        ), run_time=2)
        self.wait(3)
