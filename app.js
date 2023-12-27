const express = require("express");
const app = express();
app.use(express.json());

const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const { isMatch, format } = require("date-fns");

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
    console.log(`DB error : ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToResponseObject = (eachObject) => {
  return {
    id: eachObject.id,
    todo: eachObject.todo,
    priority: eachObject.priority,
    status: eachObject.status,
    category: eachObject.category,
    dueDate: eachObject.due_date,
  };
};

//API 1
app.get("/todos/", async (request, response) => {
  const { todo, category, priority, status, search_q = "" } = request.query;
  let getTodoQuery;

  //Returns a list of all todos whose priority is 'HIGH' and status is 'IN PROGRESS'
  if (priority !== undefined && status !== undefined) {
    getTodoQuery = `
              select * from todo
              where priority='${priority}' and status='${status}';
          `;
    const priorityAndStatusResult = await db.all(getTodoQuery);
    if (priorityAndStatusResult.length === 0) {
      response.status(400);
      response.send("Invalid Todo Priority and Status");
    } else {
      response.send(
        priorityAndStatusResult.map((each) =>
          convertDbObjectToResponseObject(each)
        )
      );
    }
  }

  //Returns a list of all todos whose category is 'WORK' and status is 'DONE'
  else if (category !== undefined && status !== undefined) {
    getTodoQuery = `
              select * from todo
              where category='${category}' and status='${status}';
          `;
    const categoryAndStatusResult = await db.all(getTodoQuery);
    if (categoryAndStatusResult.length === 0) {
      response.status(400);
      response.send("Invalid Todo Category and Status");
    } else {
      response.send(
        categoryAndStatusResult.map((each) =>
          convertDbObjectToResponseObject(each)
        )
      );
    }
  }

  //Returns a list of all todos whose category is 'LEARNING' and priority is 'HIGH'
  else if (category !== undefined && priority !== undefined) {
    getTodoQuery = `
              select * from todo
              where category='${category}' and priority='${priority}';
          `;
    const priorityAndCategoryResult = await db.all(getTodoQuery);
    if (priorityAndCategoryResult.length === 0) {
      response.status(400);
      response.send("Invalid Todo Category and Priority");
    } else {
      response.send(
        priorityAndCategoryResult.map((each) =>
          convertDbObjectToResponseObject(each)
        )
      );
    }
  }

  //Returns a list of all todos whose status is 'TO DO'
  else if (status !== undefined) {
    getTodoQuery = `
            select * from todo
            where status='${status}';
        `;
    const statusResult = await db.all(getTodoQuery);
    if (statusResult.length === 0) {
      response.status(400);
      response.send("Invalid Todo Status");
    } else {
      response.send(
        statusResult.map((each) => convertDbObjectToResponseObject(each))
      );
    }
  }

  //Returns a list of all todos whose category is 'HOME'
  else if (category !== undefined) {
    getTodoQuery = `
              select * from todo
              where category='${category}';
          `;
    const categoryResult = await db.all(getTodoQuery);
    if (categoryResult.length === 0) {
      response.status(400);
      response.send("Invalid Todo Category");
    } else {
      response.send(
        categoryResult.map((each) => convertDbObjectToResponseObject(each))
      );
    }
  }

  //Returns a list of all todos whose priority is 'HIGH'
  else if (priority !== undefined) {
    getTodoQuery = `
              select * from todo
              where priority='${priority}';
          `;
    const priorityResult = await db.all(getTodoQuery);
    if (priorityResult.length === 0) {
      response.status(400);
      response.send("Invalid Todo Priority");
    } else {
      response.send(
        priorityResult.map((each) => convertDbObjectToResponseObject(each))
      );
    }
  }

  //Returns a list of all todos whose todo contains 'Buy' text
  else if (search_q !== undefined) {
    getTodoQuery = `
              select * from todo
              where todo like "%${search_q}%";
          `;
    const searchResult = await db.all(getTodoQuery);
    response.send(
      searchResult.map((each) => convertDbObjectToResponseObject(each))
    );
  }
});

//API 2: Returns a specific todo based on the todo ID
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getSpecificTodoQuery = `
          select * from todo 
          where id=${todoId};
    `;
  const specificTodo = await db.get(getSpecificTodoQuery);
  response.send(convertDbObjectToResponseObject(specificTodo));
});

//API 3: Returns a list of all todos with a specific due date in the query parameter `/agenda/?date=2021-12-12`
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  if (isMatch(date, "yyyy-MM-dd")) {
    const dueDateFormat = format(new Date(date), "yyyy-MM-dd");
    const getSpecificDueDateQuery = `
             select * from todo
             where due_date='${dueDateFormat}';
      `;
    const specificDueDate = await db.all(getSpecificDueDateQuery);
    response.send(
      specificDueDate.map((each) => convertDbObjectToResponseObject(each))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4: Create a todo in the todo table
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const dueDateFormat = format(new Date(dueDate), "yyyy-MM-dd");
          const addTodoQuery = `
                          insert into todo(id, todo,priority,status,category,due_date)
                          values(${id},'${todo}','${priority}','${status}','${category}','${dueDateFormat}');
                  `;
          await db.run(addTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//API 5: Updates the details of a specific todo based on the todo ID
app.put("/todos/:todoId/", async (request, response) => {
  const {
    todo = "",
    status = "",
    category = "",
    priority = "",
    dueDate = "",
  } = request.body;
  const { todoId } = request.params;
  //Scenario 1:
  if (status !== "") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      const updateStatusQuery = `
           update todo set
           status='${status}'
           where id=${todoId};
       `;
      await db.run(updateStatusQuery);
      response.send("Status Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }
  //Scenario 2:
  else if (priority !== "") {
    if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
      const updatePriorityQuery = `
           update todo set
           priority='${priority}'
           where id=${todoId};
       `;
      await db.run(updatePriorityQuery);
      response.send("Priority Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }
  //Scenario 3:
  else if (todo !== "") {
    const updateTodoQuery = `
           update todo set
           todo='${todo}'
           where id=${todoId};
       `;
    await db.run(updateTodoQuery);
    response.send("Todo Updated");
  }
  //Scenario 4:
  else if (category !== "") {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      const updateCategoryQuery = `
           update todo set
           category='${category}'
           where id=${todoId};
       `;
      await db.run(updateCategoryQuery);
      response.send("Category Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }
  //Scenario 5:
  else if (dueDate !== "") {
    if (isMatch(dueDate, "yyyy-mm-dd")) {
      const dueDateFormat = format(new Date(dueDate), "yyyy-mm-dd");
      const updateDueDateQuery = `
           update todo set
           due_date='${dueDate}'
           where id=${todoId};
       `;
      await db.run(updateDueDateQuery);
      response.send("Due Date Updated");
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

//API 6: Deletes a todo from the todo table based on the todo ID
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
        delete from todo
        where id=${todoId};
    `;
  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
