module.exports = function(){
  var express = require('express');
  var router = express.Router();

  /* function returns data to fill the table on /containerType */
  function getContainerType(res, mysql, context, complete){
      mysql.pool.query("SELECT container_type_id, container_type_name, container_max_volume FROM container_type ORDER BY container_type_id ASC LIMIT 20;", function(error, results, fields){
          if(error){
              res.write(JSON.stringify(error));
              res.end();
          }
          context.containerType = results;
          complete();
      });
  }

  function getOneContainerType(res, mysql, context, container_type_id, complete){
      var sql = "SELECT container_type_id, container_type_name, container_max_volume FROM container_type WHERE container_type_id=?";
      var inserts = [container_type_id];
      mysql.pool.query(sql, inserts, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            context.container_type = results[0];
            complete();
        });
  }

 /* get router to populate chemical info into /containerType view */
  router.get('/', function(req, res){
        var callbackCount = 0;
        var context = {};
        var mysql = req.app.get('mysql');
        getContainerType(res, mysql, context, complete);
        function complete(){
            callbackCount++;
            if(callbackCount >= 1){
                res.render('containerType', context);
            }
        }
    });

/* Allows user to submit new containerType with container_type_name, container_type_volume attribute */
    router.post('/', function(req, res){

        console.log(req.body)
        var mysql = req.app.get('mysql');
        var sql = "INSERT INTO container_type(container_type_name, container_max_volume) VALUES (?,?)";
        var inserts = [req.body.containerTypeName, req.body.maxVolume];
        sql = mysql.pool.query(sql,inserts,function(error, results, fields){
            if(error){
                console.log(JSON.stringify(error))
                res.write(JSON.stringify(error));
                res.end();
            }else{
                res.redirect('/containerType');
            }
        });
    });

    //Update handlers
    router.get('/:container_type_id', function(req, res){
      var callbackCount = 0;
      var context = {};
      var mysql = req.app.get('mysql');
      getOneContainerType(res, mysql, context, req.params.container_type_id, complete);
      function complete(){
              callbackCount++;
              if(callbackCount >= 1){
                  res.render('updateContainerType', context);
              }
            }
    });

    //Update chemical from updateContainerType.handlebars form
    router.post('/:container_type_id', function(req, res){
          var mysql = req.app.get('mysql');
          //Update for container_type attributes
          var sql = "UPDATE container_type SET container_type_name=?, container_max_volume=? WHERE container_type_id=?";
          var inserts = [req.body.containerTypeName, req.body.containerTypeMaxVolume, req.params.container_type_id];
          sql = mysql.pool.query(sql,inserts,function(error, results, fields){
              if(error){
                  console.log(error)
                  res.write(JSON.stringify(error));
                  res.end();
              }else{
                res.redirect('/containerType');
              }
          });
    });

    //Delete container type  row at id
    router.delete('/:id', function(req, res){
        var mysql = req.app.get('mysql');
        var sql = "DELETE FROM container_type WHERE container_type_id = ?";
        var inserts = [req.params.id];
        sql = mysql.pool.query(sql, inserts, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.status(400);
                res.end();
            }else{
                res.status(202).end();
            }
        })
    })

  return router;
}();
