import json
from collections import Counter

supplementary_tags = {
    '1143': ['stress-management', 'mental-health'],
    '1144': ['mindfulness'],
    '1145': ['mental-health', 'dietary-patterns'],
    '1146': ['mental-health', 'cognitive-behavioral-therapy'],
    '1147': ['mental-health', 'diabetes'],
    '1148': ['mental-health', 'cognitive-behavioral-therapy', 'clinical-evidence'],
    '1149': ['stress-management', 'cardiovascular-disease'],
    '1150': ['mental-health'],
    '1151': ['mindfulness', 'mental-health'],
    '1152': ['mental-health', 'clinical-evidence'],
    '1153': ['clinical-assessment-tools', 'mental-health'],
    '1154': ['stress-management'],
    '1155': ['clinical-assessment-tools', 'stress-management'],
}

general_tags = {
    '00364': ['stress-management', 'mental-health'],
    '00365': ['mental-health', 'diabetes'],
    '00366': ['mental-health', 'cardiovascular-disease'],
    '00367': ['clinical-assessment-tools', 'stress-management'],
    '00368': ['clinical-assessment-tools', 'mental-health'],
    '00369': ['clinical-assessment-tools', 'mental-health'],
    '00370': ['mental-health', 'cognitive-behavioral-therapy'],
    '00371': ['mental-health', 'cardiovascular-disease'],
    '00372': ['mental-health', 'dietary-patterns'],
    '00373': ['mental-health', 'cognitive-behavioral-therapy'],
    '00374': ['mental-health', 'cognitive-behavioral-therapy'],
    '00375': ['mental-health', 'physical-activity'],
    '00376': ['mental-health', 'cardiovascular-disease'],
    '00377': ['clinical-assessment-tools', 'mental-health'],
    '00378': ['mental-health'],
    '00379': ['mental-health', 'mindfulness'],
    '00380': ['mindfulness'],
    '00381': ['cardiovascular-disease', 'mindfulness'],
    '00382': ['mental-health'],
    '00383': ['stress-management', 'mindfulness'],
    '00384': ['mental-health'],
    '00385': ['stress-management', 'cardiovascular-disease'],
    '00386': ['mental-health', 'dietary-patterns'],
    '00387': ['stress-management', 'cardiovascular-disease'],
    '00388': ['clinical-assessment-tools', 'mental-health'],
    '00389': ['mental-health', 'mindfulness'],
    '00390': ['mental-health', 'micronutrients'],
    '00391': ['mindfulness'],
    '00392': ['cognitive-behavioral-therapy'],
    '00393': ['mental-health', 'dietary-patterns'],
    '00394': ['mental-health', 'dietary-patterns'],
    '00395': ['stress-management'],
    '00396': ['clinical-assessment-tools', 'mental-health'],
    '00397': ['mental-health', 'dietary-patterns'],
    '00398': ['stress-management'],
    '00399': ['clinical-assessment-tools', 'stress-management'],
    '00400': ['clinical-assessment-tools', 'mental-health'],
    '00401': ['mental-health'],
    '00402': ['mental-health', 'epidemiology-and-burden'],
    '00403': ['clinical-assessment-tools', 'stress-management'],
    '00404': ['mindfulness'],
    '00405': ['mental-health', 'micronutrients'],
    '00406': ['mental-health', 'epidemiology-and-burden'],
    '00407': ['clinical-assessment-tools', 'stress-management'],
    '00408': ['mindfulness'],
    '00409': ['mental-health', 'micronutrients'],
    '00410': ['mental-health', 'dietary-patterns'],
    '00411': ['mental-health', 'cognitive-behavioral-therapy', 'clinical-evidence'],
    '00412': ['stress-management', 'mindfulness'],
    '00413': ['clinical-assessment-tools', 'mental-health'],
    '00414': ['mental-health', 'mindfulness'],
    '00415': ['mental-health', 'micronutrients'],
    '00416': ['mindfulness'],
    '00417': ['mental-health', 'epidemiology-and-burden'],
    '00418': ['clinical-assessment-tools', 'stress-management'],
    '00419': ['mindfulness'],
    '00420': ['mental-health', 'micronutrients'],
    '00421': ['mental-health', 'dietary-patterns'],
    '00422': ['mental-health', 'cognitive-behavioral-therapy', 'clinical-evidence'],
    '00423': ['stress-management', 'mindfulness'],
    '00424': ['clinical-assessment-tools', 'mental-health'],
    '00425': ['mental-health', 'mindfulness'],
    '00426': ['mental-health', 'micronutrients'],
    '00427': ['mindfulness'],
}

study_tags = {
    '00720': ['stress-management', 'clinical-evidence'],
    '00721': ['mindfulness', 'mental-health', 'clinical-evidence'],
    '00722': ['mental-health', 'clinical-assessment-tools', 'clinical-evidence'],
    '00723': ['mindfulness', 'physician-health', 'clinical-evidence'],
    '00724': ['mental-health', 'clinical-evidence'],
    '00725': ['stress-management', 'clinical-evidence'],
    '00726': ['cardiovascular-disease', 'mental-health', 'clinical-evidence'],
    '00727': ['mindfulness', 'clinical-evidence'],
    '00728': ['mental-health', 'clinical-evidence'],
    '00729': ['mental-health', 'clinical-assessment-tools', 'clinical-evidence'],
}

base = 'C:/Python Projects/cc-qb/data'
all_questions = []

files = [
    ('From Board Review Notes -  - 7. Emotional and Mental Health Assessment and Interventions.json', supplementary_tags),
    ('General - 7. Emotional and Mental Health Assessment and Interventions.json', general_tags),
    ('Study-Tool Based - 7. Emotional and Mental Health Assessment and Interventions.json', study_tags),
]

for fname, tag_map in files:
    with open(f'{base}/{fname}', encoding='utf-8') as f:
        questions = json.load(f)
    for q in questions:
        qid = str(q['question_id'])
        q['question_id'] = qid
        q['tags'] = tag_map.get(qid, [])
        q['source_file'] = fname
        all_questions.append(q)

all_questions.sort(key=lambda q: q['question_id'].zfill(6))

out = f'{base}/consolidated/07-emotional-and-mental-health-assessment-and-interventions.json'
with open(out, 'w') as f:
    json.dump(all_questions, f, indent=2)

print(f'Written {len(all_questions)} questions')
tag_counts = Counter(t for q in all_questions for t in q['tags'])
for tag, count in sorted(tag_counts.items(), key=lambda x: -x[1]):
    print(f'  {tag}: {count}')
