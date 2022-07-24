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

// menu question
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
            'Update Employee Manager',
            'View Employees By Manager',
            'View Employees By Department',
            'Delete Department',
            'Delete Role',
            'Delete Employee',
            'View Total Budget Of Department',
            'Quit'
        ]
    }
];

// function to find id
const findId = (type, arrayData, input) => {
    switch (type) {
        // get id of department
        case 'department':
            return arrayData.find(arrayEl => arrayEl.name === input).id;
        // get id of role
        case 'role':
            return arrayData.find(arrayEl => arrayEl.title === input).id;
        // get id of employee
        case 'employee':
            // if employee's manager set to 'None'
            if (input === 'None') {
                return null;
            }
            return arrayData.find(arrayEl => arrayEl.first_name + ' ' + arrayEl.last_name === input).id;
    };
};

// function to destructure and map array
const mapArray = (type, arrayData) => {
    switch (type) {
        // get array of department names
        case 'department':
            return arrayData.map(({name}) => name);
        // get array of role names
        case 'role':
            return arrayData.map(({title}) => title);
        // get array of employee names
        case 'employee':
            return arrayData.map(({ first_name , last_name }) => first_name + ' ' + last_name);
    };
}

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
        .catch(err => {
            throw err;
        });
}

// function to get data from tables
const getData = (type) => {
    return db.promise().query(`SELECT * FROM ${type}`)
        .then(([rows, fields])  => {
            return rows;
        })
        .catch(err => {
            throw err;
        });
};

// function to add a role
const addRole = () => {
    // set up results array for department id and names
    const departmentsArray = [];
    // get all departments, push results to array
    getData('departments')
        .then(results => {
            // push to array to find id for department after prompt
            departmentsArray.push(...results);
        })
        .then(() => {
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
                    // print all department names from array
                    choices: mapArray('department', departmentsArray)
                }
            ])
        })
        .then(input => {
            // get id of department
            const departmentId = findId('department', departmentsArray, input.department);
            // set user input as parameters for query
            const params = [input.role, input.salary, departmentId];
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
        .catch(err => {
            throw err;
        });
};

// function to add an employee
const addEmployee = () => {
    // set up arrays for roles and managers data
    const roleArray = [];
    const managerArray = [];
    // get roles and employees, push results to roles and managers array
    getData('roles')
        .then(results => {
            roleArray.push(...results);
        })
        .then(() => {
            return getData('employees');
        })
        .then(results => {
            console.log(results);
            managerArray.push(...results);
            // print all employee names from array for manager choices
            const managerList = mapArray('employee', results);
            return managerList;
        })
        .then(managerList => {
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
                    choices: mapArray('role', roleArray)
                },
                {
                    type: 'list',
                    name: 'manager',
                    message: "Who is the employee's manager?",
                    // print all manager names including 'None' option
                    choices: ['None', ...managerList]
                }
            ])
        })
        .then(input => {
            // get ids of role and manager
            const roleId = findId('role', roleArray, input.role);
            const managerId = findId('employee', managerArray, input.manager);
            // set user input as parameters for query
            const params = [input.first_name, input.last_name, roleId, managerId];
            const query = `INSERT INTO employees (first_name, last_name, role_id, manager_id)
                            VALUES (?,?,?,?)`;
            db.promise().query(query, params)
                .then(() => {
                    console.log(`Added ${input.first_name} ${input.last_name} to the database.`);
                    promptUser();
                })
                .catch(err => {
                    throw err;
                });
        })
        .catch(err => {
            throw err;
        });
};

// function to update employee role
const updateEmployee = () => {
    // set up arrays for roles and employees data 
    const roleArray = [];
    const employeeArray = [];
    getData('roles')
        .then(results => {
            roleArray.push(...results);
        })
        .then(() => {
            return getData('employees');
        })
        .then(results => {
            employeeArray.push(...results);
        })
        .then(() => {
            return inquirer.prompt([
                {
                    type: 'list',
                    name: 'employee',
                    message: "Which employee's role do you want to update?",
                    // print all employee names from array
                    choices: mapArray('employee', employeeArray)
                },
                {
                    type: 'list',
                    name: 'role',
                    message: "Which role do you want to assign the selected employee?",
                    // print all role titles from array
                    choices: mapArray('role', roleArray)
                },
            ])
        })
        .then(input => {
            // get ids of employee and role
            const employeeId = findId('employee', employeeArray, input.employee);
            const roleId = findId('role', roleArray, input.role);
            // set user input as parameters for query
            const params = [roleId, employeeId];
            const query = `UPDATE employees SET role_id = ?
                            WHERE id = ?`;
            db.promise().query(query, params)
                .then(() => {
                    console.log(`Updated ${input.employee}'s role to ${input.role}.`);
                    promptUser();
                })
                .catch(err => {
                    throw err;
                });
        })
        .catch(err => {
            throw err;
        });
};

// function to update employee manager
const updateManager = () => {
    // set up arrays for  employees data 
    const employeeArray = [];
    getData('employees')
        .then(results => {
            employeeArray.push(...results);
            // print all employee names from array
            const employeeList = mapArray('employee', results);
            return employeeList;
        })
        .then(employeeList => {
            return inquirer.prompt([
                {
                    type: 'list',
                    name: 'employee',
                    message: "Which employee's manager do you want to update?",
                    choices: employeeList
                },
                {
                    type: 'list',
                    name: 'manager',
                    message: "Which manager do you want to assign the selected employee?",
                    // add 'None' option to manager choices
                    choices: ['None', ...employeeList]
                },
            ])
        })
        .then(input => {
            // get ids of employee and manager
            const employeeId = findId('employee', employeeArray, input.employee);
            const managerId = findId('employee', employeeArray, input.manager);
            const params = [managerId, employeeId];
            const query = `UPDATE employees SET manager_id = ?
                            WHERE id = ?`;
            db.promise().query(query, params)
                .then(() => {
                    console.log(`Updated ${input.employee}'s manager to ${input.manager}.`);
                    promptUser();
                })
                .catch(err => {
                    throw err;
                });
        })
        .catch(err => {
            throw err;
        });
};

// function to view employees by manager
/*const viewByManager = () => {
    const query = ``;
    db.promise().query(query)
        .then(([rows, fields]) => {
            console.log('\n');
            console.table(rows);
            promptUser();
        })
        .catch(err => {
            throw err;
        });
};*/

// function to view employees by department
const viewByDepartment = () => {
    const departmentsArray = [];
    getData('departments')
        .then(results => {
            departmentsArray.push(...results);
        })
        .then(() => {
            // prompt user for department to view its employees
            return inquirer.prompt([
                {
                    type: 'list',
                    name: 'department',
                    message: 'Select a department to view its employees',
                    choices: mapArray('department', departmentsArray)
                }
            ])
        })
        .then(input => {
            // find department id
            const departmentId = findId('department', departmentsArray, input.department);
            // select only department name and employee first and last names and title
            const query = `SELECT departments.name as department, 
                            employees.first_name, employees.last_name,
                            roles.title
                            FROM employees
                            INNER JOIN roles ON employees.role_id = roles.id
                            INNER JOIN departments ON roles.department_id = departments.id
                            WHERE departments.id = ?`;
            db.promise().query(query, departmentId)
                .then(([rows, fields]) => {
                    console.log('\n');
                    console.table(rows);
                    promptUser();
                })
                .catch(err => {
                    throw err;
                });
        })   
        .catch(err => {
            throw err;
        });
};

// function to delete department, role, or employee
const deleteFromDatabase = type => {
    const resultsArray = [];
    // get data from table
    getData(`${type}s`)
        .then(results => {
            // push results to array
            resultsArray.push(...results);
            return results;
        })
        .then(results => {
            // prompt user for selection
            return inquirer.prompt([
                {
                    type: 'list',
                    name: `delete`,
                    message: `Which ${type} do you want to delete?`,
                    choices: mapArray(`${type}`, results)
                }
            ])
        })
        .then(input => {
            // get id and delete from database
            const query = `DELETE FROM ${type}s WHERE id = ?`;
            db.promise().query(query, findId(`${type}`, resultsArray, input.delete))
                .then(() => {
                    console.log(`Deleted ${input.delete} ${type} from the database.`);
                    promptUser();
                })
                .catch(err => {
                    throw err;
                });
        })
        .catch(err => {
            throw err;
        });
};

// function to view department budget
const viewBudget = () => {
    // set up departments array
    const departmentsArray = [];
    getData('departments')
        .then(results => {
            departmentsArray.push(...results);
        })
        .then(() => {
            // prompt user for department to view budget
            return inquirer.prompt([
                {
                    type: 'list',
                    name: 'department',
                    message: 'Select a department to view its total budget',
                    choices: mapArray('department', departmentsArray)
                }
            ])
        })
        .then(input => {
            // find department id
            const departmentId = findId('department', departmentsArray, input.department);
            // select only department name and sum of salary
            // join tables by role ids and department ids
            const query = `SELECT departments.name as department, SUM(salary) as 'total budget'
                            FROM employees
                            INNER JOIN roles ON employees.role_id = roles.id
                            INNER JOIN departments ON roles.department_id = departments.id
                            WHERE departments.id = ?`;
            db.promise().query(query, departmentId)
                .then(([rows, fields]) => {
                    console.log('\n');
                    console.table(rows);
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
                updateEmployee();
                break;
            case 'Update Employee Manager':
                updateManager();
                break;
            case 'View Employees By Manager':
                viewByManager();
                break;
            case 'View Employees By Department':
                viewByDepartment();
                break;
            case 'Delete Department':
                deleteFromDatabase('department');
                break;
            case 'Delete Role':
                deleteFromDatabase('role');
                break;
            case 'Delete Employee':
                deleteFromDatabase('employee');
                break;
            case 'View Total Budget Of Department':
                viewBudget();
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