import json
import glob
import os

data_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'consolidated')
files = sorted(glob.glob(os.path.join(data_dir, '*.json')))

for filepath in files:
    filename = os.path.basename(filepath)
    section_num = filename.split('-')[0]  # e.g. "05"

    with open(filepath, 'r', encoding='utf-8') as f:
        questions = json.load(f)

    for i, q in enumerate(questions, start=1):
        q['question_id'] = f"{section_num}{i:04d}"

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2, ensure_ascii=False)

    print(f"{filename}: {len(questions)} questions renumbered ({section_num}0001–{section_num}{len(questions):04d})")
