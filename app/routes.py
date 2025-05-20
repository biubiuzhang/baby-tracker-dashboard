from flask import Blueprint, render_template, request, redirect, url_for
from datetime import datetime
from pathlib import Path

main = Blueprint('main', __name__)
LOG_DIR = Path.home() / "baby-logs"
ACTIVITY_MAP = {
    "Blue": "Feeding",
    "Red": "Diaper Change",
    "Green": "Pee",
    "Yellow": "Poo",
    "Black": "Bath"
}

@main.route("/")
def index():
    today = datetime.now().strftime("%Y-%m-%d")
    log_file = LOG_DIR / f"log-{today}.txt"
    counts = {activity: 0 for activity in ACTIVITY_MAP.values()}

    if log_file.exists():
        with open(log_file) as f:
            for line in f:
                for color, activity in ACTIVITY_MAP.items():
                    if line.strip().endswith(color):
                        counts[activity] += 1

    return render_template("index.html", counts=counts, today=today)

@main.route("/add", methods=["POST"])
def add_entry():
    color = request.form.get("color")
    if color not in ACTIVITY_MAP:
        return "Invalid input", 400
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    today = datetime.now().strftime("%Y-%m-%d")
    log_file = LOG_DIR / f"log-{today}.txt"
    with open(log_file, "a") as f:
        f.write(f"{now} {color}\n")
    return redirect(url_for("main.index"))
