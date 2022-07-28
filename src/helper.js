const mysql = require('mysql2');

// Connect to database
const db = mysql.createConnection(
    {
        host: 'localhost',
        // Your MySQL username,
        user: 'root',
        // Your MySQL password
        password: 'IamRoot!',
        database: 'company'
    }
);

// function to find id from array
// pass 'department', 'role', or 'employee' string as argument for type
const findId = (type, arrayData, input) => {
    // switch case for type of id to return from array and input
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

// function to destructure results and return array for inquirer choices
// pass 'department', 'role', or 'employee' string as argument for type
const mapArray = (type, arrayData) => {
    // switch case for type of array to return
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
};

// function to return data from tables
// pass 'departments', 'roles', or 'employees' string as arguments for type
const getData = type => {
    return db.promise().query(`SELECT * FROM ${type}`)
        .then(([rows, fields])  => {
            return rows;
        })
        .catch(err => {
            console.log(err);
        });
};

// function to return list of employees that are managers
const getManagerList = employeeData => {
    // filter array for employees that have managers
    const employeesWithManagers = employeeData.filter(employee => employee.manager_id);
            
    // get array of manager ids
    const managerIdData = employeesWithManagers.map(({ manager_id }) => manager_id);
    
    // filter array for employees that are managers
    return employeeData.filter(employee => managerIdData.includes(employee.id));
};

module.exports = {
    findId,
    mapArray,
    getData,
    getManagerList
}