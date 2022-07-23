const inquirer = require('inquirer');
const mysql = require('mysql2');
const cTable = require('console.table')

// Connect to database
const db = mysql.createConnection(
    {
        host: 'localhost',
        // Your MySQL username,
        user: 'root',
        // Your MySQL password
        password: 'IamRoot!',
        database: 'company'
    },
    console.log('Connected to the company database.')
);

// menu questions
const menu = [
    {
        type: 'list',
        name: 'selection',
        message: 'What would you like to do?',
        choices: [
            'View All Departments',
            'View All Roles',
            'View All Employees',
            'Add Department',
            'Add Role',
            'Add Employee', 
            'Update Employee Role',
            'Quit'
        ]
    }
];

// prompt for menu with list of choices
const promptUser = () => {
    console.log(`
        ================
        Employee Manager
        ================
    `);
    return inquirer.prompt(menu)
    .then(menu => {
        console.log(menu);
        switch (menu.selection) {
            case 'View All Departments':
                console.log('Departments');
                break;
            case 'View All Roles':
                console.log('Roles');
                break;
            case 'View All Employees':
                console.log('Employees');
                break;
            /*case 'Add Department':
            case 'Add Role': 
            case 'Add Employee':
            case 'Update Employee Role':*/
            case 'Quit':
                break;
        };
    })
};

// initialize prompt
promptUser()
    .catch(err => {
        console.log(err);
    });