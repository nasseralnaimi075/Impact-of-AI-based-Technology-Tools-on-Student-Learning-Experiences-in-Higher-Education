import pandas as pd
import os

print("=" * 50)
print("CWD:", os.getcwd())
print()

# Find all CSV files in current folder
files = [f for f in os.listdir('.') if f.endswith('.csv')]
print("CSV files found:", files)
print()

# Check specific filename
target = "chatgpt_student_perceptions.csv"
print(f"'{target}' exists:", os.path.exists(target))
print()

# If found, load and check columns
if os.path.exists(target):
    for enc in ("utf-8-sig", "latin-1", "cp1252", "utf-8"):
        try:
            df = pd.read_csv(target, nrows=5, encoding=enc)
            print(f"Encoding that worked: {enc}")
            break
        except (UnicodeDecodeError, pd.errors.ParserError):
            continue
    print("Shape (first 5 rows):", df.shape)
    print("First 20 columns:", df.columns.tolist()[:20])
    print()
    # Check key columns
    key_cols = ['Q2', 'Q6', 'Q8', 'Q13', 'Q18a', 'Q22a', 'Q30a']
    for c in key_cols:
        exists = c in df.columns
        print(f"  {c}: {'✓ found' if exists else '✗ MISSING'}")
elif files:
    # Load whatever CSV is there
    print(f"Loading '{files[0]}' instead...")
    df = pd.read_csv(files[0], nrows=5)
    print("First 20 columns:", df.columns.tolist()[:20])
else:
    print("No CSV files found in this folder!")
    print("Make sure you renamed the Kaggle download to:")
    print("  chatgpt_student_perceptions.csv")
    print("And placed it in:", os.getcwd())

print("=" * 50)