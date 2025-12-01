#!/usr/bin/env python3
import subprocess
import shutil
import sys
from pathlib import Path


def build_layer(lambda_dir: str) -> None:
    lambda_path = Path(lambda_dir).resolve()
    requirements_file = lambda_path / "requirements.txt"
    layer_dir = lambda_path / "layer"
    python_dir = layer_dir / "python"

    if not requirements_file.exists():
        print(f"Error: {requirements_file} not found")
        sys.exit(1)

    if layer_dir.exists():
        print(f"Cleaning previous layer: {layer_dir}")
        shutil.rmtree(layer_dir)

    python_dir.mkdir(parents=True, exist_ok=True)
    print(f"Created layer directory: {python_dir}")

    print(f"Installing dependencies from: {requirements_file}")
    result = subprocess.run(
        [
            sys.executable,
            "-m",
            "pip",
            "install",
            "-r",
            str(requirements_file),
            "-t",
            str(python_dir),
            "--quiet",
            "--upgrade",
        ],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:
        print(f"Error installing dependencies: {result.stderr}")
        sys.exit(1)

    print("Lambda Layer dependencies installed successfully")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <lambda_directory>")
        sys.exit(1)

    build_layer(sys.argv[1])
