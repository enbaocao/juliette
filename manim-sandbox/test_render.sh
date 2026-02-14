#!/bin/bash

# Quick test script for rendering Manim templates
# Usage: ./test_render.sh [template_name] [quality]
#
# Examples:
#   ./test_render.sh function_graph           # Render with default quality (low)
#   ./test_render.sh vector_addition high     # Render with high quality
#   ./test_render.sh                          # List available templates

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Available templates
TEMPLATES=(
    "function_graph"
    "vector_addition"
    "probability_tree"
    "calculus_derivative"
    "geometry_diagram"
)

# Quality options
QUALITY=${2:-"low"}
case $QUALITY in
    low|l)
        QUALITY_FLAG="-ql"
        ;;
    medium|m)
        QUALITY_FLAG="-qm"
        ;;
    high|h)
        QUALITY_FLAG="-qh"
        ;;
    4k|k)
        QUALITY_FLAG="-qk"
        ;;
    *)
        echo -e "${RED}Invalid quality: $QUALITY${NC}"
        echo "Valid options: low, medium, high, 4k"
        exit 1
        ;;
esac

# Function to list templates
list_templates() {
    echo -e "${BLUE}Available templates:${NC}"
    for template in "${TEMPLATES[@]}"; do
        echo -e "  ${GREEN}•${NC} $template"
    done
    echo ""
    echo -e "${YELLOW}Usage:${NC}"
    echo "  ./test_render.sh <template_name> [quality]"
    echo ""
    echo -e "${YELLOW}Quality options:${NC} low (default), medium, high, 4k"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  ./test_render.sh function_graph"
    echo "  ./test_render.sh vector_addition high"
}

# Check if template is provided
if [ -z "$1" ]; then
    list_templates
    exit 0
fi

TEMPLATE=$1

# Validate template
if [[ ! " ${TEMPLATES[@]} " =~ " ${TEMPLATE} " ]]; then
    echo -e "${RED}Error: Template '$TEMPLATE' not found${NC}"
    echo ""
    list_templates
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running${NC}"
    echo "Please start Docker and try again."
    exit 1
fi

# Render the template
echo -e "${BLUE}Rendering template: ${GREEN}$TEMPLATE${NC}"
echo -e "${BLUE}Quality: ${GREEN}$QUALITY${NC}"
echo ""

# Render without -p flag (preview doesn't work from Docker on macOS)
docker-compose run --rm manim \
    manim $QUALITY_FLAG templates/${TEMPLATE}.py

echo ""
echo -e "${GREEN}✓ Rendering complete!${NC}"
echo -e "${YELLOW}Output files are in: ${NC}./output/videos/"

# Auto-open the video on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo -e "${BLUE}Opening video...${NC}"
    # Find the most recently created mp4 file in output directory
    LATEST_VIDEO=$(find output/videos/${TEMPLATE} -name "*.mp4" -type f ! -path "*/partial_movie_files/*" -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -n 1)
    if [ -n "$LATEST_VIDEO" ]; then
        open "$LATEST_VIDEO"
        echo -e "${GREEN}Opened: ${NC}$LATEST_VIDEO"
    else
        echo -e "${YELLOW}Video rendered but couldn't auto-open. Check: ${NC}./output/videos/${TEMPLATE}/"
    fi
fi
