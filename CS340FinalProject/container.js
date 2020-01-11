module.exports = function(){
    var express = require('express');
    var router = express.Router();

    function getContainer(res, mysql, context, complete){
        mysql.pool.query("SELECT chemical.name, container.container_barcode, container_type.container_type_name, container.concentration_uM, container.amount_uL, container_in_rack.rack_barcode FROM container LEFT JOIN chemical_in_container ON container.container_barcode = chemical_in_container.container_barcode LEFT JOIN chemical ON chemical_in_container.chemical_id = chemical.chemical_id LEFT JOIN container_type ON container.container_type_id = container_type.container_type_id LEFT JOIN container_in_rack ON container_in_rack.container_barcode = container.container_barcode ORDER BY container.container_barcode DESC LIMIT 20;", function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                console.log("ERROR"); 
                res.end();
            }
            context.container = results;
            //console.log(context.container);
            complete();
        });
    }

    function getContainerType(res, mysql, context, complete){
        mysql.pool.query("SELECT container_type_id, container_type_name FROM container_type ORDER BY container_type_id ASC LIMIT 20", function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                console.log("ERROR");
                res.end();
            }
            context.container_type = results;
            //console.log(context.container_type);
            complete();
        });
    }

    function getChemical(res, mysql, context, complete){
        mysql.pool.query("SELECT chemical_id, name FROM chemical", function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                console.log("ERROR");
                res.end();
            }
            context.chemical = results;
            complete();
        });
    }

    function getRack(res, mysql, context, complete){
        mysql.pool.query("SELECT rack_barcode FROM rack LIMIT 20", function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                console.log("ERROR");
                res.end();
            }
            context.rack = results;
            complete();
        });
    }

    function getContainerUpdate(res, mysql, context, container_barcode, complete){
        var sql = "SELECT container_barcode as container_barcode, container.container_type_id, concentration_uM, amount_uL FROM container WHERE container_barcode=?";
        var inserts = [container_barcode];
        mysql.pool.query(sql, inserts, function(error, results, fields){
              if(error){
                  res.write(JSON.stringify(error));
                  res.end();
              }
              context.container = results[0];
              complete();
          });
    }

  //Function to update continaer_in_rack table when user is on updateContainer page
    function updateRack(res, mysql, container_barcode, rack_barcode) {
      //Check if there is an entry for the given container_barcode in the container_in_rack table
      var sql = "SELECT * FROM container_in_rack WHERE container_barcode=? AND rack_barcode=?";
      var inserts = [container_barcode, rack_barcode];
      mysql.pool.query(sql, inserts, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            //IF there is an entry for the given container_barcode, then redirect to container
            if(results[0]) {
              console.log("ENTRY IS ALREADY IN TABLE!");
              res.redirect('/container');
            //ELSE make a new entry in the table for the given container_barcode
            } else {
              sql = "INSERT INTO container_in_rack(rack_barcode, container_barcode) VALUES (?,?)";
              inserts = [rack_barcode, container_barcode];
              mysql.pool.query(sql, inserts, function(error, results, fields) {
                if(error) {
                  res.write(JSON.stringify(error));
                  res.end();
                } else {
                  res.redirect('/container');
                }
              });
            }
        });
    }

    router.get('/', function(req, res){
          var callbackCount = 0;
          var context = {};
          var mysql = req.app.get('mysql');
          getContainer(res, mysql, context, complete);
          getContainerType(res, mysql, context, complete);
          getRack(res, mysql, context, complete);
          getChemical(res, mysql, context, complete);
          function complete(){
              callbackCount++;
              if(callbackCount >= 4){
                  res.render('container', context);
              }
          }
      });

      //Allows adding of chemicals to a given container
      //Commented out to add new function below
      /*router.post('/addChems', function(req, res) {
        //checks if any chemicals were selected, if no chems were selected then redirect to container page
        if(req.body.chemical) {
          var mysql = req.app.get('mysql');
          //For each chemical selected, check if chemical/container relation exists in chemical_in_container table
          req.body.chemical.forEach(function(id) {
            var sql = "SELECT * FROM chemical_in_container WHERE chemical_id=? AND container_barcode=?";
            var inserts = [id, req.body.containerBarcode];
            sql = mysql.pool.query(sql,inserts,function(error, results, fields){
              if(error){
                  console.log(JSON.stringify(error))
                  res.write(JSON.stringify(error));
                  res.end();
                //do nothing if container and chemical relationship exists in chemical_in_container
              } else if(results[0]) {
                console.log("ENTRY IS ALREADY IN TABLE!");
              }
              //For each chemical selected, insert chemical_id and container_barcode into the chemical_in_container table
              else{
                var sql = "INSERT INTO chemical_in_container(chemical_id, container_barcode) VALUES(?,?)";
                var inserts = [id, req.body.containerBarcode];
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
          res.redirect('/container');
        } else {
          res.redirect('/container');
        }
      });*/

       //Allows adding of chemicals to a given container
      router.post('/addChems', function(req, res) {
        //checks if any chemicals were selected, if no chems were selected then redirect to container page
        console.log("/addChems post");
        console.log(req.body)
        if(req.body.containerBarcode) {
          var mysql = req.app.get('mysql');
          var sql = "SELECT * FROM chemical LEFT JOIN chemical_in_container ON chemical.chemical_id = chemical_in_container.chemical_id WHERE chemical.name=? AND chemical_in_container.container_barcode=?";
          var inserts = [req.body.listChemical, req.body.containerBarcode];
          sql = mysql.pool.query(sql,inserts,function(error, results, fields){
            if(error){
                console.log(JSON.stringify(error))
                res.write(JSON.stringify(error));
                res.end();
              //do nothing if container and chemical relationship exists in chemical_in_container
            } else if(results[0]) {
              console.log("Query results")
              console.log(results[0]);
              console.log("ENTRY IS ALREADY IN TABLE!");
              res.redirect('/container');
              //alert("Chemical is already in this container");
            }
            //For each chemical selected, insert chemical_id and container_barcode into the chemical_in_container table
            else{
              console.log("CHEMICAL ID QUERY");
              var sql = "SELECT * FROM chemical WHERE name=?";
              var inserts = [req.body.listChemical];
              sql = mysql.pool.query(sql, inserts, function(error, results, fields){
                if(error){
                  console.log("ERRORED ON CHEMICAL ID QUERY");
                  res.write(JSON.stringify(error));
                  res.end();
                }

                else{
                  var count = 0;
                  console.log("Results Query");
                  console.log("RESULTS");
                  console.log(results[0]);

                  //Chemical name query did not come up as "undefined"
                  if(typeof(results[0])!="undefined"){
                    var id = results[0].chemical_id;
                  }

                  //Chemical name query does not exist in database
                  else{
                    console.log("Query came up empty because chemical name does not exist");
                    count = 1;
                  }

                  if(count == 0){
                    console.log("Results from chemical query");
                    console.log(id);
                    var sql = "INSERT INTO chemical_in_container(chemical_id, container_barcode) VALUES(?,?)";
                    var inserts = [id, req.body.containerBarcode];
                    sql = mysql.pool.query(sql,inserts,function(error, results, fields){
                    if(error){
                      console.log(JSON.stringify(error));
                      res.write(JSON.stringify(error));
                      res.end();
                    }

                    else{
                      var sql = "UPDATE container SET concentration_uM=?, amount_uL=? WHERE container_barcode=?";
                      var inserts = [req.body.concentration, req.body.amount, req.body.containerBarcode];
                      console.log("INSERTS FOR UPDATE CONTAINER");
                      console.log(inserts);
                      sql = mysql.pool.query(sql,inserts,function(error, results, fields){
                      if(error){
                        console.log(JSON.stringify(error));
                        res.write(JSON.stringify(error));
                        res.end();
                      }

                      else{
                        console.log("UPDATED PROPERLY!");
                        res.redirect('/container');
                      }
                      })
                    }
                  });
                  }

                  else{
                    console.log("CHEMICAL NAME DOES NOT EXIST");
                    res.send("CHEMICAL NAME DOES NOT EXIST IN DATABASE");
                    res.end();
                  }
                }
              });
            }
          });
        }
      });

      /* Allows user to submit new container with container_barcode, container_type_id, concentration_uM, amount_uL attribute */
    /*router.post('/', function(req, res){
        var mysql = req.app.get('mysql');
        var sql = "INSERT INTO container(container_barcode, container_type_id, concentration_uM, amount_uL) VALUES (?,?,?,?)";
        var inserts = [req.body.containerBarcode, req.body.containerType, req.body.concentration, req.body.amount];
        sql = mysql.pool.query(sql,inserts,function(error, results, fields){
            if(error){
                console.log(JSON.stringify(error))
                res.write(JSON.stringify(error));
                res.end();
            }else{

                if(req.body.rack) {
                  var anotherSql = "INSERT INTO container_in_rack(container_barcode, rack_barcode) VALUES (?,?)";
                  var anotherInserts = [req.body.containerBarcode, req.body.rack];
                  anotherSql = mysql.pool.query(anotherSql,anotherInserts,function(error, results, fields){
                      if(error){
                          console.log(JSON.stringify(error))
                          res.write(JSON.stringify(error));
                          res.end();
                      }else{
                          res.redirect('/container');
                      }
                  });
                }else {
                  res.redirect('/container');
                }
            }
        });
    });*/

    router.post('/', function(req, res){
      var mysql = req.app.get('mysql');
      var sql = "INSERT INTO container(container_barcode, container_type_id) VALUES (?,?)";
      var inserts = [req.body.containerBarcode, req.body.containerType];
      sql = mysql.pool.query(sql,inserts,function(error, results, fields){
          if(error){
              console.log(JSON.stringify(error))
              res.send("THIS CONTAINER BARCODE ALREADY EXISTS WITHIN THE DATABASE");
              res.end();
          }else{
              if(req.body.rack) {
                var anotherSql = "INSERT INTO container_in_rack(container_barcode, rack_barcode) VALUES (?,?)";
                var anotherInserts = [req.body.containerBarcode, req.body.rack];
                anotherSql = mysql.pool.query(anotherSql,anotherInserts,function(error, results, fields){
                    if(error){
                        console.log(JSON.stringify(error))
                        res.write(JSON.stringify(error));
                        res.end();
                    }else{
                        res.redirect('/container');
                    }
                });
              }else {
                res.redirect('/container');
              }
          }
      });
  });

    //update container at Barcode
    router.get('/:container_barcode', function(req, res){
       var callbackCount = 0;
      var context = {};
      var mysql = req.app.get('mysql');
      getContainerUpdate(res, mysql, context, req.params.container_barcode, complete);
      getContainerType(res, mysql, context, complete);
      getRack(res, mysql, context, complete);
      function complete(){
              callbackCount++;
              if(callbackCount >= 3){
                  res.render('updateContainer', context);
              }
            }

    });
    //Update container from updateContainer.handlebars form
    router.post('/:container_barcode', function(req, res){
          var mysql = req.app.get('mysql');
          //Update for container attributes
          var sql = "UPDATE container SET container_type_id=?, concentration_uM=?, amount_uL=? WHERE container_barcode=?";
          var inserts = [req.body.containerType, req.body.concentration, req.body.amount, req.params.container_barcode];
          sql = mysql.pool.query(sql,inserts,function(error, results, fields){
              if(error){
                  console.log(error)
                  res.write(JSON.stringify(error));
                  res.end();
              }else{
                //IF user selects a rack option then call updateRack to update the container_in_rack table
                if(req.body.rack) {
                  updateRack(res, mysql, req.params.container_barcode, req.body.rack);
                //ELSE just send user back to container page
                } else {
                  res.redirect('/container');
                }
              }
          });
    });
    //Delete container at barcode
    router.delete('/:id', function(req, res){
        var mysql = req.app.get('mysql');
        var sql = "DELETE FROM container WHERE container_barcode = ?";
        var inserts = [req.params.id];
        sql = mysql.pool.query(sql, inserts, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.status(400);
                res.end();
            }else{
                res.status(202).end();
                console.log("I DELETED CONTAINER");
            }
        })
    })

    return router;
  }();
