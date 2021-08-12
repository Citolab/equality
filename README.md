# Equality
 
Equality is a web application was developed by Citolab in cooperation with the University of Utrecht.
Its main purpose is to gain insights in the quality of a course's assessment program.

<a href="https://equality-opensource.firebaseapp.com/">Click here</a> for more information (in Dutch).
<a href="mailto:citolab@cito.nl?subject=More info about Equality">or send an email</a>

<a href="https://equality-opensource.firebaseapp.com/">view the example here</a>
- username: test1@test.com
- password: secretpassword

# Techniques

### Frontend
Uses Angular and connects directly to the Firebase database. Authentication is also handled by Firebase.

### Initial data
Initial data is imported via Excel data and can be imported using the nodeJS console script in ```apps/functions/src/console.ts```.

# Getting started
Clone this repository and create a firebase project. The application uses: Authentication, Firestore for document, realtime database and can be used to host the application.

There is an firebase function that updates readmodels when documents are changed. The 'Blaze Pay as you go' firebase plan is needed to be able to deploy this functions. To try this example you probably won't be charged because of the free initial credits you'll have and by default is asks to set a budget (prefilled with 25$). But a creditcard should be coupled.

### Settings: 

Download a firebase.json file under the Service Account tab with the connection info and put it in the seed folder and update environment.ts in apps/equality/src/environments

There are two files that are imported: 
- Equality-importtemplate_per_course.xlsx: this file contains the users with course info that have access to the application.
- phases.xlsx: this file contains data about phases and the self evaluation questions that lecturers should answer per phase.

Change the Excel files with your own data.
Run console.ts

Open the app folder to start the front end and run `npm i` to install dependencies and `ng serve` to run locally.

- To deploy the app in the app folder: `firebase:deploy:functions` and `firebase:deploy:app`  
