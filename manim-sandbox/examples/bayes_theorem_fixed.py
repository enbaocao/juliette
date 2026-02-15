"""
Bayes' Theorem Visualization (FIXED SPATIAL LAYOUT)
Demonstrates proper positioning to avoid overlaps and off-screen elements

Key improvements:
- Relative positioning with .next_to()
- Proper cleanup between sections
- Safe zones for title/content/footer
- Scaled elements to fit screen

Render command:
  docker-compose run --rm manim manim -ql examples/bayes_theorem_fixed.py BayesTheoremFixed
"""

from manim import *


class BayesTheoremFixed(Scene):
    def construct(self):
        # Color scheme
        PRIOR_COLOR = BLUE
        LIKELIHOOD_COLOR = GREEN
        EVIDENCE_COLOR = RED
        POSTERIOR_COLOR = YELLOW

        # SECTION 1: Title and Formula
        title = Text("Bayes' Theorem", font_size=48, weight=BOLD)
        title.to_edge(UP, buff=0.4)  # Safe top zone

        self.play(Write(title))
        self.wait(0.5)

        # Formula - simplified for better readability
        formula = MathTex(
            r"P(A|B) = \frac{P(B|A) \cdot P(A)}{P(B)}",
            font_size=42
        )
        formula.next_to(title, DOWN, buff=0.5)

        self.play(Write(formula))
        self.wait(1)

        # SECTION 2: Scenario (clear previous, reuse space)
        self.play(
            FadeOut(formula),
            title.animate.scale(0.7),
            run_time=0.6
        )

        scenario_title = Text(
            "Medical Test for Rare Disease",
            font_size=32,
            color=BLUE_B
        )
        scenario_title.next_to(title, DOWN, buff=0.5)

        self.play(FadeIn(scenario_title, shift=UP))
        self.wait(0.5)

        # Given info - use VGroup for consistent spacing
        given = VGroup(
            Text("Disease rate: 1%", font_size=24, color=PRIOR_COLOR),
            Text("Test sensitivity: 95%", font_size=24, color=LIKELIHOOD_COLOR),
            Text("False positive: 5%", font_size=24, color=RED_C),
        )
        given.arrange(DOWN, aligned_edge=LEFT, buff=0.25)
        given.next_to(scenario_title, DOWN, buff=0.6)

        self.play(LaggedStart(
            *[FadeIn(item, shift=RIGHT) for item in given],
            lag_ratio=0.3
        ), run_time=1.5)
        self.wait(1.5)

        # SECTION 3: Visual Model (clear everything first)
        self.play(
            FadeOut(VGroup(scenario_title, given)),
            run_time=0.5
        )

        # Probability rectangles - fit to screen width
        rect_width = 11  # Safe width
        rect_height = 2
        p_disease = 0.01

        base_rect = Rectangle(
            width=rect_width,
            height=rect_height,
            stroke_color=WHITE,
            stroke_width=2
        )
        base_rect.move_to(ORIGIN + DOWN * 0.5)  # Center with slight offset

        disease_width = rect_width * p_disease
        disease_rect = Rectangle(
            width=disease_width,
            height=rect_height,
            fill_color=PRIOR_COLOR,
            fill_opacity=0.4,
            stroke_color=PRIOR_COLOR
        )
        disease_rect.align_to(base_rect, LEFT + DOWN)

        healthy_rect = Rectangle(
            width=rect_width - disease_width,
            height=rect_height,
            fill_color=GREY,
            fill_opacity=0.2,
            stroke_color=GREY
        )
        healthy_rect.next_to(disease_rect, RIGHT, buff=0)

        # Labels positioned relative to rectangles
        disease_label = Text("1% Disease", font_size=20, color=PRIOR_COLOR)
        disease_label.next_to(disease_rect, UP, buff=0.15)

        healthy_label = Text("99% Healthy", font_size=20, color=GREY)
        healthy_label.move_to(healthy_rect.get_center())

        self.play(Create(base_rect))
        self.play(
            FadeIn(disease_rect),
            Write(disease_label)
        )
        self.play(
            FadeIn(healthy_rect),
            Write(healthy_label)
        )
        self.wait(1)

        # Test results overlay
        true_pos_rect = Rectangle(
            width=disease_width,
            height=rect_height * 0.95,
            fill_color=LIKELIHOOD_COLOR,
            fill_opacity=0.6,
            stroke_color=LIKELIHOOD_COLOR,
            stroke_width=2
        )
        true_pos_rect.align_to(disease_rect, DL)

        false_pos_rect = Rectangle(
            width=rect_width - disease_width,
            height=rect_height * 0.05,
            fill_color=RED,
            fill_opacity=0.5,
            stroke_color=RED,
            stroke_width=2
        )
        false_pos_rect.align_to(healthy_rect, DL)

        test_label = Text("Test Positive Areas:", font_size=24, color=YELLOW)
        test_label.to_edge(DOWN, buff=0.4)  # Safe bottom zone

        self.play(Write(test_label))
        self.play(
            FadeIn(true_pos_rect),
            FadeIn(false_pos_rect),
            run_time=1
        )
        self.wait(2)

        # SECTION 4: Calculation (clear screen)
        self.play(
            FadeOut(VGroup(
                base_rect, disease_rect, healthy_rect,
                disease_label, healthy_label,
                true_pos_rect, false_pos_rect,
                test_label
            )),
            run_time=0.6
        )

        # Calculation - properly grouped and centered
        calc_title = Text("If you test positive:", font_size=32, color=YELLOW)
        calc_title.to_edge(UP, buff=1)

        self.play(Write(calc_title))
        self.wait(0.5)

        # Steps arranged vertically with consistent spacing
        steps = VGroup(
            MathTex(r"P(D|+) = \frac{P(+|D) \cdot P(D)}{P(+)}", font_size=32),
            MathTex(r"= \frac{0.95 \times 0.01}{0.0095 + 0.0495}", font_size=30),
            MathTex(r"= \frac{0.0095}{0.059}", font_size=30),
            MathTex(r"= 0.161 = 16.1\%", font_size=32, color=YELLOW)
        )
        steps.arrange(DOWN, buff=0.4)
        steps.next_to(calc_title, DOWN, buff=0.6)

        # Animate each step
        for step in steps:
            self.play(Write(step), run_time=0.8)
            self.wait(0.5)

        # Highlight result
        result_box = SurroundingRectangle(steps[-1], color=YELLOW, buff=0.15)
        self.play(Create(result_box))
        self.wait(1)

        # SECTION 5: Key insight (clear calculations)
        self.play(
            FadeOut(VGroup(calc_title, steps[:-1], result_box)),
            steps[-1].animate.move_to(ORIGIN + UP * 2),
            run_time=0.6
        )

        surprise = Text(
            "Only 16% actually have the disease!",
            font_size=34,
            color=YELLOW,
            weight=BOLD
        )
        surprise.next_to(steps[-1], DOWN, buff=0.6)

        self.play(Write(surprise), Flash(steps[-1], color=YELLOW))
        self.wait(1.5)

        # Key insights - grouped and positioned safely
        insights = VGroup(
            Text("Key Insights:", font_size=28, color=BLUE_B, weight=BOLD),
            Text("• Base rate (prior) matters", font_size=22),
            Text("• Rare diseases stay rare", font_size=22),
            Text("• Don't ignore context!", font_size=22, color=RED),
        )
        insights.arrange(DOWN, aligned_edge=LEFT, buff=0.25)
        insights.next_to(surprise, DOWN, buff=0.8)

        self.play(LaggedStart(
            *[FadeIn(item, shift=UP) for item in insights],
            lag_ratio=0.2
        ), run_time=2)
        self.wait(3)


class SpatialLayoutDemo(Scene):
    """Demonstrates proper spatial layout techniques"""

    def construct(self):
        title = Text("Spatial Layout Best Practices", font_size=40)
        title.to_edge(UP, buff=0.4)
        self.play(Write(title))
        self.wait(0.5)

        # Show safe zones
        safe_zones = VGroup(
            Rectangle(width=14, height=1, color=GREEN, stroke_opacity=0.3),
            Text("Safe Top Zone", font_size=20, color=GREEN)
        )
        safe_zones[0].shift(UP * 3.2)
        safe_zones[1].move_to(safe_zones[0])

        middle_zone = VGroup(
            Rectangle(width=14, height=4, color=BLUE, stroke_opacity=0.3),
            Text("Content Area", font_size=24, color=BLUE)
        )
        middle_zone[0].move_to(ORIGIN)
        middle_zone[1].move_to(middle_zone[0])

        bottom_zone = VGroup(
            Rectangle(width=14, height=1, color=YELLOW, stroke_opacity=0.3),
            Text("Safe Bottom Zone", font_size=20, color=YELLOW)
        )
        bottom_zone[0].shift(DOWN * 3.2)
        bottom_zone[1].move_to(bottom_zone[0])

        self.play(
            Create(safe_zones[0]),
            Create(middle_zone[0]),
            Create(bottom_zone[0])
        )
        self.play(
            Write(safe_zones[1]),
            Write(middle_zone[1]),
            Write(bottom_zone[1])
        )
        self.wait(2)

        # Demonstrate proper grouping
        self.play(FadeOut(VGroup(safe_zones, middle_zone, bottom_zone)))

        demo_title = Text("Use VGroup + arrange()", font_size=32)
        demo_title.next_to(title, DOWN, buff=0.5)
        self.play(Write(demo_title))

        # Bad example
        bad_label = Text("❌ Fixed positions (Bad):", font_size=24, color=RED)
        bad_label.shift(LEFT * 3 + UP * 1)

        bad_items = VGroup(
            Text("Item 1", font_size=20).shift(LEFT * 3 + UP * 0.5),
            Text("Item 2", font_size=20).shift(LEFT * 3 + UP * 0.2),  # Might overlap!
            Text("Item 3", font_size=20).shift(LEFT * 3 - UP * 0.1)
        )

        self.play(Write(bad_label))
        self.play(LaggedStart(*[Write(item) for item in bad_items], lag_ratio=0.2))
        self.wait(1)

        # Good example
        good_label = Text("✓ VGroup + arrange (Good):", font_size=24, color=GREEN)
        good_label.shift(RIGHT * 3 + UP * 1)

        good_items = VGroup(
            Text("Item 1", font_size=20),
            Text("Item 2", font_size=20),
            Text("Item 3", font_size=20)
        )
        good_items.arrange(DOWN, buff=0.3, aligned_edge=LEFT)  # Consistent spacing!
        good_items.shift(RIGHT * 3 + UP * 0.3)

        self.play(Write(good_label))
        self.play(LaggedStart(*[Write(item) for item in good_items], lag_ratio=0.2))
        self.wait(2)
