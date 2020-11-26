const Pool=require("pg").Pool;
 
const connectionString = 'postgres://ntbimjal:tuKeUCl3mJVg1axRFy77lQ-LUVowCWXd@arjuna.db.elephantsql.com:5432/ntbimjal'
 
const pool =new Pool({
  connectionString : 'postgres://ydooojnu:bGU4ApWWP66foPI8B8SVSqFUelOl9Yrn@arjuna.db.elephantsql.com:5432/ydooojnu',
  max: 5
})
 
module.exports = pool;