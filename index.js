const inquirer = require('inquirer');
const mysql = require('mysql2');
const cTable = require('console.table');
// helper functions
const {findId, mapArray, getData, getManagerList} = require('./src/helper');

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

// function to return queries for view function
// returns query with specific formatting based on string that is passed through
const getQuery = type => {
    switch (type) {
        case 'departments':
            return `SELECT * FROM departments ORDER BY id`;
        case 'roles':
            return `SELECT roles.id, roles.title, 
                    departments.name AS department, roles.salary 
                    FROM roles
                    LEFT JOIN departments
                    ON roles.department_id = departments.id
                    ORDER BY id`;
        case 'employees':
            return `SELECT employees.id, employees.first_name, employees.last_name,
                    roles.title, departments.name AS department, roles.salary, 
                    CONCAT(manager.first_name, ' ', manager.last_name) AS manager 
                    FROM employees
                    INNER JOIN roles ON roles.id = employees.role_id
                    INNER JOIN departments ON roles.department_id = departments.id
                    LEFT JOIN employees AS manager ON employees.manager_id = manager.id
                    ORDER BY id`;
    }
};

// function to view data based on type of string passed through
// pass 'departments', 'roles', or 'employees' string as argument for type
const viewData = type => {
    // function to return specific query
    const query = getQuery(type);
    db.query(query, (err, results) => {
        if (err) {
            console.log(err);
        }
        console.log('\n');
        console.table(results);
        promptUser();
    });
};

// function to view employees by manager
const viewByManager = () => {
    // set up manager array
    const managerArray = [];
    // get employee data
    getData('employees')
        .then(results => {
            // push data to array
            managerArray.push(...results);

            // return array of employees that are managers
            return getManagerList(results);
        })
        .then(managerList => {
            return inquirer.prompt([
                {
                    type: 'list',
                    name: 'manager',
                    message: 'Select a manager to view employees under them',
                    choices: mapArray('employee', managerList)
                }
            ])
        })
        .then(input => {
            // find manager id
            const managerId = findId('employee', managerArray, input.manager);
            // display only employees that have the selected manager 
            const query = `SELECT employees.id, employees.first_name, employees.last_name,
                            roles.title, departments.name AS department, roles.salary, 
                            CONCAT(manager.first_name, ' ', manager.last_name) AS manager 
                            FROM employees
                            INNER JOIN roles ON roles.id = employees.role_id
                            INNER JOIN departments ON roles.department_id = departments.id
                            LEFT JOIN employees AS manager ON employees.manager_id = manager.id
                            WHERE manager.id = ?
                            ORDER BY id`;
            db.query(query, managerId, (err, results) => {
                if (err) {
                    throw (err);
                }
                console.log('\n');
                console.table(results);
                promptUser();
            });
        })   
        .catch(err => {
            console.log(err);
        });
};

// function to view employees by department
const viewByDepartment = () => {
    // set up departments array
    const departmentsArray = [];
    // get data, push results to array
    getData('departments')
        .then(results => {
            departmentsArray.push(...results);

            // prompt user for department to view its employees
            return inquirer.prompt([
                {
                    type: 'list',
                    name: 'department',
                    message: 'Select a department to view its employees',
                    choices: mapArray('department', results)
                }
            ])
        })
        .then(input => {
            // find department id
            const departmentId = findId('department', departmentsArray, input.department);
            // select only department name and employee first and last names and title
            const query = `SELECT employees.id, employees.first_name, employees.last_name,
                            roles.title, departments.name AS department, roles.salary, 
                            CONCAT(manager.first_name, ' ', manager.last_name) AS manager 
                            FROM employees
                            INNER JOIN roles ON roles.id = employees.role_id
                            INNER JOIN departments ON roles.department_id = departments.id
                            LEFT JOIN employees AS manager ON employees.manager_id = manager.id
                            WHERE departments.id = ?
                            ORDER BY id`;
            db.query(query, departmentId, (err, results) => {
                if (err) {
                    throw (err);
                }
                console.log('\n');
                if (!results.length) {
                    console.log('No Employees Found.\n');
                } else {
                    console.table(results);
                }
                promptUser();
            });
        })   
        .catch(err => {
            console.log(err);
        });
};

// function to view department budget
const viewBudget = () => {
    // set up departments array
    const departmentsArray = [];
    // get data, push results to array
    getData('departments')
        .then(results => {
            departmentsArray.push(...results);
        
            // prompt user for department to view budget
            return inquirer.prompt([
                {
                    type: 'list',
                    name: 'department',
                    message: 'Select a department to view its total budget',
                    choices: mapArray('department', results)
                }
            ])
        })
        .then(input => {
            // find department id
            const departmentId = findId('department', departmentsArray, input.department);
            // select department name and sum of salary
            // join tables by role ids and department ids
            const query = `SELECT departments.name as department, SUM(salary) as total_budget
                            FROM employees
                            INNER JOIN roles ON employees.role_id = roles.id
                            INNER JOIN departments ON roles.department_id = departments.id
                            WHERE departments.id = ?`;
            db.query(query, departmentId, (err, results) => {
                if (err) {
                    throw (err);
                }
                console.log('\n');
                const [ result ] = results;
                if (!result.total_budget) {
                    console.log('No Budget Found.\n');
                } else {
                    console.table(results);
                }
                promptUser();
            });
        })   
        .catch(err => {
            console.log(err);
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
                if (!departmentInput) {
                    console.log('Please enter a valid department name!');
                    return false;   
                }
                return true;
            }
        }
    ])
        .then(input => {
            // set user input as parameter for query
            const query = `INSERT INTO departments (name)
                            VALUES (?)`;
            db.query(query, input.department, (err, result) => {
                if (err) {
                    throw (err);
                }
                console.log(`Added ${input.department} to the database.`);
                promptUser();
            });
        })
        .catch(err => {
            console.lot(err);
        });
}

// function to add a role
const addRole = () => {
    // set up results array for department id and names
    const departmentsArray = [];
    // get data, push results to array
    getData('departments')
        .then(results => {
            departmentsArray.push(...results);
        
            // prompt user for role name, salary, department
            return inquirer.prompt([
                {
                    type: 'input',
                    name: 'role',
                    message: 'What is the name of the role?',
                    validate: roleInput => {
                        if (!roleInput) {
                            console.log('Please enter a valid role name!');
                            return false;
                        } 
                        return true;
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
                    choices: mapArray('department', results)
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
            db.query(query, params, (err, result) => {
                if (err) {
                    throw (err);
                }
                console.log(`Added ${input.role} to the database.`);
                promptUser();
            });
        })   
        .catch(err => {
            console.log(err);
        });
};

// function to add an employee
const addEmployee = () => {
    // set up arrays for roles and managers data
    const roleArray = [];
    const managerArray = [];
    // get data, push results to arrays
    getData('roles')
        .then(results => {
            roleArray.push(...results);
        })
        .then(() => {
            return getData('employees');
        })
        .then(results => {
            managerArray.push(...results);
            // print all employee names from array for manager choices
            const managerList = mapArray('employee', results);
            
            return inquirer.prompt([
                {
                    type: 'input',
                    name: 'first_name',
                    message: "What is the employee's first name?",
                    validate: nameInput => {
                        if (!nameInput) {
                            console.log('Please enter a valid first name!');
                            return false;
                        } 
                        return true;
                    }
                },
                {
                    type: 'input',
                    name: 'last_name',
                    message: "What is the employee's last name?",
                    validate: nameInput => {
                        if (!nameInput) {
                            console.log('Please enter a valid last name!');
                            return false;
                        }
                        return true;
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
            db.query(query, params, (err, result) => {
                if (err) {
                    console.log(err);
                }
                console.log(`Added ${input.first_name} ${input.last_name} to the database.`);
                promptUser();
            });
        })
        .catch(err => {
            console.log(err);
        });
};

// function to update employee role
const updateEmployee = () => {
    // set up arrays for roles and employees data 
    const roleArray = [];
    const employeeArray = [];
    // get data, push results to arrays
    getData('roles')
        .then(results => {
            roleArray.push(...results);
        
            return getData('employees');
        })
        .then(results => {
            employeeArray.push(...results);
        
            //prompt to update employee's roles
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
            db.query(query, params, (err, result) => {
                if (err) {
                    throw (err);
                }
                console.log(`Updated ${input.employee}'s role to ${input.role}.`);
                promptUser();
            });
        })
        .catch(err => {
            console.log(err);
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
            db.query(query, params, (err, result) => {
                if (err) {
                    throw (err);
                }
                console.log(`Updated ${input.employee}'s manager to ${input.manager}.`);
                promptUser();
            });
        })
        .catch(err => {
            console.log(err);
        });
};

// function to delete department, role, or employee
// pass 'department', 'role', or 'employee' string as argument for type
const deleteFromDatabase = type => {
    const resultsArray = [];
    // get data from table
    getData(`${type}s`)
        .then(results => {
            // push results to array
            resultsArray.push(...results);

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
            const params = findId(`${type}`, resultsArray, input.delete)
            const query = `DELETE FROM ${type}s WHERE id = ?`;
            db.query(query, params, (err, result) => {
                if (err) {
                    throw (err);
                }
                console.log(`Deleted ${input.delete} ${type} from the database.`);
                promptUser();
            });
        })
        .catch(err => {
            console.log(err);
        });
};

// menu question
const menu = {
    type: 'list',
    name: 'selection',
    message: 'What would you like to do?',
    choices: [
        'View All Departments',
        'View All Roles',
        'View All Employees',
        'View Employees By Manager',
        'View Employees By Department',
        'View Total Budget Of Department',
        'Add Department',
        'Add Role',
        'Add Employee', 
        'Update Employee Role',
        'Update Employee Manager',
        'Delete Department',
        'Delete Role',
        'Delete Employee',
        'Quit'
    ]
};

// prompt for menu with list of choices
const promptUser = () => {
    return inquirer.prompt(menu)
    .then(menu => {
        switch (menu.selection) {
            case 'View All Departments':
                viewData('departments');
                break;
            case 'View All Roles':
                viewData('roles');
                break;
            case 'View All Employees':
                viewData('employees');
                break;
            case 'View Employees By Manager':
                viewByManager();
                break;
            case 'View Employees By Department':
                viewByDepartment();
                break;
            case 'View Total Budget Of Department':
                viewBudget();
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
            case 'Delete Department':
                deleteFromDatabase('department');
                break;
            case 'Delete Role':
                deleteFromDatabase('role');
                break;
            case 'Delete Employee':
                deleteFromDatabase('employee');
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
promptUser();