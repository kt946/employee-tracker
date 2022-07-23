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
    db.promise().query(query)
    .then( ([rows, fields]) => {
        console.log('\n');
        console.table(rows);
        promptUser();
    })
    .catch(err => {
        throw err;
    });
};

// function to view all roles
const viewRoles = () => {
    const query = `SELECT roles.id, roles.title, 
                    departments.name AS department, roles.salary 
                    FROM roles
                    LEFT JOIN departments
                    ON roles.department_id = departments.id`;
    db.promise().query(query)
    .then( ([rows, fields]) => {
        console.log('\n');
        console.table(rows);
        promptUser();
    })
    .catch(err => {
        throw err;
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
    db.promise().query(query)
    .then( ([rows, fields]) => {
        console.log('\n');
        console.table(rows);
        promptUser();
    })
    .catch(err => {
        throw err;
    });
};

// function to add a department
const addDepartment = () => {
    // prompt user for department name
    return inquirer.prompt([
        {
            type: 'input',
            name: 'department',
            message: 'What is the name of the department?',
            validate: departmentInput => {
                if (departmentInput) {
                    return true;
                } else {
                    console.log('Please enter a valid department name!');
                    return false;
                }
            }
        }
    ])
    .then(input => {
        // set user input as parameter for query
        const params = input.department;
        const query = `INSERT INTO departments (name)
                        VALUES (?)`;
        db.promise().query(query, params)
        .then( () => {
            console.log(`Added ${params} to the database.`);
            promptUser();
        })
        .catch(err => {
            throw err;
        });
    })
}

// prompt for menu with list of choices
const promptUser = () => {
    return inquirer.prompt(menu)
    .then(menu => {
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
                addDepartment();
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