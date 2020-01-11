module.exports = function(){
  var express = require('express');
  var router = express.Router();

  /* function returns data to fill the table on /rackType */
  function getRackType(res, mysql, context, complete){
      mysql.pool.query("SELECT rack_type_id, rack_type_name, max_capacity, container_type.container_type_name FROM rack_type LEFT JOIN container_type ON container_type.container_type_id = rack_type.allowed_labware_type ORDER BY rack_type_id ASC LIMIT 20;", function(error, results, fields){
          if(error){
              res.write(JSON.stringify(error));
              res.end();
          }
          context.rackType = results;
          complete();
      });
  }

  function getContainerType(res, mysql, context, complete){
      mysql.pool.query("SELECT container_type_id, container_type_name FROM container_type;", function(error, results, fields){
          if(error){
              res.write(JSON.stringify(error));
              res.end();
          }
          context.container_type = results;
          complete();
      });
  }

  function getOneRackType(res, mysql, context, rack_type_id, complete){
      var sql = "SELECT rack_type_id, rack_type_name, max_capacity FROM rack_type WHERE rack_type_id=?;";
      var inserts = [rack_type_id];
      mysql.pool.query(sql, inserts, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            context.rack_type = results[0];
            complete();
        });
  }

 /* get router to populate chemical info into /rackType view */
  router.get('/', function(req, res){
        var callbackCount = 0;
        var context = {};

        var mysql = req.app.get('mysql');
        getRackType(res, mysql, context, complete);
        getContainerType(res, mysql, context, complete);
        function complete(){
            callbackCount++;
            if(callbackCount >= 2){
                res.render('rackType', context);
            }

        }
    });

/* Allows user to submit new chemical with name, chemical_formula, and molecular_weight attribute */
    router.post('/', function(req, res){

        console.log(req.body)
        var mysql = req.app.get('mysql');
        var sql = "INSERT INTO rack_type(rack_type_name, max_capacity, allowed_labware_type) VALUES (?,?,?)";
        var inserts = [req.body.rackTypeName, req.body.maxCapacity, req.body.labwareType];
        sql = mysql.pool.query(sql,inserts,function(error, results, fields){
            if(error){
                console.log(JSON.stringify(error))
                res.write(JSON.stringify(error));
                res.end();
            }else{
                res.redirect('/rackType');
            }
        });
    });

    //Update handlers
    router.get('/:rack_type_id', function(req, res){
      var callbackCount = 0;
      var context = {};
      var mysql = req.app.get('mysql');
      getOneRackType(res, mysql, context, req.params.rack_type_id, complete);
      getContainerType(res, mysql, context, complete);
      function complete(){
              callbackCount++;
              if(callbackCount >= 2){
                  res.render('updateRackType', context);
              }
            }
    });

    //Update chemical from updateRackType.handlebars form
    router.post('/:rack_type_id', function(req, res){
          var mysql = req.app.get('mysql');
          //Update for container_type attributes
          var sql = "UPDATE rack_type SET rack_type_name=?, max_capacity=?, allowed_labware_type=? WHERE rack_type_id=?";
          var inserts = [req.body.rackTypeName, req.body.maxCapacity, req.body.allowedLabwareType, req.params.rack_type_id];
          sql = mysql.pool.query(sql,inserts,function(error, results, fields){
              if(error){
                  console.log(error)
                  res.write(JSON.stringify(error));
                  res.end();
              }else{
                res.redirect('/rackType');
              }
          });
    });


  return router;
}();
