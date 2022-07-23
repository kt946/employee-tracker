const inquirer = require('inquirer');
const mysql = require('mysql2');
const cTable = require('console.table');

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
    console.log('Connected to the company database.'),
    console.log(`
        ================
        Employee Manager
        ================
    `)
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

// function to view all departments
const viewDepartments = () => {
    const query = `SELECT * FROM departments`;
    db.query(query, (err, results) => {
        if (err) {
            console.log(err);
            return;
        }
        console.table(results);
        promptUser();
    });
};

// function to view all roles
const viewRoles = () => {
    const query = `SELECT roles.id, roles.title, 
                    departments.name AS department, roles.salary 
                    FROM roles
                    LEFT JOIN departments
                    ON roles.department_id = departments.id`;
    db.query(query, (err, results) => {
        if (err) {
            console.log(err);
            return;
        }
        console.table(results);
        promptUser();
    });
};

// function to view all employees
const viewEmployees = () => {
    // self referencing foreign key
    const query = `SELECT employees.id, employees.first_name, employees.last_name,
                    roles.title, departments.name AS department, roles.salary, 
                    CONCAT(manager.first_name, ' ', manager.last_name) AS manager 
                    FROM employees
                    INNER JOIN roles ON roles.id = employees.role_id
                    INNER JOIN departments ON roles.department_id = departments.id
                    LEFT JOIN employees manager ON employees.manager_id = manager.id`;
    db.query(query, (err, results) => {
        if (err) {
            console.log(err);
            return;
        }
        console.table(results);
        promptUser();
    });
};

// prompt for menu with list of choices
const promptUser = () => {
    return inquirer.prompt(menu)
    .then(menu => {
        console.log(menu);
        switch (menu.selection) {
            case 'View All Departments':
                viewDepartments();
                break;
            case 'View All Roles':
                viewRoles();
                break;
            case 'View All Employees':
                viewEmployees();
                break;
            case 'Add Department':
                console.log('Add Department');
                break;
            case 'Add Role':
                console.log('Add Role');
                break;
            case 'Add Employee':
                console.log('Add Employee');
                break;
            case 'Update Employee Role':
                console.log('Update Employee Role');
                break;
            case 'Quit':
                // exit from node.js
                process.exit(1);
        };
    })
};

// initialize prompt
promptUser()
    .catch(err => {
        console.log(err);
    });