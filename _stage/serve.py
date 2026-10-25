"""Start the Sway API from any working directory: python path/to/sway/serve.py [--port 8787 ...]"""
import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)
os.chdir(ROOT)

from sway.server import main  # noqa: E402

main()
