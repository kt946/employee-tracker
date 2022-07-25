# Employee Tracker

## Description
[![License](https://img.shields.io/badge/License-MIT-blue)](https://opensource.org/licenses/MIT)

For this project, I built an employee tracker, also known as a content management system (CMS), using my knowledge of MySQL and JavaScript, as well as tools such as Node.js, Inquirer, MySQL2, and the command-line interface. This application allows a developer to manage a company's employee database using a menu from the command-line. The menu features various options such as viewing the company's departments, roles, and employees as well as creating and updating information in the database. Developing the command-line application helped to expand my knowledge of the essentials of SQL and the intricacies of CRUD (Creating, Reading, Updating, Deleting) operations of databases.

## Table of Contents

* [Installation](#installation)
* [Usage](#usage)
* [License](#license)
* [Credits](#credits)
* [Links](#links)

## Installation

To install this application:
- Clone the application's repository and place it into a local directory on your computer.
- Ensure that your computer has node.js installed. Typing 'node -v' into the terminal will display the current version installed.
- Ensure that MySQL is installed on your computer.
- Open a command-line interface (VS Code, Git Bash, etc.) and navigate to the directory containing the application's index.js.
- In the command-line, type 'npm install' or 'npm i' to download the application's dependencies, which include:
  - Inquirer v8.2.4
  - MySQL2
  - console.table
- Once the dependencies are installed, type 'mysql -u root -p' into the terminal. When prompted, input the password for the MySQL Shell to connect to the database.
- Type 'source db/schema.sql' and 'source db/seeds.sql' to create the database, tables, and seeds. This step can also be repeated to reset the data.
- To exit the MySQL Shell, type 'quit' and you will return to the command-line.

## Usage

To use this application:
- In the command-line interface, type 'node index.js' or 'node index' into the terminal to start the application.
- A menu for the application will appear, allowing you to select an option.
- The menu features the following options:
    - View All Departments
    - View All Roles
    - View All Employees
    - View Employees By Manager
    - View Employees By Department
    - View Total Budget Of Department
    - Add Department
    - Add Role
    - Add Employee 
    - Update Employee Role
    - Update Employee Manager
    - Delete Department
    - Delete Role
    - Delete Employee
    - Quit
- Selecting the 'Quit' option will end the application and return you to the command-line. To start the application again, type 'node index.js' or 'node index'.

## License

This application is covered under the [MIT](https://opensource.org/licenses/MIT).

## Credits

- [kt946](https://github.com/kt946)

## Links

- [Link to GitHub repository](https://github.com/kt946/employee-tracker)