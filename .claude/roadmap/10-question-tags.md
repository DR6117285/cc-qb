# Question Tags Reference

All tags used across consolidated question files. Each tag is a slug applied to individual questions as a `tags[]` array. Tags are additive — a question can have many.

Used as the source of truth when seeding the `tags` table in Postgres.

---

## Disease / Clinical Area

| Slug | Label | Notes |
|------|-------|-------|
| `cardiovascular-disease` | Cardiovascular Disease | CVD, MI, CAD, ASCVD, cholesterol, hypertension if cardiac context |
| `diabetes` | Diabetes | T2DM prevention, HbA1c, medication reduction, reversal |
| `cancer` | Cancer | Risk factors, prostate, breast, ACS guidelines |
| `hypertension` | Hypertension | Blood pressure, ISH guidelines, lifestyle as first-line |
| `multiple-chronic-conditions` | Multiple Chronic Conditions | MCC prevalence, trends, disability burden |

---

## Lifestyle Pillars

| Slug | Label | Notes |
|------|-------|-------|
| `dietary-patterns` | Dietary Patterns | Mediterranean, plant-based, Portfolio, pesco-vegetarian, specific diets |
| `physical-activity` | Physical Activity | General exercise benefits, PA recommendations, mechanisms, special populations |
| `exercise-prescription` | Exercise Prescription | FITT-VP, specific dosing, intensity zones (Talk Test, Borg, HRR, METs), PAR-Q+, HIIT vs moderate |
| `sedentary-behavior` | Sedentary Behavior | Sitting time, NEAT, sedentary lifestyle independent of exercise |
| `planetary-health` | Planetary Health | Environmental impact, greenhouse gas, sustainability, food systems |
| `mental-health` | Mental Health | Depression (MDD), anxiety (GAD), ACEs, mood disorders, screening, pharmacotherapy context |
| `stress-management` | Stress Management | Chronic stress physiology, work stress, HPA axis, cortisol, stress response interventions |
| `mindfulness` | Mindfulness | MBSR, mindfulness-based interventions, neuroplasticity, meditation |

---

## Nutrition

| Slug | Label | Notes |
|------|-------|-------|
| `nutrition-science` | Nutrition Science | Macronutrients, fiber, glycemic index, resistant starch, food synergy, nutrient density, epigenetics of diet |
| `micronutrients` | Micronutrients | Specific vitamins and minerals: calcium, vitamin D, iron, B12, folate, omega-3, potassium, sodium |
| `food-preparation` | Food Preparation | Cooking methods, AGEs, HCAs, NOVA classification, food processing, culinary medicine |

---

## Behaviour Change

| Slug | Label | Notes |
|------|-------|-------|
| `behavior-change-models` | Behavior Change Models | TTM, HBM, SCT, Theory of Planned Behaviour — model structure and application |
| `motivational-interviewing` | Motivational Interviewing | MI skills, reflections, double-sided reflections, OARS |
| `self-efficacy` | Self-Efficacy | Bandura, mastery experiences, sources of self-efficacy |
| `cognitive-behavioral-therapy` | Cognitive Behavioral Therapy | CBT, ABCDE/ABCD method, reframing |
| `positive-psychology` | Positive Psychology | PERMA model, wellbeing, strengths-based approaches |
| `smart-goals` | SMART Goals | Goal-setting, action planning |
| `relapse-prevention` | Relapse Prevention | Lapse vs relapse, relapse prevention planning |
| `health-coaching` | Health Coaching | Coach approach, wellness coaching, behaviour change techniques |
| `therapeutic-alliance` | Therapeutic Alliance | Empathy, patient-provider relationship, people-first language, trust |
| `social-support` | Social Support | Peer support, group visits, social networks |
| `social-determinants` | Social Determinants of Health | SDOH, socioeconomic factors, equity |
| `social-connectedness` | Social Connectedness | Social networks, loneliness, purpose, Harvard Study, Framingham social contagion, Health and Retirement Study |
| `sleep-health` | Sleep Health | Insomnia, CBT-I, sleep apnea, sleep disorders (RLS, PLMD, narcolepsy), circadian rhythm, shift work, sleep assessment tools |
| `tobacco-cessation` | Tobacco Cessation | Smoking cessation, NRT, varenicline, bupropion, 5 A's, 5 R's, e-cigarettes, Fagerstrom |
| `substance-use` | Substance Use | Alcohol use disorder, opioid use disorder, other substances, TAPS, AUDIT, DSM-5 criteria, pharmacotherapy |

---

## Clinical Practice

| Slug | Label | Notes |
|------|-------|-------|
| `clinical-assessment-tools` | Clinical Assessment Tools | AUDIT-C, PAM, PSS, IPAQ, dietary tools, body composition, fitness, sleep assessment |
| `lifestyle-vital-signs` | Lifestyle Vital Signs | Collection, implementation, and capture of lifestyle vital signs in practice |
| `practice-models` | Practice Models | SMAs/group visits, interdisciplinary team, Chronic Care Model, collaborative care, EHR |
| `quality-improvement` | Quality Improvement | PDSA cycle, QI projects, capture rates, implementation metrics |
| `patient-activation` | Patient Activation | PAM score, patient engagement, self-management support |
| `weight-management` | Weight Management | Obesity, BMI, bariatric surgery, weight loss interventions |
| `physician-health` | Physician Health | Practitioner burnout, compassion fatigue, moral injury, resilience, CWO, wellness programs |
| `community-advocacy` | Community Advocacy | Policy advocacy, hospital/community programs, Blue Zones, health equity advocacy |

---

## Evidence & Framing

| Slug | Label | Notes |
|------|-------|-------|
| `clinical-evidence` | Clinical Evidence | Questions citing specific studies — DPP, INTERHEART, Ornish, Nurses' Health, PREDIMED etc. Applies to all Study-Tool Based questions and General questions that rely on a named study |
| `guideline-recommendations` | Guideline Recommendations | ACC/AHA, ISH, ACS, ADA, ACLM official position statements |
| `definition-and-scope` | Definition and Scope | What lifestyle medicine is, its pillars, role in care |
| `epidemiology-and-burden` | Epidemiology and Burden | Prevalence, healthcare costs, disease trends, disability |
| `lifestyle-vs-genetics` | Lifestyle vs Genetics | Interaction between genetic risk and lifestyle factors |

---

## Tag Count by Section

| Section | Tags present |
|---------|-------------|
| 01 — Introduction to Lifestyle Medicine | `cardiovascular-disease`, `cancer`, `diabetes`, `hypertension`, `multiple-chronic-conditions`, `dietary-patterns`, `physical-activity`, `planetary-health`, `clinical-evidence`, `guideline-recommendations`, `definition-and-scope`, `epidemiology-and-burden`, `lifestyle-vs-genetics` |
| 02 — Fundamentals of Health Behavior Change | `behavior-change-models`, `motivational-interviewing`, `self-efficacy`, `cognitive-behavioral-therapy`, `positive-psychology`, `smart-goals`, `relapse-prevention`, `health-coaching`, `therapeutic-alliance`, `social-support`, `social-determinants`, `clinical-evidence`, `guideline-recommendations`, `diabetes`, `dietary-patterns`, `physical-activity` |
| 03 — Key Clinical Processes in Lifestyle Medicine | `clinical-assessment-tools`, `practice-models`, `cardiovascular-disease`, `dietary-patterns`, `physical-activity`, `weight-management`, `diabetes`, `lifestyle-vital-signs`, `quality-improvement`, `hypertension`, `patient-activation`, `cancer`, `physician-health`, `guideline-recommendations`, `motivational-interviewing`, `clinical-evidence` |
| 04 — The Role of The Practitioners Health and Community Advocacy | `physician-health`, `community-advocacy`, `therapeutic-alliance`, `definition-and-scope`, `guideline-recommendations`, `behavior-change-models`, `dietary-patterns`, `smart-goals`, `clinical-evidence` |
| 05 — Nutrition Science Assessment and Prescription Guidelines | `dietary-patterns`, `clinical-evidence`, `cardiovascular-disease`, `micronutrients`, `nutrition-science`, `diabetes`, `hypertension`, `cancer`, `food-preparation`, `weight-management`, `guideline-recommendations`, `community-advocacy`, `planetary-health`, `physical-activity`, `clinical-assessment-tools`, `motivational-interviewing` |
| 06 — Physical Activity Science and Prescription | `physical-activity`, `exercise-prescription`, `clinical-evidence`, `diabetes`, `clinical-assessment-tools`, `cardiovascular-disease`, `weight-management`, `sedentary-behavior`, `cancer`, `behavior-change-models`, `guideline-recommendations` |
| 07 — Emotional and Mental Health Assessment and Interventions | `mental-health`, `mindfulness`, `stress-management`, `clinical-assessment-tools`, `clinical-evidence`, `cardiovascular-disease`, `cognitive-behavioral-therapy`, `dietary-patterns`, `micronutrients` |
| 08 — Sleep Health Science and Interventions | `sleep-health`, `clinical-evidence`, `clinical-assessment-tools`, `cognitive-behavioral-therapy`, `weight-management` |
| 09 — Managing Tobacco Cessation and other Toxic Exposures | `tobacco-cessation`, `substance-use`, `clinical-evidence`, `clinical-assessment-tools`, `guideline-recommendations`, `motivational-interviewing`, `epidemiology-and-burden`, `cardiovascular-disease`, `dietary-patterns`, `mental-health` |
| 10 — The Role of Connectedness and Positive Psychology | `positive-psychology`, `clinical-evidence`, `social-connectedness`, `mental-health`, `sleep-health`, `mindfulness`, `physician-health`, `definition-and-scope` |

---

## Rules for Assigning Tags

1. Assign all that apply — there is no limit per question
2. `clinical-evidence` goes on every Study-Tool Based question and any General/Supplementary question that names a specific study
3. `guideline-recommendations` goes on questions citing ACC/AHA, ADA, ISH, ACS, ACLM, or similar bodies
4. Disease tags (`diabetes`, `cardiovascular-disease` etc.) go on questions where the disease is central — not just mentioned in a patient vignette
5. Behaviour change tags (`motivational-interviewing`, `self-efficacy` etc.) are section 02+ specific but may appear in later sections
