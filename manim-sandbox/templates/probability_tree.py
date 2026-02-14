"""
Template: probability_tree
Description: Draw a probability tree diagram

Parameters:
  - branches: list - Tree structure as nested lists
  - probabilities: list - Probabilities for each branch
  - labels: list - Labels for each outcome

Example structure:
  branches = [
    ["A", ["B", "C"]],  # First level: A splits into B and C
  ]
  probabilities = [[0.6, 0.4]]  # P(B|A) = 0.6, P(C|A) = 0.4
  labels = ["Event 1", "Event 2"]

Render command for testing:
  docker-compose run --rm manim manim -pql templates/probability_tree.py ProbabilityTreeScene
"""

from manim import *


class ProbabilityTreeScene(Scene):
    """
    Draws a probability tree diagram.
    Customize by setting class attributes.
    """

    # Simple two-level tree by default
    level1_labels = ["A", "B"]
    level1_probs = [0.6, 0.4]
    level2_labels = [["C", "D"], ["E", "F"]]
    level2_probs = [[0.7, 0.3], [0.5, 0.5]]
    title_text = "Probability Tree"

    def construct(self):
        # Title
        title = Text(self.title_text, font_size=40)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # Starting point
        start = Dot(ORIGIN + LEFT * 4)
        start_label = Text("Start", font_size=24)
        start_label.next_to(start, LEFT)

        self.play(Create(start), Write(start_label))
        self.wait(0.5)

        # First level branches
        level1_nodes = []
        level1_edges = []
        level1_texts = []

        y_spacing = 2
        x_offset = 2

        for i, (label, prob) in enumerate(zip(self.level1_labels, self.level1_probs)):
            # Position
            y_pos = y_spacing - i * (2 * y_spacing / (len(self.level1_labels) - 1)) if len(self.level1_labels) > 1 else 0
            end_point = start.get_center() + RIGHT * x_offset + UP * y_pos

            # Node
            node = Dot(end_point)
            level1_nodes.append(node)

            # Edge
            edge = Line(start.get_center(), end_point)
            level1_edges.append(edge)

            # Label
            label_text = Text(label, font_size=28)
            label_text.next_to(node, RIGHT, buff=0.2)
            level1_texts.append(label_text)

            # Probability
            prob_text = Text(f"{prob:.2f}", font_size=20, color=BLUE)
            prob_text.next_to(edge.get_center(), UP if y_pos > 0 else DOWN, buff=0.1)

            # Animate
            self.play(Create(edge), Create(node))
            self.play(Write(label_text), Write(prob_text))

        self.wait(1)

        # Second level branches
        for i, (parent_node, outcomes, probs) in enumerate(zip(level1_nodes, self.level2_labels, self.level2_probs)):
            for j, (outcome, prob) in enumerate(zip(outcomes, probs)):
                y_spacing_2 = 1
                y_pos = y_spacing_2 - j * (2 * y_spacing_2 / (len(outcomes) - 1)) if len(outcomes) > 1 else 0
                end_point = parent_node.get_center() + RIGHT * x_offset + UP * y_pos

                # Node
                node = Dot(end_point)

                # Edge
                edge = Line(parent_node.get_center(), end_point)

                # Label
                label_text = Text(outcome, font_size=24)
                label_text.next_to(node, RIGHT, buff=0.2)

                # Probability
                prob_text = Text(f"{prob:.2f}", font_size=18, color=GREEN)
                prob_text.next_to(edge.get_center(), UP if y_pos > 0 else DOWN, buff=0.1)

                # Animate
                self.play(Create(edge), Create(node), run_time=0.5)
                self.play(Write(label_text), Write(prob_text), run_time=0.5)

        self.wait(2)


# Example: Coin flip twice
class CoinFlipTree(ProbabilityTreeScene):
    level1_labels = ["H", "T"]
    level1_probs = [0.5, 0.5]
    level2_labels = [["H", "T"], ["H", "T"]]
    level2_probs = [[0.5, 0.5], [0.5, 0.5]]
    title_text = "Two Coin Flips"


# Example: Weather prediction
class WeatherTree(ProbabilityTreeScene):
    level1_labels = ["Sunny", "Rainy"]
    level1_probs = [0.7, 0.3]
    level2_labels = [["Sunny", "Rainy"], ["Sunny", "Rainy"]]
    level2_probs = [[0.8, 0.2], [0.4, 0.6]]
    title_text = "Weather Prediction"


# Example: Medical test
class MedicalTestTree(ProbabilityTreeScene):
    level1_labels = ["Disease", "Healthy"]
    level1_probs = [0.01, 0.99]
    level2_labels = [["Positive", "Negative"], ["Positive", "Negative"]]
    level2_probs = [[0.95, 0.05], [0.02, 0.98]]
    title_text = "Medical Test Results"
