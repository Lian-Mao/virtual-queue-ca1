
/*

ASSUMPTION: In POSTMAN, all query body values are converted to string,
hence we had to convert certain values to numbers 
which may differ from the model method


Server is located in japan, japan time will be used
*/
const express = require('express'); // DO NOT DELETE
const cors = require('cors');
const morgan = require('morgan');
const pool = require('./database').pool;
const app = express(); // DO NOT DELETE

const database = require('./database');
const async = require('async');
var { Validator, ValidationError } = require('express-json-validator-middleware');
const validate = require('jsonschema').validate;
var bodyParser = require('body-parser');
const { query } = require('./db');
app.use(morgan('dev'));
app.use(cors());
var jsonParser = bodyParser.json()

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })

/**
 * =====================================================================
 * ========================== CODE STARTS HERE =========================
 * =====================================================================
 */

/**
 * ========================== SETUP APP =========================
 */

/**
 * JSON Body
 */
//createQueueJson for create queue api, ensures company_id is an integer of 10 digits and queue_id is a valid 10 length alphanumeric string 
var createQueueJson = {
  "type": "object",
  "required": ["company_id", "queue_id"],
  "properties": {

    "company_id": { "type": "integer", "minimum": 1111111111, "maximum": 10000000000 },
    "queue_id": { "type": "string", "pattern": "^[a-zA-Z0-9]{10}$" },

  }
}
//updateQueueJson for update queue api, checks status to ensure that only avtive or deactive is used
var updateQueueJson = {
  "type": "object",
  "required": ["queue_id", "status"],
  "properties": {
    "queue_id": { "type": "string", "pattern": "^[a-zA-Z0-9]{10}$" },
    "status": { "type": "string", "pattern": "^(ACTIVATE|DEACTIVATE)$" }
  }

}
//serverQueueJson for server avaliable api, queue_id is a valid 10 length alphanumeric string
var serverQueueJson = {
  "type": "object",
  "required": ["queue_id"],
  "properties": {
    "queue_id": { "type": "string", "pattern": "^[a-zA-Z0-9]{10}$" },
  }

}
//joinQueueJson for join queue api, ensures company_id is an integer of 10 digits and queue_id is a valid 10 length alphanumeric string 
var joinQueueJson = {
  "type": "object",
  "required": ["customer_id", "queue_id"],
  "properties": {

    "customer_id": { "type": "integer", "minimum": 1111111111, "maximum": 10000000000 },
    "queue_id": { "type": "string", "pattern": "^[a-zA-Z0-9]{10}$" },

  }
}
var checkQueueJson = {
  "type": "object",
  "required": ["queue_id"],
  "properties": {

    "company_id": { "type": "integer", "minimum": 1111111111, "maximum": 10000000000 },
    "queue_id": { "type": "string", "pattern": "^[a-zA-Z0-9]{10}$" },

  }
}
var arrvialRateJson = {
  "type": "object",
  "required": ["queue_id", "from", "duration"],
  "properties": {
    "queue_id": { "type": "string", "pattern": "^[a-zA-Z0-9]{10}$" },
    "from": { "type": "string", "pattern": "^([0-9]{4}-[0-9]{2}-[0-9]{2}) ([0-1][0-9]|[2][0-3]):([0-5][0-9]):([0-5][0-9])$" },
    "duration": { "type": "integer" }
    //	2020-11-13 06:11:31

  }
}



/**
 * ========================== RESET API =========================
 */

/**
 * Reset API
 */

app.post("/reset", async (req, res) => {
  database.resetTables(function (err, result) {
    if (!err) {
      console.log(result);
      res.send(result);
    } else {
      res.status(500).send({ "error": err });
    }
  });

})
/**
 * ========================== COMPANY =========================
 */

/**
 * Company: Create Queue
 * TODO: Lian Mao,
 * Done by :Lian Mao
 * 
 */

app.post("/company/queue", urlencodedParser, async (req, res) => {
  try {
    console.log(req.body);
    //convert string from body to a number
    var compID = Number(req.body.company_id);
    var queueID = req.body.queue_id;
    //JSON test body
    var test = { 'company_id': compID, 'queue_id': queueID }
    console.log(compID, queueID);
    //JSON Validation
    var v = validate(test, createQueueJson);
    if (v.valid != true) {
      var error = v.errors[0].path[0]
      //Give error message accroding to the wrong JSON property
      if (error == 'company_id') {
        return res.status(400).send({ "error": "company_id must be 10 digits", "code": "INVALID_JSON_BODY" });
      }
      else if (error == 'queue_id') {
        return res.status(400).send({ "error": "queue_id must be valid", "code": "INVALID_JSON_BODY" });
      }
    }
    //Insert statement
    const createQueue = await pool.query(`INSERT INTO company(company_id,queue_id,status) values('${compID}','${queueID}','INACTIVE') `);
    return res.status(201).send('created')



  }
  catch (err) {
    console.log(err.message);
    //duplicate error will be here as existing queue_id will voilate the primary key rules, hence error could not be handled in the try function
    if (err.message.substring(0, 4) == 'dupl') {
      return res.status(422).json({ "error": queueID + "already exists", "code": "QUEUE_EXISTS" })
    }
    else {
      return res.status(500).json({ "error": err.message, "code": "UNEXPECTED_ERROR" })
    }
  }

})


/**
 * Company: Update Queue
 * TODO: Cassandra
 * Done by: Cassandra
 */
app.put("/company/queue", urlencodedParser, async (req, res) => {
  try {
    //No number function as POSTMAN query gives a number instead of a string
    var id = req.query.queue_id;
    var status = req.body.status;
    console.log(id, status);
    //JSON test body
    var testObj = { 'queue_id': id, 'status': status }
    console.log(testObj);
    //JSON validation
    var v = validate(testObj, updateQueueJson);
    if (v.valid != true) {
       //Give error message accroding to the wrong JSON property
      var error = v.errors[0].path[0]
      console.log(v.errors);
      if (error == 'queue_id') {
        return res.status(400).send({ "error": "queue_id must be 10 digits", "code": "INVALID_QUERY_STRING" });
      }
      else if (error == 'status') {
        return res.status(400).send({ "error": "status must be ACTIVATE or DEACTIVATE", "code": "INVALID_JSON_BODY" });
      }
    }
    console.log(status, id);
    var finalStatus;
    //Change status in the database accroding to the status from the  request body 
    //ACTIVATE will make the queue ACTIVE
    //DEACTIVATE will make the queue INACTIVE
    if (status == 'ACTIVATE') {
      finalStatus = 'ACTIVE'
    }
    else if (status == 'DEACTIVATE') {
      finalStatus = 'INACTIVE'
    }
    console.log(finalStatus);
    //Update statement
    const updateNew = await pool.query(`UPDATE company set status='${finalStatus}' where queue_id='${id}' `);
    console.log(updateNew);
    //Error 404 unknown queue when no rows are returned
    if (updateNew.rowCount == 0) {
      return res.status(404).json({ "error": id + " not found", "code": "UNKNOWN_QUEUE" });
      res.end();
    }
    return res.status(200).send('updated!');;

  }
  catch (err) {

    console.log(err);
    res.status(500).send({ "error": err.message, "code": " UNEXPECTED_ERROR" })
  }

})
/**
 * Company: Server Available
 * TODO:Lian Mao
 * Done by :Lian Mao
 */
app.put("/company/server", urlencodedParser, async (req, res) => {
  try {

    console.log(req.body);
    var queue = req.body.queue_id;
    console.log(queue);
    //JSON validation
    var v = validate(req.body, serverQueueJson);
    if (v.valid != true) {
      return res.status(400).send({ "error": "queue_id must be 10 digits", "code": "INVALID_JSON_BODY" });
    }
    //SELECT statement to check if the queue exists
    const checkQueue = await pool.query(`select * from company where queue_id='${queue}' `);
    //if there is no value in the response body, queue does not exist
    if (checkQueue.rows.length == 0) {
      return res.status(404).send({ "error": queue + ' not found', "code": "UNKNOWN_QUEUE" });
    }
//Main select statement to get the first customer accroding to the time created
    const serverNew = await pool.query(`select customer_id from customers where queue_id='${queue}' and served='not_served' order by time_created asc limit 1`);
    console.log(serverNew.rows[0]);
    //for queue if empty
    if (serverNew.rows.length == 0) {
      return res.status(200).send({ "cutsomer_id": 0 })
    }
    else {
//update the customer served status once company identifies the next customer
      const getServe = await pool.query(`UPDATE customers
        SET served='served'
        WHERE customer_id='${serverNew.rows[0].customer_id}'; `);
      return res.status(200).send(serverNew.rows[0]);
    }


  }
  catch (err) {

    console.log(err);

    return res.status(500).send({ "error": err.message, "code": "UNEXPECTED_ERROR" })
  }

})

/**
 * Company: Arrival Rate
 * TODO: Lian Mao
 * Done by :Lian Mao
 */
app.get("/company/arrival_rate", async (req, res) => {
  var queue = req.query.queue_id;
  var timeFrom = req.query.from;
  //convert string from body to a number
  var duration = Number(req.query.duration);
  console.log(queue, timeFrom, duration);
  //JSON test body
  var finalObj = { "queue_id": queue, "from": timeFrom, "duration": duration }
  //JSON validation
  var v = validate(finalObj, arrvialRateJson);
  if (v.valid != true) {
    console.log(v.errors[0].path[0]);
    var error = v.errors[0].path[0];
    //Give error message accroding to the wrong JSON property
    if (error == 'queue_id') {
      return res.status(400).send({ "error": "queue_id must be 10 digits", "code": "INVALID_QUERY_STRING" });
    }
    else if (error == 'from') {

      return res.status(400).send({ "error": "From must be YY-MM-DD HH:MM:SS", "code": "INVALID_QUERY_STRING" });
    }
    else if (error == 'duration') {
      return res.status(400).send({ "error": "duration must be an integer", "code": "INVALID_QUERY_STRING" });
    }

    return res.status(400).send();
  }
  try {
 //SELECT statement to check if the queue exists
    const checkQueue = await pool.query(`select * from company where queue_id='${queue}' `);
  //if there is no value in the response body, queue does not exist
    if (checkQueue.rows.length == 0) {
      return res.status(404).send({ "error": queue + ' not found', "code": "UNKNOWN_QUEUE" });
    }
    //SELECT statement to get the final time after the duration given from the given timestamp
    const getFinalTime = await pool.query(`select (timestamp'${timeFrom}' + interval '${duration} minutes') as final from customers `);
//Convert to japanse time accroding to server location
    var finalTime = getFinalTime.rows[0].final.toLocaleString('ja-JP-u-ca-japanese');
    console.log(finalTime.toLocaleString('ja-JP-u-ca-japanese'));
    //Final array to display final result
    var finalArr = [];
    //parse date for javascript to understand
    var parseDate = new Date(timeFrom);
    var parseDateFinal = new Date(finalTime);
    console.log(parseDate.getSeconds());
    //for loop that loops every second to get number of customers
    for (parseDate; parseDate < parseDateFinal; parseDate.setSeconds(parseDate.getSeconds() + 1)) {
      console.log(parseDateFinal.toLocaleString('ja-JP-u-ca-japanese'));
      console.log(parseDate.toLocaleString('ja-JP-u-ca-japanese'));
      //get all customers in the queue at that point of time
      const getAll = await pool.query(`select count(*) from customers  where time_created <='${parseDate.toLocaleString('ja-JP-u-ca-japanese')} '
  AND time_created <=' ${parseDateFinal.toLocaleString('ja-JP-u-ca-japanese')}'  AND queue_id='${queue}' `);
  //result to be pushed in the final array
      var check = { 'timestamp': parseDate.toLocaleString('ja-JP-u-ca-japanese'), 'count': getAll.rows[0].count };
      console.log(check);
     
      finalArr.push(check);
    }

    return res.status(200).send(finalArr)


  }
  catch (err) {
    console.log(err.message);
    return res.status(500).json({ "error": err.message, "code": "UNEXPECTED_ERROR" })
  }

})


/**
 * ========================== CUSTOMER =========================
 */

/**
 * Customer: Join Queue
 * TODO: Cassandra Mahia
 * Done By: Cassandra Mahia
 */
app.post("/customer/queue", urlencodedParser, async (req, res) => {
  try {
    console.log(req.body);
    //convert string from body to a number
    var custID = Number(req.body.customer_id);
    var queueID = req.body.queue_id;
    console.log(custID, queueID);
    //JSON VALIDATION
    var testObj={'customer_id':custID,"queue_id":queueID}
    var v = validate(testObj, joinQueueJson);
    if (v.valid != true) {
      //Give error message accroding to the wrong JSON property
      var error = v.errors[0].path[0]
      if (error == 'customer_id') {
        return res.status(400).send({ "error": "customer_id must be 10 digits", "code": "INVALID_JSON_BODY" });
      }
      else if (error == 'queue_id') {
        return res.status(400).send({ "error": "queue_id must be 10 digits", "code": "INVALID_JSON_BODY" });
      }
    }
    //  check if queue exsists
    const checkQueueActive = await pool.query(`select company_id from company where queue_id='${queueID}' `);
//if there is no value in the response body, queue does not exist
    if (checkQueueActive.rows.length == 0) {
      return res.status(404).json({ 'error': 'queue' + queueID + 'does not exsist', "code": "UNKNOWN_QUEUE" })
    }
    else {
      //check status of given queue
      const checkStatusActive = await pool.query(`select status from company where queue_id='${queueID}'`);
      console.log(checkStatusActive.rows[0]);
      var statusCheck = checkStatusActive.rows[0].status;
//give 422 error if status is INACTIVE
      if (statusCheck == "INACTIVE") {
        return res.status(422).json({
          "error": "Queue" + queueID + " is inactive",
          "code": "INACTIVE_QUEUE"
        })
      }
    }
    //SQL insert statement to create queue
    const createQueue = await pool.query(`INSERT INTO customers (customer_id,queue_id,served) VALUES('${custID}','${queueID}','not_served')`)
    return res.status(201).send('created');


  }
  catch (err) {
    console.log(err.message);
      //duplicate error will be here as existing queue_id and customer_id together will voilate the primary key rules, hence error could not be handled in the try function
    if (err.message.substring(0, 4) == 'dupl') {
      return res.status(422).json({
        "error": "Customer" + custID + "already in Queue" + queueID,
        "code": "ALREADY_IN_QUEUE"
      })
    }
    else {
      return res.status(500).json({ "error": err.message, "code": "UNEXPECTED_ERROR" })
    }

  }

})




/**
 * Customer: Check Queue
 * TODO:Malcolm
 * Done by:Malcolm
 */

app.get("/customer/queue", async (req, res) => {
  //convert string from body to a number
  var customer = Number(req.query.customer_id);
  var queue = req.query.queue_id;
  console.log(customer, queue);
  //JSON test body
  var checkObj = { 'customer_id': customer, 'queue_id': queue }
  //JSON validation
  var v = validate(checkObj, checkQueueJson);

  if (v.valid != true) {
    var error = v.errors[0].path[0]
     //Give error message accroding to the wrong JSON property
    if (error == 'customer_id') {
      return res.status(400).send({ "error": "customer_id must be 10 digits", "code": "INVALID_QUERY_STRING" });
    }
    else if (error == 'queue_id') {
      return res.status(400).send({ "error": "queue_id must be 10 digits", "code": "INVALID_QUERY_STRING" });

    }
  }

  console.log(queue.length);
  try {
    //sql select statement to get the total number of customers in the queue and are not served
    const getTotal = await pool.query(`SELECT count(*) FROM customers where queue_id='${queue}' and served='not_served'`);
//if there is no value in the response body, queue does not exist
    if (getTotal.rows[0].count == 0) {
      return res.status(404).json({ 'error': 'Queue:' + queue + 'does not exsist', 'code': 'UNKNOWN_QUEUE' })
    }
    else { var total = getTotal.rows[0].count }
//if customer is not provided
    if (customer.length == 0) {
      return res.status(200).json({ 'total': `${total}`, 'ahead': `-1`, 'status': 'INACTIVE' })
    }
  
//sql select statement to get the timestamp of the request customer to compare later
    const getTimeStamp = await pool.query(`SELECT time_created from customers  where queue_id='${queue}'and customer_id='${customer}'  order by time_created asc`);
    console.log(getTimeStamp);

    if (getTimeStamp.rows.length == 0) {
      //customer is not in queue
      return res.status(200).json({ 'total': `${total}`, 'ahead': `-1`, 'status': 'INACTIVE' })
    }
    var time = getTimeStamp.rows[0].time_created;
    console.log(time);
    // convert to japan time as postgress server is in japan
    var japanTime = time.toLocaleString('ja-JP-u-ca-japanese');
    console.log(japanTime);
    //sql select statement to get customers that are ahead based on timestamp and served status
    const getAhead = await pool.query(`select count(*) from customers where queue_id='${queue}' and time_created<'${japanTime}' and served='not_served'  `);
    console.log(getAhead);
    console.log(total);
//check if selected custmer is in queue
    const getAll = await pool.query(`SELECT * FROM customers where customer_id='${customer}' and queue_id='${queue}' `);
    if (getAll.rowCount == 0) {
      return res.status(200).json({ 'total': `${total}`, 'ahead': `-1`, 'status': 'INACTIVE' })
    }
    return res.status(200).json({ 'total': `${total}`, 'ahead': `${getAhead.rows[0].count}`, 'status': 'ACTIVE' })
  }
  catch (err) {
    console.log(err.message);
    return res.status(500).json({ "error": err.message, "code": "UNEXPECTED_ERROR" })
  }

})




/**
 * ========================== UTILS =========================
 */

app.use('/test', function (req, res, next) {

  res.status(200).send('test successful');

})

/**
 * 404
 */
app.use(function (req, res, next) {
  res.status(404).send("not avaliable")
});


/**
 * Error Handler
 */
app.use((error, req, res, next) => {
  console.error(error.stack);
  res.status(error.status || 500).send({ "error": error.stack || "unexpected error" });
})

function tearDown() {
  // DO NOT DELETE
  return database.closeDatabaseConnections();
}

/**
 *  NOTE! DO NOT RUN THE APP IN THIS FILE.
 *
 *  Create a new file (e.g. server.js) which imports app from this file and run it in server.js
 */


module.exports = { app, tearDown }; // DO NOT DELETE
