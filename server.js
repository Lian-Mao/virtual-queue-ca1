var express = require('express');
const app =require('./app').app;
var port= process.env.PORT|| 8081;
var closed=false;
var server=app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);

    //server closes after 15 mins
    /*
    setTimeout(function () {
      server.close();
      closed=true;
  }, 900000)
  */
  });
 

 for (let i = 0; i < 900000; i++) {

  if (closed==true) {
    function close(params) {
      var close_data= new Promise(function(resolve, reject) {
        //do your stuff 
         return resolve('success');
       }).catch(function () {
         return reject('err');
       });
    //return promise 
     return close_data;
    }
  }
 
}
 
  module.exports={
    close
  }