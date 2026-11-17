"""
ARES — Autonomous Research & Evidence System
Unified Runner Script
"""
import sys
import os
from pathlib import Path

# Add backend directory to path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR / "backend"))

def main():
    print("=" * 70)
    print("   ARES — Autonomous Research & Evidence System")
    print("   Agentic AI-Powered Cybersecurity Research Platform")
    print("=" * 70)
    print("Starting ARES server on http://localhost:8000 ...")
    print("API Documentation:  http://localhost:8000/docs")
    print("Interactive UI:     http://localhost:8000/")
    print("Press Ctrl+C to terminate.")
    print("=" * 70)

    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)

if __name__ == "__main__":
    main()
