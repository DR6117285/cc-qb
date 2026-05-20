import json
import glob
from collections import defaultdict

consolidated_dir = 'C:/Python Projects/cc-qb/data/consolidated'
files = sorted(glob.glob(f'{consolidated_dir}/*.json'))

total_before = 0
total_after = 0
total_id_dupes = 0
total_content_dupes = 0

for fpath in files:
    with open(fpath, encoding='utf-8') as f:
        questions = json.load(f)

    before = len(questions)
    total_before += before

    # Pass 1: deduplicate by question_id (keep first)
    seen_ids = {}
    id_dupes = 0
    for q in questions:
        qid = str(q['question_id'])
        if qid not in seen_ids:
            seen_ids[qid] = q
        else:
            id_dupes += 1

    questions = list(seen_ids.values())

    # Pass 2: deduplicate by question_text (keep first occurrence, prefer lower question_id)
    seen_text = {}
    content_dupes = 0
    deduped = []
    for q in questions:
        # Normalize text for comparison
        text = q['question_text'].strip().lower()
        if text not in seen_text:
            seen_text[text] = q['question_id']
            deduped.append(q)
        else:
            content_dupes += 1
            print(f'  CONTENT DUPE: [{q["question_id"]}] kept as [{seen_text[text]}] — "{q["question_text"][:70]}"')

    questions = deduped

    # Pass 3: remove source_file from all questions
    for q in questions:
        q.pop('source_file', None)

    after = len(questions)
    total_after += after
    total_id_dupes += id_dupes
    total_content_dupes += content_dupes

    with open(fpath, 'w', encoding='utf-8') as f:
        json.dump(questions, f, indent=2)

    fname = fpath.split('/')[-1]
    print(f'{fname}: {before} -> {after} (removed {id_dupes} ID dupes, {content_dupes} content dupes)')

print(f'\nTotal: {total_before} -> {total_after}')
print(f'ID duplicates removed: {total_id_dupes}')
print(f'Content duplicates removed: {total_content_dupes}')
