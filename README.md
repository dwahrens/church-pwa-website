# Church Website and PWA

## Description
This project is a church website template that can be used to manage content and users. It was built using Node.JS, Express, EJS and MySQL in an MVC structure. You will need to add content such as images and pertinent information throughout the app, specifically in the views. User login uses Passport.js local. User information (including prayer requests) is encrypted at the database level. The app depends on YouTube for livestreaming and Mailgun to deliver mail. Views are cached in memory for best performance. Feel free to hack something different :)

## Features

 - LiveStream (YouTube dependent)
 - Sermons
 - Daily Devotionals
 - Events
 - Prayer Requests

These features are a work in progress:

 - Recommended Reading
 - Leadership Area

## PreRequisites

 - A working Node.js (v12+) Installation
 - MySQL Installed and running
 - A Reverse Proxy (NGINX, Apache, etc)
 - A Mailgun account with an API Key and Domain
 - A ESV Bible API account and Key

## Installation

 1. Start by cloning this repository: `git clone https://github.com/dwahrens/church-pwa-website.git`
 2. Then install the dependencies: `npm i`
 3. Execute the `database_setup.sql` script in the MySQL client of choice
 4. Setup either a `.env` file are rename `settings.example.json` to `settings.json` and fill in all of the details. Please look at `lib/appSettings.js` for further guidance.
 5. Start the server using `node app.js`

To run in production it is recommended to setup a service including the environment variables.

## Notes

 - To set the Admin user after install, you will need to execute a couple of MySQL queries: `UPDATE users SET is_admin=1 AND is_approved=1 WHERE id=ADMIN_ID`