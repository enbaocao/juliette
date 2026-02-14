"""
Bayes' Theorem Visualization
Generated using two-layer prompting approach

Scenario: Medical test for rare disease
- Disease prevalence: 1%
- Test sensitivity: 95% (true positive rate)
- False positive rate: 5%
- Result: If you test positive, only 16.1% chance you have it!

Render command:
  docker-compose run --rm manim manim -ql examples/bayes_theorem.py BayesTheorem
"""

from manim import *


class BayesTheorem(Scene):
    def construct(self):
        # Color scheme (semantic)
        PRIOR_COLOR = BLUE
        LIKELIHOOD_COLOR = GREEN
        EVIDENCE_COLOR = RED
        POSTERIOR_COLOR = YELLOW

        # Story Beat 1: Introduce formula
        title = Text("Bayes' Theorem", font_size=52, weight=BOLD)
        self.play(Write(title))
        self.wait(0.5)
        self.play(title.animate.scale(0.65).to_edge(UP))

        # Formula with color coding
        formula = MathTex(
            r"P(A|B) = \frac{P(B|A) \cdot P(A)}{P(B)}",
            font_size=44
        )

        # Color semantic parts by creating separate colored formulas
        formula_colored = VGroup(
            MathTex(r"P(A|B)", font_size=44, color=POSTERIOR_COLOR),
            MathTex(r"=", font_size=44),
            MathTex(r"\frac{P(B|A) \cdot P(A)}{P(B)}", font_size=44)
        ).arrange(RIGHT, buff=0.15)

        formula = formula_colored

        self.play(Write(formula), run_time=2)
        self.wait(1)

        self.play(formula.animate.scale(0.7).shift(UP * 1.8))

        # Story Beat 2: Real-world scenario
        scenario = Text(
            "Scenario: Medical Test for Rare Disease",
            font_size=32,
            color=BLUE_B
        )
        scenario.next_to(formula, DOWN, buff=0.6)
        self.play(FadeIn(scenario, shift=UP))
        self.wait(1)

        # Story Beat 3: Given information
        given_info = VGroup(
            Text("• Disease prevalence: 1% (prior)", font_size=24, color=PRIOR_COLOR),
            Text("• Test sensitivity: 95%", font_size=24, color=LIKELIHOOD_COLOR),
            Text("• False positive rate: 5%", font_size=24, color=RED_C),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.25)
        given_info.next_to(scenario, DOWN, buff=0.5)

        self.play(LaggedStart(
            *[FadeIn(item, shift=RIGHT) for item in given_info],
            lag_ratio=0.4
        ), run_time=2)
        self.wait(1.5)

        # Transition to calculation
        self.play(
            FadeOut(scenario),
            FadeOut(given_info),
            run_time=0.6
        )

        # Story Beat 4: Visual probability model
        total_width = 10
        total_height = 2.5

        # Base rectangle
        base_rect = Rectangle(
            width=total_width,
            height=total_height,
            stroke_color=WHITE,
            stroke_width=2
        )
        base_rect.shift(DOWN * 0.3)

        # Prior probability (1% have disease)
        p_disease = 0.01
        disease_width = total_width * p_disease

        disease_rect = Rectangle(
            width=disease_width,
            height=total_height,
            fill_color=PRIOR_COLOR,
            fill_opacity=0.4,
            stroke_color=PRIOR_COLOR,
            stroke_width=2
        )
        disease_rect.align_to(base_rect, LEFT + DOWN)

        healthy_rect = Rectangle(
            width=total_width - disease_width,
            height=total_height,
            fill_color=GREY,
            fill_opacity=0.2,
            stroke_color=GREY,
            stroke_width=2
        )
        healthy_rect.next_to(disease_rect, RIGHT, buff=0)

        # Labels
        disease_label = MathTex("P(Disease) = 0.01", font_size=28, color=PRIOR_COLOR)
        disease_label.next_to(disease_rect, UP, buff=0.2)

        healthy_label = MathTex(r"P(\neg Disease) = 0.99", font_size=28, color=GREY)
        healthy_label.move_to(healthy_rect.get_center())

        self.play(Create(base_rect))
        self.play(
            FadeIn(disease_rect, shift=RIGHT),
            Write(disease_label)
        )
        self.play(
            FadeIn(healthy_rect),
            Write(healthy_label)
        )
        self.wait(1.5)

        # Story Beat 5: Test results overlay
        # True positives (95% of disease group)
        p_true_pos = 0.95
        tp_height = total_height * p_true_pos

        true_pos_rect = Rectangle(
            width=disease_width,
            height=tp_height,
            fill_color=LIKELIHOOD_COLOR,
            fill_opacity=0.6,
            stroke_color=LIKELIHOOD_COLOR,
            stroke_width=3
        )
        true_pos_rect.align_to(disease_rect, DL)

        tp_label = Text("Test +", font_size=20, color=LIKELIHOOD_COLOR)
        tp_label.move_to(true_pos_rect.get_center())

        # False positives (5% of healthy group)
        p_false_pos = 0.05
        fp_height = total_height * p_false_pos
        fp_width = total_width - disease_width

        false_pos_rect = Rectangle(
            width=fp_width,
            height=fp_height,
            fill_color=RED,
            fill_opacity=0.5,
            stroke_color=RED,
            stroke_width=3
        )
        false_pos_rect.align_to(healthy_rect, DL)

        fp_label = Text("Test +", font_size=20, color=RED)
        fp_label.move_to(false_pos_rect.get_center())

        # Show test results
        test_info = Text("Test Results:", font_size=28, color=YELLOW)
        test_info.to_edge(LEFT, buff=0.5).shift(DOWN * 0.3)

        self.play(Write(test_info))
        self.play(
            FadeIn(true_pos_rect),
            Write(tp_label),
            run_time=1
        )
        self.wait(0.5)
        self.play(
            FadeIn(false_pos_rect),
            Write(fp_label),
            run_time=1
        )
        self.wait(1.5)

        # Story Beat 6: Calculate posterior
        # Clear screen for calculation
        self.play(
            FadeOut(VGroup(
                base_rect, disease_rect, healthy_rect,
                disease_label, healthy_label,
                true_pos_rect, false_pos_rect,
                tp_label, fp_label, test_info
            )),
            run_time=0.8
        )

        # Calculation steps
        calc_title = Text("If you test positive:", font_size=32, color=YELLOW)
        calc_title.shift(UP * 1)
        self.play(Write(calc_title))
        self.wait(0.5)

        # Step by step
        step1 = MathTex(
            r"P(Disease|+) = \frac{P(+|Disease) \cdot P(Disease)}{P(+)}",
            font_size=36
        )
        step1.next_to(calc_title, DOWN, buff=0.5)
        self.play(Write(step1))
        self.wait(1)

        step2 = MathTex(
            r"= \frac{0.95 \times 0.01}{(0.95 \times 0.01) + (0.05 \times 0.99)}",
            font_size=34
        )
        step2.next_to(step1, DOWN, buff=0.4)
        self.play(Write(step2))
        self.wait(1)

        step3 = MathTex(
            r"= \frac{0.0095}{0.0095 + 0.0495}",
            font_size=34
        )
        step3.next_to(step2, DOWN, buff=0.4)
        self.play(Write(step3))
        self.wait(1)

        step4 = MathTex(
            r"= \frac{0.0095}{0.059} \approx 0.161",
            font_size=34
        )
        step4.next_to(step3, DOWN, buff=0.4)
        self.play(Write(step4))
        self.wait(1)

        # Story Beat 7: Surprising result!
        result_box = SurroundingRectangle(
            step4,
            color=YELLOW,
            buff=0.2,
            stroke_width=3
        )
        self.play(Create(result_box))

        surprise = Text(
            "Only 16.1% chance you have the disease!",
            font_size=36,
            color=YELLOW,
            weight=BOLD
        )
        surprise.next_to(step4, DOWN, buff=0.8)
        self.play(
            Write(surprise),
            Flash(step4, color=YELLOW, line_length=0.3),
            run_time=1.2
        )
        self.wait(2)

        # Story Beat 8: Key insight
        self.play(
            FadeOut(VGroup(step1, step2, step3, step4, result_box, calc_title)),
            surprise.animate.move_to(ORIGIN + UP * 1.5),
            run_time=0.8
        )

        insight = VGroup(
            Text("Key Insight:", font_size=32, color=BLUE_B, weight=BOLD),
            Text("• Base rate (prior) matters immensely", font_size=26),
            Text("• Rare diseases stay unlikely even with positive test", font_size=26),
            Text("• Don't ignore the prior probability!", font_size=26, color=RED),
        ).arrange(DOWN, aligned_edge=LEFT, buff=0.35)
        insight.shift(DOWN * 0.5)

        self.play(LaggedStart(
            *[FadeIn(item, shift=UP) for item in insight],
            lag_ratio=0.3
        ), run_time=2.5)
        self.wait(3)


class BayesVisualProof(Scene):
    """Alternative visualization using area model"""

    def construct(self):
        title = Text("Bayes' Theorem: Visual Proof", font_size=48)
        self.play(Write(title))
        self.wait(0.5)
        self.play(title.animate.to_edge(UP).scale(0.7))

        # Create a unit square
        square = Square(side_length=5, stroke_color=WHITE)
        square.shift(DOWN * 0.3)

        self.play(Create(square))
        self.wait(0.5)

        # Split horizontally by P(A)
        p_a = 0.3

        # A region
        a_rect = Rectangle(
            width=5,
            height=5 * p_a,
            fill_color=BLUE,
            fill_opacity=0.3,
            stroke_color=BLUE
        )
        a_rect.align_to(square, DL)

        a_label = MathTex("P(A)", font_size=32, color=BLUE)
        a_label.next_to(a_rect, LEFT)

        self.play(FadeIn(a_rect), Write(a_label))
        self.wait(1)

        # Not A region
        not_a_rect = Rectangle(
            width=5,
            height=5 * (1 - p_a),
            fill_color=GREY,
            fill_opacity=0.2,
            stroke_color=GREY
        )
        not_a_rect.next_to(a_rect, UP, buff=0)

        not_a_label = MathTex(r"P(\neg A)", font_size=32, color=GREY)
        not_a_label.next_to(not_a_rect, LEFT)

        self.play(FadeIn(not_a_rect), Write(not_a_label))
        self.wait(1)

        # Split vertically by P(B|A) and P(B|¬A)
        p_b_given_a = 0.7

        # B ∩ A
        ba_rect = Rectangle(
            width=5 * p_b_given_a,
            height=5 * p_a,
            fill_color=GREEN,
            fill_opacity=0.5,
            stroke_color=GREEN,
            stroke_width=3
        )
        ba_rect.align_to(a_rect, DL)

        ba_label = MathTex("P(B|A)", font_size=28, color=GREEN)
        ba_label.move_to(ba_rect.get_center())

        self.play(FadeIn(ba_rect), Write(ba_label))
        self.wait(1.5)

        # Highlight
        highlight = SurroundingRectangle(ba_rect, color=YELLOW, buff=0.05, stroke_width=4)

        formula = MathTex(
            r"P(A|B) = \frac{\text{Green Area}}{\text{Total Green Column}}",
            font_size=32,
            color=YELLOW
        )
        formula.to_edge(DOWN, buff=0.5)

        self.play(Create(highlight))
        self.play(Write(formula))
        self.wait(3)
