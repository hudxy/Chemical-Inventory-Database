module.exports = function(){
  var express = require('express');
  var router = express.Router();

  /* function returns data to fill rack barcode table */
  function getRack(res, mysql, context, complete){
    var promise1 = new Promise(function(resolve, reject) {
      //SELECT rack_barcode for updating cells occupied
      mysql.pool.query("SELECT rack_barcode FROM rack;", function(error, results, fields){
        if(error){
          res.write(JSON.stringify(error));
          res.end();
        }
        //For each rack, count the number of containers in the rack
        results.forEach(function(item, index, array) {
          var sql = "SELECT COUNT(*) AS cellsOccupied FROM container_in_rack WHERE rack_barcode = ?";
          var inserts = [item.rack_barcode];
          mysql.pool.query(sql, inserts, function(error, results, fields){
            if(error){
              res.write(JSON.stringify(error));
              console.log(error);
              res.end();
            }
            //UPDATE the number of cells in each rack
            var asql = "UPDATE rack SET cells_occupied = ? WHERE rack_barcode =?";
            var ainserts = [results[0].cellsOccupied, item.rack_barcode];
            mysql.pool.query(asql, ainserts, function(error, results, fields){
              if(error){
                res.write(JSON.stringify(error));
                console.log(error);
                res.end();
              }
              if(index === array.length-1) {
                resolve();
              }
            });
          });
        });
      });
    });
    promise1.then(()=>{
      //SELECT rack data to fill /rack table
      mysql.pool.query("SELECT rack_barcode, cells_occupied, rack_type.rack_type_name, rack_type.max_capacity FROM rack INNER JOIN rack_type ON rack_type.rack_type_id = rack.rack_type ORDER BY rack_barcode ASC LIMIT 20;", function(error, results, fields){
        if(error) {
          res.write(JSON.stringify(error));
          console.log(error);
          res.end();
        }
        context.rack = results;
        complete();
      });
    });
  }
  //function returns data to populate form to add Containers
  function getContainer(res, mysql, context, complete){
      mysql.pool.query("SELECT container.container_barcode FROM container ORDER BY container.container_barcode ASC LIMIT 20;", function(error, results, fields){
          if(error){
              res.write(JSON.stringify(error));
              console.log(error);
              res.end();
          }
          context.container = results;
          complete();
      });
  }

  function getRackType(res, mysql, context, complete){
      mysql.pool.query("SELECT rack_type_id, rack_type_name FROM rack_type ORDER BY rack_type_id ASC LIMIT 20;", function(error, results, fields){
          if(error){
              res.write(JSON.stringify(error));
              res.end();
          }
          context.rackType = results;
          complete();
      });
  }

  function getOneRack(res, mysql, context, rack_barcode, complete){
      var sql = "SELECT rack_barcode, rack_type FROM rack WHERE rack_barcode=?";
      var inserts = [rack_barcode];
      mysql.pool.query(sql, inserts, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            context.rack = results[0];
            complete();
        });
  }

 /* get router to populate chemical info into /rack view */
  router.get('/', function(req, res){
        var callbackCount = 0;
        var context = {};
        var mysql = req.app.get('mysql');
        getRackType(res, mysql, context, complete);
        getContainer(res, mysql, context, complete);
        getRack(res, mysql, context, complete);
        function complete(){
            callbackCount++;
            if(callbackCount >= 3){
                res.render('rack', context);
            }

        }
    });

    router.get('/searchRack', function(req, res){
      console.log("Search Rack GET")
      var context = {};
      var mysql = req.app.get('mysql');
      var sql = "SELECT rack_barcode, container_barcode FROM container_in_rack  WHERE rack_barcode=?";
      console.log("REQ.QUERY.SEARCHNAME");
      console.log(req.query);
      var inserts = [req.query.searchName];
      mysql.pool.query(sql, inserts, function(error, results, fields){
        if(error){
          res.send("THIS RACK DOES NOT EXIST IN THE DATABASE");
          res.end();
        }

        else{
          context.searchContainer = results;
          console.log("CONTEXT SEARCH CONTAINER QUERY");
          console.log(context.searchContainer);
          res.render('searchRack', context);
        }
      });

    });

/* Allows user to submit new rack with rack_barcode attribute */
    router.post('/', function(req, res){
        console.log(req.body)
        var mysql = req.app.get('mysql');
        var sql = "INSERT INTO rack(rack_barcode, rack_type) VALUES (?, ?)";
        var inserts = [req.body.rackBarcode, req.body.rackType];
        sql = mysql.pool.query(sql,inserts,function(error, results, fields){
            if(error){
                console.log(JSON.stringify(error))
                res.write(JSON.stringify(error));
                res.end();
            }else{
                res.redirect('/rack');
            }
        });
    });


    /*//Allows adding of containers to a given rack
    router.post('/addContainer', function(req, res) {
      //checks if any containers were selected, if no containers were selected then redirect to rack page
      if(req.body.container) {
        var mysql = req.app.get('mysql');
        //For each containers selected, check if rack/container relation exists in container_in_rack table
        req.body.container.forEach(function(container_barcode) {
          var sql = "SELECT * FROM container_in_rack WHERE rack_barcode=? AND container_barcode=?";
          var inserts = [req.body.rackBarcode, container_barcode];
          sql = mysql.pool.query(sql,inserts,function(error, results, fields){
            if(error){
                console.log(JSON.stringify(error))
                res.write(JSON.stringify(error));
                res.end();
              //do nothing if container and rack relationship exists in container_in_rack
            } else if(results[0]) {
              console.log("ENTRY IS ALREADY IN TABLE!");
            }
            //For each container selected, insert rack_barcode and container_barcode into the container_in_rack table
            else{
              var sql = "INSERT INTO container_in_rack(rack_barcode, container_barcode) VALUES(?,?)";
              var inserts = [req.body.rackBarcode, container_barcode];
              sql = mysql.pool.query(sql,inserts,function(error, results, fields){
                if(error){
                    console.log(JSON.stringify(error))
                    res.write(JSON.stringify(error));
                    res.end();
                }
              });
            }
          });
        });
        //When finished inserting into chemical_in_container redirect to container page
        res.redirect('/rack');
      } else {
        res.redirect('/rack');
      }
    });*/

    //Allows adding of chemicals to a given container
    router.post('/moveContainer', function(req, res) {
      //checks if any containers were selected, if no containers were selected then redirect to rack page
      console.log("/moveContainer post");
      console.log(req.body)
      if(req.body.listContainer) {
        var mysql = req.app.get('mysql');
        var sql = "SELECT * FROM container_in_rack WHERE container_barcode=? AND rack_barcode=?";
        var inserts = [req.body.listContainer, req.body.destRack];
        sql = mysql.pool.query(sql,inserts,function(error, results, fields){
          if(error){
              console.log(JSON.stringify(error))
              res.write(JSON.stringify(error));
              res.end();
            //do nothing if container and chemical relationship exists in chemical_in_container
          } else if(results[0]) {
            console.log("Rack query results")
            console.log(results[0]);
            console.log("ENTRY IS ALREADY IN TABLE!");
            res.redirect('/rack');
            //alert("Chemical is already in this container");
          }
          //For each chemical selected, insert chemical_id and container_barcode into the chemical_in_container table
          else{
              var count = 0;
              console.log("Results Query");
              console.log("RESULTS");
              console.log(results[0]);

              //Rack barcode query did not come up as "undefined"
              if(typeof(results[0])=="undefined"){
                var id = req.body.destRack;
                console.log("ID RACK BARCODE");
                console.log(id);
              }

              //Rack barcode query does not exist in database
              else{
                console.log("Query came up empty because rack barocde does not exist");
                count = 1;
              }

              if(count == 0){
                console.log("Results from rack query");
                var sql = "DELETE from container_in_rack WHERE container_barcode=?"; 
                var inserts = [req.body.listContainer];
                sql = mysql.pool.query(sql,inserts,function(error, results, fields){
                if(error){
                  console.log(JSON.stringify(error));
                  res.write(JSON.stringify(error));
                  res.end();
                }
                
                //DELETE WAS SUCCESSFUL, TIME TO INSERT
                else{
                    console.log("DELETED PROPERLY!");
                    
                    //Add container to new rack 
                    var sql = "INSERT INTO container_in_rack(rack_barcode, container_barcode) VALUES(?,?)";
                    var inserts = [req.body.destRack, req.body.listContainer];
                    sql = mysql.pool.query(sql,inserts,function(error, results, fields){
                      if(error){
                        console.log(JSON.stringify(error));
                        res.write(JSON.stringify(error));
                        res.end();
                      }

                      else{
                          console.log("UPDATED PROPERLY!");
                          res.redirect('/rack');
                      }
                    });
                }
              });
            }
              else{
                console.log("RACK BARCODE DOES NOT EXIST");
                res.send("RACK BARCODE DOES NOT EXIST IN DATABASE");
                res.end();
              }
            }
            });
          }
        });

    //Update handlers
    router.get('/:rack_barcode', function(req, res){
      var callbackCount = 0;
      var context = {};
      var mysql = req.app.get('mysql');
      getOneRack(res, mysql, context, req.params.rack_barcode, complete);
      getRackType(res, mysql, context, complete);
      function complete(){
              callbackCount++;
              if(callbackCount >= 2){
                  res.render('updateRack', context);
              }
            }
    });

    //Update rack from updateRack.handlebars form
    router.post('/:rack_barcode', function(req, res){
          var mysql = req.app.get('mysql');
          //Update for container_type attributes
          var sql = "UPDATE rack SET rack_type=? WHERE rack_barcode=?";
          var inserts = [req.body.rackType, req.params.rack_barcode];
          sql = mysql.pool.query(sql,inserts,function(error, results, fields){
              if(error){
                  console.log(error)
                  res.write(JSON.stringify(error));
                  res.end();
              }else{
                res.redirect('/rack');
              }
          });
    });

    //Delete rack row at id
    router.delete('/:id', function(req, res){
        var mysql = req.app.get('mysql');
        var sql = "DELETE FROM rack WHERE rack_barcode = ?";
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
