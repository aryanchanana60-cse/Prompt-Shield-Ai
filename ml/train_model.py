
import csv
from pathlib import Path

import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

# Locate dataset.csv relative to this script
ML_DIR = Path(__file__).resolve().parent
DATASET_PATH = ML_DIR / "dataset.csv"
MODEL_PATH = ML_DIR / "promptshield_model.joblib"

# Load training examples
texts = []
labels = []

with DATASET_PATH.open("r", encoding="utf-8", newline="") as file:
    reader = csv.DictReader(file)
    for row in reader:
        text = row["text"].strip()
        label = int(row["label"])
        if text:
            texts.append(text)
            labels.append(label)

# Validate the dataset
if len(set(labels)) != 2:
    raise ValueError("Dataset must contain both labels: 0 and 1.")

if len(texts) < 4:
    raise ValueError("Dataset needs at least 4 examples.")

# Train the model
model = Pipeline([
    ("tfidf", TfidfVectorizer(ngram_range=(1, 2))),
    ("classifier", LogisticRegression(max_iter=1000)),
])

model.fit(texts, labels)

# Save the trained model
joblib.dump(model, MODEL_PATH)

print(f"Training examples: {len(texts)}")
print(f"Model saved to: {MODEL_PATH}")
print("Training complete!")
print("Note: this tiny starter dataset is only for testing the pipeline.")
