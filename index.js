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
    const query = `SELECT * FROM departments ORDER BY id`;
    db.promise().query(query)
    .then(([rows, fields]) => {
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
                    ON roles.department_id = departments.id
                    ORDER BY id`;
    db.promise().query(query)
    .then(([rows, fields]) => {
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
                    LEFT JOIN employees manager ON employees.manager_id = manager.id
                    ORDER BY id`;
    db.promise().query(query)
    .then(([rows, fields]) => {
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
        .then(() => {
            console.log(`Added ${params} to the database.`);
            promptUser();
        })
        .catch(err => {
            throw err;
        });
    })
}

// function to get all departments
const getDepartments = () => {
    return db.promise().query(`SELECT * FROM departments`) 
    .then(([rows, fields]) => {
        return rows;
    })
    .catch(err => {
        throw err;
    });
};

// function to get all roles
const getRoles = () => {
    return db.promise().query(`SELECT * FROM roles`) 
    .then(([rows, fields]) => {
        return rows;
    })
    .catch(err => {
        throw err;
    });
};

// function to get all employees
const getEmployees = () => {
    return db.promise().query(`SELECT * FROM employees`)
    .then(([rows, fields])  => {
        return rows;
    })
    .catch(err => {
        throw err;
    });
}

// function to add a role
const addRole = () => {
    // set up results array for department id and names
    const resultsArray = [];
    // get all departments, push results to array
    getDepartments()
    .then(results => {
        // push to array to find id for department after prompt
        resultsArray.push(...results);
        // prompt user for role name, salary, department
        return inquirer.prompt([
            {
                type: 'input',
                name: 'role',
                message: 'What is the name of the role?',
                validate: roleInput => {
                    if (roleInput) {
                        return true;
                    } else {
                        console.log('Please enter a valid role name!');
                        return false;
                    }
                }
            },
            {
                type: 'number',
                name: 'salary',
                message: 'What is the salary of the role?'
            },
            {
                type: 'list',
                name: 'department',
                message: 'Which department does the role belong to?',
                // print all department names from array of objects from query
                choices: results.map(({name}) => name)
            }
        ])
        .then(input => {
            // get id of department
            const id = resultsArray.find(results => results.name === input.department).id;
            // set user input as parameters for query
            const params = [input.role, input.salary, id];
            const query = `INSERT INTO roles (title, salary, department_id)
                            VALUES (?,?,?)`;
            db.promise().query(query, params)
            .then(() => {
                console.log(`Added ${input.role} to the database.`);
                promptUser();
            })
            .catch(err => {
                throw err;
            });
        })
    })
    .catch(err => {
        throw err;
    });
}

// function to add an employee
const addEmployee = () => {
    // set up arrays for roles and managers data
    const roleArray = [];
    const managerArray = [];
    // get roles and employees, push results to roles and managers array
    getRoles()
    .then(results => {
        roleArray.push(...results);
    })
    .then(getEmployees)
    .then(results => {
        managerArray.push(...results);
        // destructure employee names and create array for inquirer choices
        const managers = managerArray.map(({ first_name , last_name }) => first_name + ' ' + last_name)
        // add a 'None' option to choices
        managers.unshift('None');
        return managers
    })
    .then(managers => {
        return inquirer.prompt([
            {
                type: 'input',
                name: 'first_name',
                message: "What is the employee's first name?",
                validate: nameInput => {
                    if (nameInput) {
                        return true;
                    } else {
                        console.log('Please enter a valid first name!');
                        return false;
                    }
                }
            },
            {
                type: 'input',
                name: 'last_name',
                message: "What is the employee's last name?",
                validate: nameInput => {
                    if (nameInput) {
                        return true;
                    } else {
                        console.log('Please enter a valid last name!');
                        return false;
                    }
                }
            },
            {
                type: 'list',
                name: 'role',
                message: "What is the employee's role?",
                // print all role titles from array
                choices: roleArray.map(({title}) => title)
            },
            {
                type: 'list',
                name: 'manager',
                message: "Who is the employee's manager?",
                // print all employees including 'None' option
                choices: managers
            }
        ])
    })
    .then(input => {
        // destructure input for first and last name
        const { first_name, last_name } = input
        // get id of role
        const roleId = roleArray.find(role => role.title === input.role).id;
        // function to get id of manager, null if 'None' is selected
        const managerId = () => {
            if (input.manager === 'None') {
                return null;
            } else {
                return managerArray.find(manager => manager.first_name + ' ' + manager.last_name === input.manager).id;
            }
        };
        // set user input as parameters for query
        const params = [first_name, last_name, roleId, managerId()]
        const query = `INSERT INTO employees (first_name, last_name, role_id, manager_id)
                        VALUES (?,?,?,?)`;
        db.promise().query(query, params)
        .then(() => {
            console.log(`Added ${first_name} ${last_name} to the database.`);
            promptUser();
        })
        .catch(err => {
            throw err;
        });
    })
    .catch(err => {
        throw err;
    });
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
                addRole();
                break;
            case 'Add Employee':
                addEmployee();
                break;
            case 'Update Employee Role':
                console.log('Update Employee Role');
                break;
            case 'Quit':
                // exit from node.js
                console.log('\n');
                console.log('You have exited the application. Have a nice day!');
                process.exit(1);
        };
    })
};

// initialize prompt
promptUser()
    .catch(err => {
        console.log(err);
    });