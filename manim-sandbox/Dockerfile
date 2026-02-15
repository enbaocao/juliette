FROM manimcommunity/manim:stable

# Set working directory
WORKDIR /manim

# Copy requirements if we need additional packages
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy templates and examples
COPY templates/ ./templates/
COPY examples/ ./examples/

# Default command
CMD ["bash"]
