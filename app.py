"""
AI-Learning Experience Dashboard — Flask Backend
Dataset: Global Student Perceptions of ChatGPT
Source : Ravšelj et al. (2025). PLoS ONE, 20(2), e0315011
Kaggle : https://www.kaggle.com/datasets/jocelyndumlao/global-student-perceptions-of-chatgpt

Column mapping verified against:
  - CSV header row supplied by student
  - Published questionnaire (Ravšelj et al., 2025)
  - Mendeley codebook (DOI: 10.17632/ymg9nsn6kn.2)

HOW TO RUN:
  1. pip install flask flask-cors pandas numpy
  2. Place the dataset CSV (renamed) as: chatgpt_student_perceptions.csv
     in the same directory as this file.
  3. python app.py
  4. Open index.html (via VS Code Live Server or browser directly)
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
import os

app = Flask(__name__)
CORS(app)

CSV_PATH = "chatgpt_student_perceptions.csv"

# ══════════════════════════════════════════════════════════════════════════════
#  COLUMN MAPPING  (verified against CSV header row)
#  Sociodemographic
# ══════════════════════════════════════════════════════════════════════════════
COL_COUNTRY     = "Q1"   # Country of residence
COL_GENDER      = "Q2"   # Gender  (1=Male, 2=Female, 3=Other)
COL_AGE         = "Q3"   # Age (numeric)
COL_NATIONALITY = "Q4"   # Nationality
COL_INSTITUTION = "Q5"   # Institution name
COL_LEVEL       = "Q6"   # Level of study (1=Bachelor, 2=Master, 3=PhD, 4=Other)
COL_YEAR        = "Q7"   # Year of study
COL_FIELD       = "Q8"   # Field of study (1=Natural Sci, 2=Social Sci, 3=Humanities,
                          #                 4=Applied Sci, 5=Health, 6=Arts, 7=Other)
COL_EMPLOYMENT  = "Q9"   # Employment status
COL_INCOME      = "Q10"  # Income region (World Bank classification)

# ChatGPT awareness / first use
COL_AWARENESS   = "Q11"  # When did you first hear about ChatGPT?
COL_FIRST_USE   = "Q12"  # When did you first use ChatGPT?
COL_FREQ_USE    = "Q13"  # How often do you currently use ChatGPT?
                          # 1=Never, 2=Rarely, 3=Sometimes, 4=Often, 5=Always

# ── Usage purposes Q18a–Q18l (5-point frequency: 1=Never … 5=Always) ────────
USAGE_COLS = {
    "Brainstorming ideas":      "Q18a",
    "Summarising texts":        "Q18b",
    "Finding research":         "Q18c",
    "Homework help":            "Q18d",
    "Professional writing":     "Q18e",
    "Creative writing":         "Q18f",
    "Language translation":     "Q18g",
    "Exam preparation":         "Q18h",
    "Coding assistance":        "Q18i",
    "Personal queries":         "Q18j",
    "Entertainment":            "Q18k",
    "Other purposes":           "Q18l",
}

# ── Perceived capabilities Q19a–Q19j (1=Strongly Disagree … 5=Strongly Agree)
CAPABILITY_COLS = {
    "Simplifies complex info":      "Q19a",
    "Summarises content well":      "Q19b",
    "Supports independent learning":"Q19c",
    "Encourages critical thinking": "Q19d",
    "Provides accurate answers":    "Q19e",
    "Understands context":          "Q19f",
    "Generates creative content":   "Q19g",
    "Assists with research":        "Q19h",
    "Improves writing quality":     "Q19i",
    "Saves study time":             "Q19j",
}

# ── Regulation & ethical concerns Q22a–Q22j (1=Strongly Disagree … 5=Strongly Agree)
ETHICS_COLS = {
    "Promotes cheating":            "Q22a",
    "Promotes plagiarism":          "Q22b",
    "Risk of social isolation":     "Q22c",
    "Needs AI regulation":          "Q22d",
    "Threatens academic integrity": "Q22e",
    "Raises data privacy concerns": "Q22f",
    "Perpetuates bias/inequality":  "Q22g",
    "Reduces critical thinking":    "Q22h",
    "Should be banned in education":"Q22i",
    "Institutions need AI policy":  "Q22j",
}

# ── Satisfaction & attitude Q23a–Q23d (1=Very Dissatisfied … 5=Very Satisfied)
SATISFACTION_COLS = {
    "Overall satisfaction":         "Q23a",
    "Ease of use":                  "Q23b",
    "Usefulness for studying":      "Q23c",
    "Reliability of responses":     "Q23d",
}

# ── Study issues & outcomes Q24a–Q24g (1=Strongly Disagree … 5=Strongly Agree)
OUTCOME_COLS = {
    "Improved my grades":           "Q24a",
    "Increased study efficiency":   "Q24b",
    "Easier access to knowledge":   "Q24c",
    "Reduced study stress":         "Q24d",
    "Helped understand concepts":   "Q24e",
    "Reduced motivation to study":  "Q24f",
    "Made me over-dependent on AI": "Q24g",
}

# ── Skills development Q25a–Q25d (1=Strongly Disagree … 5=Strongly Agree)
SKILLS_COLS = {
    "Improved digital literacy":    "Q25a",
    "Improved writing skills":      "Q25b",
    "Improved research skills":     "Q25c",
    "Improved problem-solving":     "Q25d",
}

# ── Emotions Q30a–Q30l (binary: 1=selected)
EMOTION_COLS = {
    "Curiosity":    "Q30a",
    "Excitement":   "Q30b",
    "Calmness":     "Q30c",
    "Confidence":   "Q30d",
    "Anxiety":      "Q30e",
    "Frustration":  "Q30f",
    "Confusion":    "Q30g",
    "Distrust":     "Q30h",
    "Indifference": "Q30i",
    "Enthusiasm":   "Q30j",
    "Overwhelm":    "Q30k",
    "Satisfaction": "Q30l",
}

# ── Field of study labels (Q8 numeric → text) ──────────────────────────────
FIELD_LABELS = {
    1: "Natural Sciences",
    2: "Social Sciences",
    3: "Humanities",
    4: "Applied Sciences",
    5: "Health Sciences",
    6: "Arts",
    7: "Other",
}

# ── Study level labels (Q6) ─────────────────────────────────────────────────
LEVEL_LABELS = {
    1: "Bachelor",
    2: "Master",
    3: "PhD",
    4: "Other",
}

# ── Gender labels (Q2) ──────────────────────────────────────────────────────
GENDER_LABELS = {
    1: "Male",
    2: "Female",
    3: "Other / Prefer not to say",
}

# ── Usage frequency labels (Q13) ────────────────────────────────────────────
FREQ_LABELS = {
    1: "Never",
    2: "Rarely",
    3: "Sometimes",
    4: "Often",
    5: "Always / Daily",
}

# ══════════════════════════════════════════════════════════════════════════════
#  Helpers
# ══════════════════════════════════════════════════════════════════════════════
def load_data():
    if not os.path.exists(CSV_PATH):
        raise FileNotFoundError(
            f"'{CSV_PATH}' not found. Download from Kaggle and rename the CSV."
        )
    # Try encodings in order: UTF-8-sig handles BOM, latin-1 covers most Windows/Excel CSVs
    for enc in ("utf-8-sig", "latin-1", "cp1252", "utf-8"):
        try:
            df = pd.read_csv(CSV_PATH, low_memory=False, encoding=enc)
            df.columns = df.columns.str.strip()
            return df
        except (UnicodeDecodeError, pd.errors.ParserError):
            continue
    raise ValueError("Could not decode CSV with any supported encoding.")

def safe_mean(series):
    vals = pd.to_numeric(series, errors="coerce").dropna()
    return round(float(vals.mean()), 2) if len(vals) else 0.0

def col_ok(df, col):
    return col in df.columns

def value_counts_labeled(df, col, label_map):
    if not col_ok(df, col):
        return []
    vc = pd.to_numeric(df[col], errors="coerce").dropna().astype(int).value_counts().sort_index()
    return [{"label": label_map.get(k, str(k)), "count": int(v)} for k, v in vc.items()]

def col_mean_by_group(df, group_col, value_col, label_map=None):
    """Return list of {label, value} dicts for a numeric column grouped by another."""
    if not col_ok(df, group_col) or not col_ok(df, value_col):
        return []
    df = df.copy()
    df[value_col] = pd.to_numeric(df[value_col], errors="coerce")
    df[group_col] = pd.to_numeric(df[group_col], errors="coerce")
    result = df.groupby(group_col)[value_col].mean().dropna().round(2)
    out = []
    for k, v in result.items():
        lbl = label_map.get(int(k), str(int(k))) if label_map else str(k)
        out.append({"label": lbl, "value": round(float(v), 2)})
    return out

# ══════════════════════════════════════════════════════════════════════════════
#  ROUTES
# ══════════════════════════════════════════════════════════════════════════════

@app.route("/api/summary")
def summary():
    df = load_data()
    total = len(df)
    countries = int(df[COL_COUNTRY].nunique()) if col_ok(df, COL_COUNTRY) else 0

    existing_usage = [c for c in USAGE_COLS.values() if col_ok(df, c)]
    avg_usage = safe_mean(
        df[existing_usage].apply(pd.to_numeric, errors="coerce").mean(axis=1)
    ) if existing_usage else 0.0

    existing_ethics = {k: v for k, v in ETHICS_COLS.items() if col_ok(df, v)}
    if existing_ethics:
        means = {label: safe_mean(df[col]) for label, col in existing_ethics.items()}
        top_concern = max(means, key=means.get)
        top_score   = means[top_concern]
    else:
        top_concern, top_score = "N/A", 0.0

    avg_satisfaction = safe_mean(
        df[[c for c in SATISFACTION_COLS.values() if col_ok(df, c)]]
        .apply(pd.to_numeric, errors="coerce").mean(axis=1)
    ) if any(col_ok(df, c) for c in SATISFACTION_COLS.values()) else 0.0

    return jsonify({
        "total_respondents":          total,
        "countries":                  countries,
        "avg_usage_score":            avg_usage,
        "avg_satisfaction":           avg_satisfaction,
        "top_ethical_concern":        top_concern,
        "top_ethical_concern_score":  top_score,
    })


@app.route("/api/usage")
def usage():
    df = load_data()
    return jsonify([
        {"activity": label, "avg_score": safe_mean(df[col])}
        for label, col in USAGE_COLS.items() if col_ok(df, col)
    ])


@app.route("/api/usage-frequency")
def usage_frequency():
    """Distribution of overall ChatGPT usage frequency (Q13)."""
    df = load_data()
    return jsonify(value_counts_labeled(df, COL_FREQ_USE, FREQ_LABELS))


@app.route("/api/usage-by-field")
def usage_by_field():
    df = load_data()
    existing = [c for c in USAGE_COLS.values() if col_ok(df, c)]
    if not existing or not col_ok(df, COL_FIELD):
        return jsonify([])
    df = df.copy()
    df["_avg"] = df[existing].apply(pd.to_numeric, errors="coerce").mean(axis=1)
    return jsonify(col_mean_by_group(df, COL_FIELD, "_avg", FIELD_LABELS))


@app.route("/api/capabilities")
def capabilities():
    df = load_data()
    return jsonify([
        {"capability": label, "avg_score": safe_mean(df[col])}
        for label, col in CAPABILITY_COLS.items() if col_ok(df, col)
    ])


@app.route("/api/ethics")
def ethics():
    df = load_data()
    return jsonify([
        {"concern": label, "avg_score": safe_mean(df[col])}
        for label, col in ETHICS_COLS.items() if col_ok(df, col)
    ])


@app.route("/api/ethics-by-field")
def ethics_by_field():
    df = load_data()
    if not col_ok(df, COL_FIELD):
        return jsonify([])
    result = []
    for label, col in ETHICS_COLS.items():
        if col_ok(df, col):
            rows = col_mean_by_group(df, COL_FIELD, col, FIELD_LABELS)
            for r in rows:
                r["concern"] = label
                result.append(r)
    return jsonify(result)


@app.route("/api/satisfaction")
def satisfaction():
    df = load_data()
    return jsonify([
        {"dimension": label, "avg_score": safe_mean(df[col])}
        for label, col in SATISFACTION_COLS.items() if col_ok(df, col)
    ])


@app.route("/api/outcomes")
def outcomes():
    df = load_data()
    return jsonify([
        {"outcome": label, "avg_score": safe_mean(df[col])}
        for label, col in OUTCOME_COLS.items() if col_ok(df, col)
    ])


@app.route("/api/skills")
def skills():
    df = load_data()
    return jsonify([
        {"skill": label, "avg_score": safe_mean(df[col])}
        for label, col in SKILLS_COLS.items() if col_ok(df, col)
    ])


@app.route("/api/emotions")
def emotions():
    df = load_data()
    data = []
    for label, col in EMOTION_COLS.items():
        if col_ok(df, col):
            vals = pd.to_numeric(df[col], errors="coerce").dropna()
            # Binary column: percentage who selected this emotion
            pct = round(float((vals == 1).mean()) * 100, 1) if len(vals) else 0.0
            data.append({"emotion": label, "percentage": pct})
    return jsonify(data)


@app.route("/api/demographics")
def demographics():
    df = load_data()
    return jsonify({
        "gender":         value_counts_labeled(df, COL_GENDER,  GENDER_LABELS),
        "level_of_study": value_counts_labeled(df, COL_LEVEL,   LEVEL_LABELS),
        "field_of_study": value_counts_labeled(df, COL_FIELD,   FIELD_LABELS),
        "usage_frequency":value_counts_labeled(df, COL_FREQ_USE,FREQ_LABELS),
    })


@app.route("/api/recommendations")
def recommendations():
    df = load_data()
    recs = []

    def check(col, op, threshold, message, severity):
        if not col_ok(df, col):
            return
        score = safe_mean(df[col])
        triggered = (score >= threshold) if op == ">=" else (score <= threshold)
        if triggered:
            recs.append({"message": message, "severity": severity, "score": score})

    # High severity
    check("Q22a", ">=", 3.5,
          "High concern about ChatGPT promoting cheating — introduce mandatory AI academic integrity policies and student awareness workshops.", "high")
    check("Q22b", ">=", 3.5,
          "Significant plagiarism concerns detected — implement AI-use declaration forms in all assessment submissions.", "high")
    check("Q22e", ">=", 3.5,
          "Students widely perceive ChatGPT as a threat to academic integrity — urgent need for institutional AI usage guidelines.", "high")

    # Medium severity
    check("Q22d", ">=", 3.5,
          "Strong student agreement that AI needs regulation — recommend drafting a formal institutional AI policy framework.", "medium")
    check("Q22h", ">=", 3.5,
          "Students believe ChatGPT reduces critical thinking — embed reflective assignments requiring independent analysis alongside AI use.", "medium")
    check("Q24g", ">=", 3.5,
          "Over-dependence on AI flagged by students themselves — design assessments that deliberately limit AI assistance to build autonomous skills.", "medium")
    check("Q22f", ">=", 3.3,
          "Data privacy concerns raised — ensure transparent data governance policies and inform students about how AI tools handle their data.", "medium")
    check("Q22c", ">=", 3.0,
          "Social isolation risk identified — promote peer-collaboration activities and human-led seminars alongside AI-assisted study.", "medium")

    # Low severity / positive reinforcement
    check("Q24a", ">=", 3.5,
          "Students report grade improvements with ChatGPT — consider structured integration of AI tools into curricula with guided use protocols.", "low")
    check("Q25a", ">=", 3.5,
          "ChatGPT contributing to digital literacy gains — develop AI literacy modules across all disciplines.", "low")
    check("Q19c", "<=", 2.8,
          "Students do not feel ChatGPT fully supports independent learning — provide AI scaffolding training to improve self-directed learning with AI.", "medium")

    # Always include a baseline recommendation
    recs.append({
        "message": "Introduce dedicated AI literacy modules across all disciplines to ensure responsible, effective, and critically-informed AI-mediated learning.",
        "severity": "low",
        "score": None,
    })

    return jsonify(recs)


@app.route("/api/filter-options")
def filter_options():
    """Return available filter values for the frontend dropdowns."""
    df = load_data()
    fields = [{"value": k, "label": v} for k, v in FIELD_LABELS.items()]
    levels = [{"value": k, "label": v} for k, v in LEVEL_LABELS.items()]
    return jsonify({"fields": fields, "levels": levels})


@app.route("/api/usage-by-level")
def usage_by_level():
    """Average usage score broken down by level of study."""
    df = load_data()
    existing = [c for c in USAGE_COLS.values() if col_ok(df, c)]
    if not existing or not col_ok(df, COL_LEVEL):
        return jsonify([])
    df = df.copy()
    df["_avg"] = df[existing].apply(pd.to_numeric, errors="coerce").mean(axis=1)
    return jsonify(col_mean_by_group(df, COL_LEVEL, "_avg", LEVEL_LABELS))


# ── Run ───────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, port=5000)