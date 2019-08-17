# Equality
 
Equality is created by Citolab and University of Utrecht.
It's build to have insights in the quality of assessments.

<a href="https://equality-opensource.firebaseapp.com/">view the example here </a>
- username: test1@test.com
- password: secretpassword

# Techniques

### Frontend
Uses Angular and connects directly to the Firebase database. Authentication is also handled by Firebase.

#### Components: 

##### @angular/fire
used to setup the connection to Firebase. It will establish a websocket connection to the database. In some cases the data will retrieved once: `.pipe(take(1))` in other cases e.g. for the dashboard data it will keep the connection open to retrieve new data. All calls to firebase are made in `course.service.ts` or `user.service.ts`.

##### ngxs
For state management. Data from the database (except user data) will always come via the state store. Action handlers in the store will call a function in `course.service.ts` to initialize the connection to firebase. Selector are used to get the right data for the UI components the selectors will e.g. filter the data from the database based on applied filters.

#####  ng-bootstrap / bootstrap
ng-bootstrap has some components like a modal, buttons and dropdowns. Bootstrap is used to style the application with a custom theme. Changing the theme can give whole different look and feel of the application.

##### ngx-translate
Used to keep all text in one file and be prepared to add other languages. Most textes are in `assets/i18n/nl.json`. The rest should be added and translated.

### Initial data
Initial data is imported via Excel data and can be imported using a Python script.

# Getting started
Clone this repository and create a firebase project. The application uses: Authentication, Firestore for document, realtime database and can be used to host the application.

Download a firebase.json file under the Service Account tab with the connection info and put it in the seed folder and update environment.ts in app/src/environments

There are two files that are imported: 
- users.xlsx: this file contains the users with course info that have access to the application.
- phases.xlsx: this file contains data about phases and the self evaluation questions that lecturers should answer per phase.

Change the Excel files with your own data.
Run seed.py

Open the app folder to start the front end and run `npm i` to install dependencies and `ng serve` to run locally.

- To deploy the app in the app folder: `npm run prod-build` and `firebase deploy`  

# Roles and functions

### Lecturer
Lecturers are redirected to a page with their courses. For each assessment a lecurer has to answer evaluation questions and optionally add evidence documents

#### Self evaluation
The Excel phases should contain phases with questions about a step that should be done (if applicable) for the assessment. E.g. the assessment is based on a blue print. This question can be answered with yes or no and a satisfaction level. The satisfaction level is a number that indicates in this case how satisfactied the lecturer is with the blue print. The value can be set with a slider.
