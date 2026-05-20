import json
from collections import Counter

base = 'C:/Python Projects/cc-qb/data'

# ─── SECTION 08 ───────────────────────────────────────────────────────────────

s08_general_tags = {
    '00428': ['sleep-health'],
    '00429': ['sleep-health'],
    '00430': ['sleep-health', 'cognitive-behavioral-therapy'],
    '00431': ['sleep-health'],
    '00432': ['sleep-health'],
    '00433': ['sleep-health'],
    '00434': ['clinical-assessment-tools', 'sleep-health'],
    '00435': ['sleep-health', 'weight-management'],
    '00436': ['sleep-health'],
    '00437': ['clinical-assessment-tools', 'sleep-health'],
    '00438': ['sleep-health'],
    '00439': ['sleep-health'],
    '00440': ['sleep-health'],
    '00441': ['sleep-health'],
    '00442': ['sleep-health'],
    '00443': ['sleep-health', 'stress-management'],
    '00444': ['sleep-health', 'diabetes'],
    '00445': ['sleep-health'],
    '00446': ['sleep-health'],
    '00447': ['sleep-health', 'cognitive-behavioral-therapy'],
    '00448': ['sleep-health', 'weight-management'],
    '00449': ['sleep-health'],
    '00450': ['sleep-health'],
    '00451': ['sleep-health'],
    '00452': ['sleep-health'],
    '00453': ['sleep-health'],
    '00454': ['sleep-health'],
    '00455': ['sleep-health'],
    '00456': ['sleep-health', 'cognitive-behavioral-therapy'],
    '00457': ['sleep-health'],
}

s08_study_tags = {
    '00730': ['sleep-health', 'clinical-evidence'],
    '00731': ['sleep-health', 'cardiovascular-disease', 'clinical-evidence'],
    '00732': ['sleep-health', 'clinical-evidence'],
    '00733': ['sleep-health', 'clinical-evidence'],
    '00734': ['sleep-health', 'weight-management', 'clinical-evidence'],
    '00735': ['sleep-health', 'clinical-evidence'],
    '00736': ['sleep-health', 'clinical-evidence'],
    '00737': ['sleep-health', 'clinical-evidence'],
    '00738': ['sleep-health', 'clinical-evidence'],
    '00739': ['clinical-assessment-tools', 'sleep-health', 'clinical-evidence'],
    '00740': ['clinical-assessment-tools', 'sleep-health', 'clinical-evidence'],
    '00741': ['clinical-assessment-tools', 'sleep-health', 'clinical-evidence'],
    '00742': ['clinical-assessment-tools', 'sleep-health', 'clinical-evidence'],
    '00743': ['clinical-assessment-tools', 'sleep-health', 'clinical-evidence'],
    '00744': ['clinical-assessment-tools', 'sleep-health', 'clinical-evidence'],
    '00745': ['clinical-assessment-tools', 'sleep-health', 'clinical-evidence'],
    '00746': ['clinical-assessment-tools', 'sleep-health', 'clinical-evidence'],
    '00747': ['clinical-assessment-tools', 'sleep-health', 'clinical-evidence'],
    '00748': ['clinical-assessment-tools', 'sleep-health', 'clinical-evidence'],
    '00749': ['clinical-assessment-tools', 'sleep-health', 'clinical-evidence'],
    '00750': ['clinical-assessment-tools', 'sleep-health', 'clinical-evidence'],
}

s08_files = [
    ('General - 8. Sleep Health Science and Interventions.json', s08_general_tags),
    ('Study-Tool Based - 8. Sleep Health Science and Interventions.json', s08_study_tags),
]

# ─── SECTION 09 ───────────────────────────────────────────────────────────────

s09_supplementary_tags = {
    '1156': ['tobacco-cessation'],
    '1157': ['tobacco-cessation', 'mental-health'],
    '1158': ['tobacco-cessation', 'guideline-recommendations'],
    '1159': ['tobacco-cessation', 'cardiovascular-disease'],
    '1160': ['substance-use'],
    '1161': ['substance-use'],
    '1162': ['tobacco-cessation', 'guideline-recommendations'],
    '1163': ['tobacco-cessation', 'guideline-recommendations'],
    '1164': ['substance-use'],
    '1165': ['tobacco-cessation'],
    '1171': ['substance-use', 'clinical-assessment-tools'],
    '1172': ['clinical-assessment-tools', 'tobacco-cessation'],
    '1173': ['substance-use', 'epidemiology-and-burden'],
    '1174': ['tobacco-cessation', 'motivational-interviewing'],
}

s09_general_tags = {
    '00458': ['tobacco-cessation'],
    '00459': ['tobacco-cessation'],
    '00460': ['tobacco-cessation', 'cardiovascular-disease'],
    '00461': ['tobacco-cessation', 'clinical-assessment-tools'],
    '00462': ['tobacco-cessation', 'mental-health'],
    '00463': ['tobacco-cessation'],
    '00464': ['substance-use'],
    '00465': ['substance-use'],
    '00466': ['substance-use', 'clinical-assessment-tools'],
    '00467': ['tobacco-cessation'],
    '00468': ['substance-use', 'clinical-assessment-tools'],
    '00469': ['tobacco-cessation'],
    '00470': ['tobacco-cessation', 'cardiovascular-disease'],
    '00471': ['tobacco-cessation'],
    '00472': ['tobacco-cessation'],
    '00473': ['substance-use'],
    '00474': ['substance-use'],
    '00475': ['substance-use'],
    '00476': ['substance-use'],
    '00477': ['tobacco-cessation', 'motivational-interviewing'],
    '00478': ['tobacco-cessation', 'epidemiology-and-burden'],
    '00479': ['tobacco-cessation', 'epidemiology-and-burden'],
    '00480': ['substance-use', 'cancer'],
    '00481': ['substance-use', 'epidemiology-and-burden'],
    '00482': ['substance-use', 'epidemiology-and-burden'],
    '00483': ['substance-use', 'epidemiology-and-burden'],
    '00484': ['substance-use', 'epidemiology-and-burden'],
    '00485': ['tobacco-cessation', 'guideline-recommendations'],
    '00486': ['tobacco-cessation', 'guideline-recommendations'],
    '00487': ['tobacco-cessation', 'guideline-recommendations'],
    '00488': ['tobacco-cessation', 'guideline-recommendations'],
    '00489': ['substance-use', 'motivational-interviewing'],
    '00490': ['tobacco-cessation', 'motivational-interviewing'],
    '00491': ['substance-use', 'guideline-recommendations'],
    '00492': ['tobacco-cessation', 'guideline-recommendations'],
    '00493': ['substance-use', 'guideline-recommendations'],
    '00494': ['substance-use', 'guideline-recommendations'],
    '00495': ['substance-use', 'guideline-recommendations'],
    '00496': ['substance-use'],
    '00497': ['substance-use'],
}

s09_study_tags = {
    '00751': ['tobacco-cessation', 'clinical-evidence'],
    '00752': ['tobacco-cessation', 'mental-health', 'clinical-evidence'],
    '00753': ['tobacco-cessation', 'clinical-evidence'],
    '00754': ['dietary-patterns', 'clinical-evidence'],
    '00755': ['dietary-patterns', 'cardiovascular-disease', 'clinical-evidence'],
    '00756': ['tobacco-cessation', 'clinical-evidence'],
    '00757': ['tobacco-cessation', 'clinical-evidence'],
    '00758': ['motivational-interviewing', 'clinical-evidence'],
    '00759': ['motivational-interviewing', 'clinical-evidence'],
    '00760': ['motivational-interviewing', 'clinical-evidence'],
    '00761': ['substance-use', 'clinical-assessment-tools', 'clinical-evidence'],
    '00762': ['substance-use', 'clinical-assessment-tools', 'clinical-evidence'],
    '00763': ['substance-use', 'clinical-assessment-tools', 'clinical-evidence'],
    '00764': ['clinical-assessment-tools', 'tobacco-cessation', 'clinical-evidence'],
    '00765': ['clinical-assessment-tools', 'tobacco-cessation', 'clinical-evidence'],
    '00766': ['substance-use', 'clinical-assessment-tools', 'clinical-evidence'],
    '00767': ['substance-use', 'clinical-assessment-tools', 'clinical-evidence'],
    '00768': ['substance-use', 'clinical-assessment-tools', 'clinical-evidence'],
    '00769': ['dietary-patterns', 'cardiovascular-disease', 'clinical-evidence'],
    '00770': ['dietary-patterns', 'clinical-evidence'],
    '00771': ['tobacco-cessation', 'mental-health', 'clinical-evidence'],
    '00772': ['dietary-patterns', 'micronutrients', 'clinical-evidence'],
    '00773': ['tobacco-cessation', 'clinical-evidence'],
    '00774': ['motivational-interviewing', 'clinical-evidence'],
    '00775': ['substance-use', 'clinical-assessment-tools', 'clinical-evidence'],
    '00776': ['clinical-assessment-tools', 'tobacco-cessation', 'clinical-evidence'],
    '00777': ['substance-use', 'clinical-assessment-tools', 'clinical-evidence'],
}

s09_files = [
    ('From Board Review Notes -  - 9. Managing Tobacco Cessation and other Toxic Exposures.json', s09_supplementary_tags),
    ('General - 9. Managing Tobacco Cessation and other Toxic Exposures.json', s09_general_tags),
    ('Study-Tool Based - 9. Managing Tobacco Cessation and other Toxic Exposures.json', s09_study_tags),
]

# ─── SECTION 10 ───────────────────────────────────────────────────────────────

s10_supplementary_tags = {
    '1175': ['social-connectedness', 'mental-health'],
    '1176': ['positive-psychology', 'clinical-evidence'],
    '1177': ['social-connectedness'],
    '1178': ['stress-management', 'positive-psychology'],
    '1179': ['positive-psychology'],
    '1180': ['social-connectedness', 'clinical-evidence'],
    '1181': ['social-connectedness'],
    '1182': ['mental-health', 'positive-psychology'],
    '1183': ['positive-psychology'],
    '1184': ['social-connectedness', 'mental-health'],
}

s10_general_tags = {
    '00026': ['social-connectedness'],
    '00027': ['social-connectedness', 'community-advocacy'],
    '00028': ['positive-psychology', 'diabetes', 'hypertension'],
    '00029': ['positive-psychology'],
    '00030': ['social-connectedness', 'positive-psychology'],
    '00031': ['social-connectedness'],
    '00032': ['social-connectedness'],
    '00033': ['positive-psychology'],
    '00034': ['social-connectedness', 'positive-psychology'],
    '00035': ['positive-psychology', 'clinical-evidence'],
    '00036': ['positive-psychology'],
    '00037': ['social-connectedness', 'clinical-evidence'],
    '00038': ['positive-psychology'],
    '00039': ['social-connectedness'],
    '00040': ['sleep-health', 'social-connectedness'],
    '00041': ['social-connectedness'],
    '00042': ['positive-psychology', 'mental-health'],
    '00043': ['positive-psychology', 'clinical-evidence'],
    '00044': ['mental-health', 'social-connectedness'],
    '00045': ['social-connectedness', 'mental-health', 'clinical-evidence'],
    '00046': ['positive-psychology'],
    '00047': ['positive-psychology'],
    '00048': ['positive-psychology'],
    '00049': ['positive-psychology'],
    '00050': ['positive-psychology'],
    '00051': ['mindfulness', 'positive-psychology'],
    '00052': ['mindfulness'],
    '00053': ['mindfulness', 'clinical-evidence'],
    '00054': ['positive-psychology'],
    '00055': ['physician-health', 'positive-psychology'],
    '00056': ['positive-psychology', 'definition-and-scope'],
    '00057': ['positive-psychology'],
    '00058': ['positive-psychology'],
    '00059': ['social-connectedness', 'mental-health'],
    '00060': ['positive-psychology', 'definition-and-scope'],
    '00061': ['sleep-health', 'positive-psychology'],
    '00062': ['physical-activity', 'mental-health'],
    '00063': ['sleep-health', 'mental-health'],
    '00064': ['positive-psychology'],
    '00065': ['physician-health'],
    '00066': ['positive-psychology'],
    '00067': ['social-connectedness', 'clinical-evidence'],
    '00068': ['social-connectedness', 'clinical-evidence'],
    '00069': ['positive-psychology'],
    '00070': ['positive-psychology', 'mental-health'],
}

s10_study_tags = {
    '00518': ['positive-psychology', 'clinical-evidence'],
    '00519': ['social-connectedness', 'clinical-evidence'],
    '00520': ['social-connectedness', 'clinical-evidence'],
    '00521': ['social-connectedness', 'clinical-evidence'],
    '00522': ['positive-psychology', 'clinical-evidence'],
    '00523': ['positive-psychology', 'clinical-evidence'],
    '00524': ['social-connectedness', 'clinical-evidence'],
    '00525': ['social-connectedness', 'clinical-evidence'],
    '00526': ['social-connectedness', 'clinical-evidence'],
    '00527': ['positive-psychology', 'clinical-evidence'],
    '00528': ['positive-psychology', 'clinical-evidence'],
    '00529': ['social-connectedness', 'clinical-evidence'],
    '00530': ['social-connectedness', 'clinical-evidence'],
    '00531': ['social-connectedness', 'clinical-evidence'],
    '00532': ['positive-psychology', 'clinical-evidence'],
    '00533': ['positive-psychology', 'clinical-evidence'],
    '00534': ['social-connectedness', 'clinical-evidence'],
    '00535': ['social-connectedness', 'clinical-evidence'],
    '00536': ['positive-psychology', 'clinical-evidence'],
    '00537': ['positive-psychology', 'clinical-evidence'],
    '00538': ['positive-psychology', 'clinical-evidence'],
    '00539': ['social-connectedness', 'clinical-evidence'],
    '00540': ['positive-psychology', 'clinical-evidence'],
    '00541': ['social-connectedness', 'clinical-evidence'],
    '00542': ['social-connectedness', 'clinical-evidence'],
    '00543': ['positive-psychology', 'clinical-evidence'],
    '00544': ['positive-psychology', 'clinical-evidence'],
    '00545': ['social-connectedness', 'clinical-evidence'],
    '00546': ['social-connectedness', 'clinical-evidence'],
    '00547': ['social-connectedness', 'clinical-evidence'],
    '00548': ['social-connectedness', 'clinical-evidence'],
    '00549': ['social-connectedness', 'clinical-evidence'],
    '00550': ['positive-psychology', 'clinical-evidence'],
    '00551': ['positive-psychology', 'clinical-evidence'],
    '00552': ['social-connectedness', 'positive-psychology', 'clinical-evidence'],
    '00553': ['social-connectedness', 'clinical-evidence'],
    '00554': ['positive-psychology', 'clinical-evidence'],
}

s10_files = [
    ('From Board Review Notes -  - 10. The Role of Connectedness and Positive Psychology.json', s10_supplementary_tags),
    ('General - 10. The Role of Connectedness and Positive Psychology.json', s10_general_tags),
    ('Study-Tool Based - 10. The Role of Connectedness and Positive Psychology.json', s10_study_tags),
]

# ─── RUNNER ───────────────────────────────────────────────────────────────────

sections = [
    ('08', '08-sleep-health-science-and-interventions.json', s08_files),
    ('09', '09-managing-tobacco-cessation-and-other-toxic-exposures.json', s09_files),
    ('10', '10-the-role-of-connectedness-and-positive-psychology.json', s10_files),
]

for section_num, out_name, file_list in sections:
    all_questions = []
    for fname, tag_map in file_list:
        try:
            with open(f'{base}/{fname}', encoding='utf-8') as f:
                questions = json.load(f)
        except FileNotFoundError:
            print(f'  SKIP (not found): {fname}')
            continue
        for q in questions:
            qid = str(q['question_id'])
            q['question_id'] = qid
            q['tags'] = tag_map.get(qid, [])
            q['source_file'] = fname
            all_questions.append(q)

    all_questions.sort(key=lambda q: q['question_id'].zfill(6))
    out = f'{base}/consolidated/{out_name}'
    with open(out, 'w') as f:
        json.dump(all_questions, f, indent=2)

    print(f'\nSection {section_num}: {len(all_questions)} questions -> {out_name}')
    tag_counts = Counter(t for q in all_questions for t in q['tags'])
    for tag, count in sorted(tag_counts.items(), key=lambda x: -x[1]):
        print(f'  {tag}: {count}')
