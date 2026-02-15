"""
Counting Problems in Probability
Clear visualization of permutations vs combinations

Shows: Choosing 3 people from 5
- With order (Permutations): 60 ways
- Without order (Combinations): 10 ways

Render command:
  docker-compose run --rm manim manim -ql examples/counting_problems.py CountingProblems
"""

from manim import *


class CountingProblems(Scene):
    def construct(self):
        # SECTION 1: Title and scenario
        title = Text("Counting Problems", font_size=44, weight=BOLD)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.5)

        # Scenario
        scenario = Text(
            "Choose 3 people from 5 for a committee",
            font_size=32,
            color=BLUE_B
        )
        scenario.next_to(title, DOWN, buff=0.6)
        self.play(Write(scenario))
        self.wait(1)

        # Show the 5 people
        people = VGroup(*[
            Circle(radius=0.4, fill_color=BLUE, fill_opacity=0.8).add(
                Text(chr(65+i), font_size=32, color=WHITE)
            )
            for i in range(5)
        ])
        people.arrange(RIGHT, buff=0.5)
        people.next_to(scenario, DOWN, buff=0.8)

        self.play(LaggedStart(
            *[FadeIn(person, scale=0.5) for person in people],
            lag_ratio=0.15
        ), run_time=1.5)
        self.wait(1)

        # KEY QUESTION
        question = Text(
            "Does ORDER matter?",
            font_size=36,
            color=YELLOW,
            weight=BOLD
        )
        question.to_edge(DOWN, buff=0.5)
        self.play(Write(question), Flash(question, color=YELLOW))
        self.wait(1.5)

        # Clear for Case 1
        self.play(
            FadeOut(VGroup(scenario, people, question)),
            run_time=0.5
        )

        # SECTION 2: Case 1 - ORDER MATTERS (Permutations)
        case1_title = Text(
            "Case 1: Order MATTERS",
            font_size=36,
            color=RED,
            weight=BOLD
        )
        case1_title.next_to(title, DOWN, buff=0.6)

        roles = Text(
            "(President, VP, Secretary)",
            font_size=26,
            color=RED_C
        )
        roles.next_to(case1_title, DOWN, buff=0.3)

        self.play(Write(case1_title))
        self.play(FadeIn(roles, shift=DOWN))
        self.wait(1)

        # Show the formula
        perm_formula = MathTex(
            r"P(n,k) = \frac{n!}{(n-k)!}",
            font_size=38
        )
        perm_formula.next_to(roles, DOWN, buff=0.7)

        self.play(Write(perm_formula))
        self.wait(1)

        # Calculate
        calc1 = VGroup(
            MathTex(r"P(5,3) = \frac{5!}{(5-3)!}", font_size=34),
            MathTex(r"= \frac{5!}{2!}", font_size=34),
            MathTex(r"= \frac{120}{2}", font_size=34),
            MathTex(r"= 60", font_size=40, color=RED)
        )
        calc1.arrange(DOWN, buff=0.3)
        calc1.next_to(perm_formula, DOWN, buff=0.6)

        for step in calc1:
            self.play(Write(step), run_time=0.6)
            self.wait(0.4)

        # Highlight result
        result1_box = SurroundingRectangle(calc1[-1], color=RED, buff=0.15)
        self.play(Create(result1_box))

        result1_text = Text("60 different arrangements!", font_size=28, color=RED)
        result1_text.to_edge(DOWN, buff=0.5)
        self.play(Write(result1_text))
        self.wait(2)

        # Clear for Case 2
        self.play(
            FadeOut(VGroup(
                case1_title, roles, perm_formula,
                calc1, result1_box, result1_text
            )),
            run_time=0.6
        )

        # SECTION 3: Case 2 - ORDER DOESN'T MATTER (Combinations)
        case2_title = Text(
            "Case 2: Order DOESN'T matter",
            font_size=36,
            color=GREEN,
            weight=BOLD
        )
        case2_title.next_to(title, DOWN, buff=0.6)

        just_members = Text(
            "(Just 3 members, no roles)",
            font_size=26,
            color=GREEN_C
        )
        just_members.next_to(case2_title, DOWN, buff=0.3)

        self.play(Write(case2_title))
        self.play(FadeIn(just_members, shift=DOWN))
        self.wait(1)

        # Show the formula
        comb_formula = MathTex(
            r"C(n,k) = \frac{n!}{k!(n-k)!}",
            font_size=38
        )
        comb_formula.next_to(just_members, DOWN, buff=0.7)

        self.play(Write(comb_formula))
        self.wait(1)

        # Calculate
        calc2 = VGroup(
            MathTex(r"C(5,3) = \frac{5!}{3! \times 2!}", font_size=34),
            MathTex(r"= \frac{120}{6 \times 2}", font_size=34),
            MathTex(r"= \frac{120}{12}", font_size=34),
            MathTex(r"= 10", font_size=40, color=GREEN)
        )
        calc2.arrange(DOWN, buff=0.3)
        calc2.next_to(comb_formula, DOWN, buff=0.6)

        for step in calc2:
            self.play(Write(step), run_time=0.6)
            self.wait(0.4)

        # Highlight result
        result2_box = SurroundingRectangle(calc2[-1], color=GREEN, buff=0.15)
        self.play(Create(result2_box))

        result2_text = Text("Only 10 different groups!", font_size=28, color=GREEN)
        result2_text.to_edge(DOWN, buff=0.5)
        self.play(Write(result2_text))
        self.wait(2)

        # SECTION 4: Comparison
        self.play(
            FadeOut(VGroup(
                case2_title, just_members, comb_formula,
                calc2, result2_box, result2_text
            )),
            run_time=0.5
        )

        # Side by side comparison
        comparison_title = Text("The Difference", font_size=38, color=YELLOW)
        comparison_title.next_to(title, DOWN, buff=0.6)
        self.play(Write(comparison_title))
        self.wait(0.5)

        # Left: Permutations
        left = VGroup(
            Text("Order MATTERS", font_size=28, color=RED, weight=BOLD),
            Text("Permutations", font_size=24, color=RED_C),
            MathTex(r"P(5,3) = 60", font_size=36, color=RED)
        )
        left.arrange(DOWN, buff=0.3)
        left.shift(LEFT * 3 + DOWN * 0.5)

        # Right: Combinations
        right = VGroup(
            Text("Order DOESN'T matter", font_size=28, color=GREEN, weight=BOLD),
            Text("Combinations", font_size=24, color=GREEN_C),
            MathTex(r"C(5,3) = 10", font_size=36, color=GREEN)
        )
        right.arrange(DOWN, buff=0.3)
        right.shift(RIGHT * 3 + DOWN * 0.5)

        self.play(
            FadeIn(left, shift=RIGHT),
            FadeIn(right, shift=LEFT),
            run_time=1.2
        )
        self.wait(1)

        # Show the relationship
        relationship = MathTex(
            r"C(n,k) = \frac{P(n,k)}{k!}",
            font_size=36,
            color=YELLOW
        )
        relationship.next_to(comparison_title, DOWN, buff=3)

        explanation = Text(
            "Combinations = Permutations ÷ (ways to arrange k items)",
            font_size=22,
            color=BLUE_B
        )
        explanation.next_to(relationship, DOWN, buff=0.4)

        self.play(Write(relationship))
        self.wait(0.8)
        self.play(Write(explanation))
        self.wait(2)

        # KEY INSIGHT
        self.play(FadeOut(VGroup(left, right, explanation)))

        insight_box = Rectangle(
            width=11, height=1.8,
            fill_color=YELLOW, fill_opacity=0.2,
            stroke_color=YELLOW, stroke_width=3
        )
        insight_box.next_to(relationship, DOWN, buff=0.8)

        insight = VGroup(
            Text("Key Question:", font_size=28, color=YELLOW, weight=BOLD),
            Text("Does the order of selection matter?", font_size=26)
        )
        insight.arrange(DOWN, buff=0.2)
        insight.move_to(insight_box)

        self.play(
            FadeIn(insight_box),
            Write(insight),
            run_time=1.2
        )
        self.wait(3)


class VisualCounting(Scene):
    """Visual demonstration with actual groups"""

    def construct(self):
        title = Text("Combinations: The Visual Way", font_size=40)
        title.to_edge(UP, buff=0.3)
        self.play(Write(title))
        self.wait(0.5)

        # Show 4 people, choose 2
        subtitle = Text("Choose 2 from {A, B, C, D}", font_size=28, color=BLUE_B)
        subtitle.next_to(title, DOWN, buff=0.5)
        self.play(Write(subtitle))
        self.wait(0.8)

        # Show all possible combinations visually
        groups = [
            ("A", "B"), ("A", "C"), ("A", "D"),
            ("B", "C"), ("B", "D"),
            ("C", "D")
        ]

        group_mobs = VGroup()
        for pair in groups:
            pair_group = VGroup(
                Circle(radius=0.3, fill_color=BLUE, fill_opacity=0.7).add(
                    Text(pair[0], font_size=24, color=WHITE)
                ),
                Circle(radius=0.3, fill_color=GREEN, fill_opacity=0.7).add(
                    Text(pair[1], font_size=24, color=WHITE)
                )
            )
            pair_group.arrange(RIGHT, buff=0.2)

            # Wrap in rectangle
            box = SurroundingRectangle(pair_group, color=YELLOW, buff=0.15)
            full_group = VGroup(pair_group, box)
            group_mobs.add(full_group)

        # Arrange in grid
        group_mobs.arrange_in_grid(rows=2, cols=3, buff=0.8)
        group_mobs.next_to(subtitle, DOWN, buff=0.8)

        # Animate each group
        self.play(LaggedStart(
            *[FadeIn(g, scale=0.7) for g in group_mobs],
            lag_ratio=0.2
        ), run_time=3)
        self.wait(1)

        # Count them
        count_text = Text("6 total combinations", font_size=32, color=YELLOW, weight=BOLD)
        count_text.to_edge(DOWN, buff=0.6)

        formula = MathTex(r"C(4,2) = \frac{4!}{2! \times 2!} = 6", font_size=32)
        formula.next_to(count_text, UP, buff=0.4)

        self.play(Write(formula))
        self.play(Write(count_text), Flash(count_text, color=YELLOW))
        self.wait(2)
