
const Pool=require("pg").Pool;
const close=require("./server").close;
 
//const connectionString = 'postgres://ntbimjal:tuKeUCl3mJVg1axRFy77lQ-LUVowCWXd@arjuna.db.elephantsql.com:5432/ntbimjal'
 
const pool =new Pool({
  connectionString : 'postgres://ydooojnu:bGU4ApWWP66foPI8B8SVSqFUelOl9Yrn@arjuna.db.elephantsql.com:5432/ydooojnu',
  max: 5
})
 

async function resetTables() {
    /**
     * return a promise that resolves when the database is successfully reset, and rejects if there was any error.
     */

    const client = await Pool.connect();
    try {
var query=`DROP TABLE IF EXISTS company;
CREATE TABLE company (
    company_id int PRIMARY KEY
    queue_id varchar(255) UNIQUE NOT NULL
    status varchar(255) NOT NULL
);
DROP TABLE IF EXISTS customers;
CREATE TABLE customers (
    customer_id not null
    queue_id varchar(255) not null
    time_created datetime NOT NULL
    served varchar(255) not null
    CONSTRAINT PK_Person PRIMARY KEY (customer_id,queue_id)
);


`
        const res = await client.query(query)
        return res;
    } catch (err) {
        console.log(err.stack)
        return new Promise((res, rej) => { rej(err) })
    }
    finally {
        client.release()
    }
    
}

function closeDatabaseConnections() {
    /**
     * return a promise that resolves when all connection to the database is successfully closed, and rejects if there was any error.
     */
    console.log('end');
 pool.end();

}

module.exports = {
    resetTables,
    closeDatabaseConnections,
    pool,
    resetTables
};
