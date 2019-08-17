# virtualenv env
# pip install -r requirements.txt
# osx install
# https://gist.github.com/pandafulmanda/730a9355e088a9970b18275cb9eadef3

import pandas as pd
import uuid
import firebase_admin

from firebase_admin import firestore
from firebase_admin import auth
from firebase_admin import credentials
from firebase_admin import db

# see onenote for the json file
cred = credentials.Certificate('firebase-opensource.json')
default_app = firebase_admin.initialize_app(cred)
db = firestore.client()

# # https://pandas.pydata.org/pandas-docs/stable/io.html#na-and-missing-data-handling
phase_data = pd.read_excel(
    "phases.xlsx", sheet_name='Importable', keep_default_na=False)
phases = []
prev_phase = ''
prev_stage = ''
phase_index = 0
stage_index = 0
for i in phase_data.index:
    phase_name = phase_data['phase'][i]
    phase_description = phase_data['description'][i]
    phase_cat = phase_data['category'][i]
    phase_stage = phase_data['stage'][i]
    phase_stage_evidencedesc = phase_data['evidence description'][i]
    phase_stage_claim = phase_data['statement'][i]
    phase_stage_claim_docs = phase_data['document example'][i]
    phase_help = phase_data['extra info for documents'][i]
    if prev_phase != phase_name:
        phases.append({
            u'id': uuid.uuid4().hex,
            u'title': phase_name.strip(),
            u'description': phase_description.strip(),
            u'type': phase_index,
            u'stages': [],
            u'help': phase_help.strip()
        })
        prev_phase = phase_name
        phase_index = phase_index + 1
        stage_index = 0
    if prev_stage != phase_stage:
        phases[len(phases) - 1]['stages'].append({
            u'id':  uuid.uuid4().hex,
            u'sequenceNumber': stage_index,
            u'title': phase_stage.strip(),
            u'category': phase_cat.strip(),
            u'evidenceDescription': phase_stage_evidencedesc,
            u'claims': []
        })
        prev_stage = phase_stage
        stage_index = stage_index+1
    phases[phase_index-1]['stages'][stage_index-1]['claims'].append({
        u'id': uuid.uuid4().hex,
        u'title': phase_stage_claim.strip(),
        u'docs': phase_stage_claim_docs,
        u'category': phase_cat.strip()
    })

for phase in phases:
    db.collection(u'phases').document(phase['id']).set(phase)

# Read the file
data = pd.read_excel("users.xlsx", sheet_name='Sheet1')
for i in data.index:
    mail = data['email'][i]
    name = data['name'][i]
    password = data['password'][i]
    faculty = data['faculty'][i]
    course = data['course'][i]
    # error: 'unbalanced parenthesis at position 0' means unset your proxy.
    try:
        auth.get_user_by_email(mail)
        print('User ' + mail + ' already existed')
        break
    except auth.AuthError:
        firebase_user = auth.create_user(
            email=mail,
            email_verified=True,
            password=password,
            display_name=name,
            disabled=False)
        course_data = {
            u'title': course,
            u'assessments':  []
        }
        db.collection(u'user_courses').document(
            firebase_user.uid).set(course_data)
print('seed complete')
