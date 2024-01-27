const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");

const dbPath = path.join(__dirname, "todoApplication.db");
let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const getValidation = (request, response, next) => {
  let {
    status = "",
    priority = "",
    category = "",
    dueDate = "",
  } = request.query;

  let statusChecked = true;
  let priorityChecked = true;
  let categoryChecked = true;
  if (status) {
    if (!["TO DO", "IN PROGRESS", "DONE"].includes(status)) {
      response.status(400);
      response.send("Invalid Todo Status");
      statusChecked = false;
    }
  }
  if (priority) {
    if (!["HIGH", "MEDIUM", "LOW"].includes(priority)) {
      response.status(400);
      response.send("Invalid Todo Priority");
      priorityChecked = false;
    }
  }
  if (category) {
    if (!["WORK", "HOME", "LEARNING"].includes(category)) {
      response.status(400);
      response.send("Invalid Todo Category");
      priorityChecked = false;
    }
  }
  if (statusChecked && priorityChecked && categoryChecked) {
    next();
  }
};
const postAndPutValidation = (request, response, next) => {
  let {
    status = "",
    priority = "",
    category = "",
    dueDate = "",
  } = request.body;

  let statusChecked = true;
  let priorityChecked = true;
  let categoryChecked = true;
  let dateChecked = true;
  if (status) {
    if (!["TO DO", "IN PROGRESS", "DONE"].includes(status)) {
      response.status(400);
      response.send("Invalid Todo Status");
      statusChecked = false;
    }
  }
  if (priority) {
    if (!["HIGH", "MEDIUM", "LOW"].includes(priority)) {
      response.status(400);
      response.send("Invalid Todo Priority");
      priorityChecked = false;
    }
  }
  if (category) {
    if (!["WORK", "HOME", "LEARNING"].includes(category)) {
      response.status(400);
      response.send("Invalid Todo Category");
      priorityChecked = false;
    }
  }
  if (dueDate) {
    if (!isValid(new Date(dueDate))) {
      response.status(400);
      response.send("Invalid Due Date");
      dateChecked = false;
    }
  }
  if (statusChecked && priorityChecked && categoryChecked && dateChecked) {
    next();
  }
};

//API 1
app.get("/todos/", getValidation, async (request, response) => {
  const {
    status = "",
    priority = "",
    search_q = "",
    category = "",
    date = "",
  } = request.query;
  const query = `
        SELECT
            id, todo, priority, status, category, 
            due_date As dueDate     
        FROM todo
        WHERE 
            status LIKE '%${status}%' AND
            priority LIKE '%${priority}%' AND
            category LIKE '%${category}%' AND
            todo LIKE '%${search_q}%'
        ;`;

  const todosArray = await db.all(query);
  response.send(todosArray);
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `
    SELECT
        id, todo, priority, status, category, 
        due_date As dueDate
    FROM todo WHERE id = ${todoId};`;
  const todoInfo = await db.get(query);
  response.send(todoInfo);
});
//API 3
app.get("/agenda/", async (request, response) => {
  let { date } = request.query;
  if (isValid(new Date(date))) {
    date = format(new Date(date), "yyyy-MM-dd");
    const query = `
        SELECT
            id, todo, priority, status, category, 
            due_date As dueDate
        FROM todo 
        WHERE due_date = '${date}';`;
    const todosList = await db.all(query);
    response.send(todosList);
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4
app.post("/todos/", postAndPutValidation, async (request, response) => {
  let { id, todo, priority, status, category, dueDate } = request.body;
  dueDate = format(new Date(dueDate), "yyyy-MM-dd");
  const query = `
    INSERT INTO todo(id, todo, priority, status, category, due_date)
    VALUES(${id}, '${todo}', '${priority}', '${status}', '${category}', '${dueDate}');
    ;`;
  await db.run(query);
  response.send("Todo Successfully Added");
});

//API 4
app.put("/todos/:todoId/", postAndPutValidation, async (request, response) => {
  const { todoId } = request.params;
  let { status, priority, todo, category, dueDate } = request.body;
  let query = "";
  let responseText = "";
  if (status) {
    query = `
        UPDATE todo
        SET 
            status = '${status}'
        WHERE         
            id = ${todoId}    
        ;`;
    responseText = "Status Updated";
  } else if (priority) {
    query = `
        UPDATE todo
        SET 
            priority = '${priority}'
        WHERE         
            id = ${todoId}    
        ;`;
    responseText = "Priority Updated";
  } else if (todo) {
    query = `
        UPDATE todo
        SET 
            todo = '${todo}'
        WHERE         
            id = ${todoId}    
        ;`;
    responseText = "Todo Updated";
  } else if (category) {
    query = `
        UPDATE todo
        SET 
            category = '${category}'
        WHERE         
            id = ${todoId}    
        ;`;
    responseText = "Category Updated";
  } else if (dueDate) {
    dueDate = format(new Date(dueDate), "yyyy-MM-dd");
    query = `
        UPDATE todo
        SET 
            due_date = '${dueDate}'
        WHERE         
            id = ${todoId}    
        ;`;
    responseText = "Due Date Updated";
  }
  await db.run(query);
  response.send(responseText);
});

//API 5
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const query = `
    DELETE FROM todo
    WHERE id = ${todoId};
    ;`;
  await db.run(query);
  response.send("Todo Deleted");
});

module.exports = app;
