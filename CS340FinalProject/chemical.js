module.exports = function(){
  var express = require('express');
  var router = express.Router();

  /* function returns data to fill the table on /chemicals */
  function getChemicalTable(res, mysql, context, complete){
      mysql.pool.query("SELECT chemical_id, name, chemical_formula, molecular_weight FROM chemical ORDER BY chemical_id ASC LIMIT 20;", function(error, results, fields){
      //mysql.pool.query("SELECT chemical.chemical_id, chemical.name, chemical.chemical_formula, chemical.molecular_weight, container.container_barcode, container.concentration_uM, container.amount_uL, container_in_rack.rack_barcode, container_in_rack.rack_location FROM chemical INNER JOIN chemical_in_container ON chemical.chemical_id = chemical_in_container.chemical_id LEFT JOIN container ON container.container_barcode = chemical_in_container.container_barcode LEFT JOIN container_in_rack ON container.container_barcode = container_in_rack.container_barcode ORDER BY chemical.chemical_id ASC LIMIT 20;", function(error, results, fields){
          if(error){
              res.write(JSON.stringify(error));
              res.end();
          }
          context.chemical = results;
          complete();
      });
  }

  function getContainer(res, mysql, context, complete){
      mysql.pool.query("SELECT container.container_barcode FROM container ORDER BY container.container_barcode ASC LIMIT 20;", function(error, results, fields){
          if(error){
              res.write(JSON.stringify(error));
              res.end();
          }
          context.container = results;
          complete();
      });
  }

  function getChemical(res, mysql, context, chemical_id, complete){
      var sql = "SELECT chemical_id as chemical_id, name, chemical_formula, molecular_weight FROM chemical WHERE chemical_id=?";
      var inserts = [chemical_id];
      mysql.pool.query(sql, inserts, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            context.chemical = results[0];
            complete();
        });
  }
  //Function to update chemical_in_container table when user is on updateChemical page
    function updateContainerBarcode(res, mysql, container_barcode, chemical_id) {
      //Check if there is an entry for the given chemical_id in the chemical_in_container table
      var sql = "SELECT container_barcode FROM chemical_in_container WHERE chemical_id=?";
      var inserts = [chemical_id];
      mysql.pool.query(sql, inserts, function(error, results, fields){
            if(error){
                res.write(JSON.stringify(error));
                res.end();
            }
            //IF there is an entry for the given chemical_id, then UPDATE the current chemical to a new container
            if(results[0]) {
              sql = "UPDATE chemical_in_container SET container_barcode=? WHERE chemical_id=?";
              inserts = [container_barcode, chemical_id];
              mysql.pool.query(sql, inserts, function(error, results, fields) {
                if(error) {
                  res.write(JSON.stringify(error));
                  res.end();
                } else {
                  res.redirect('/chemical');
                }
              });
            //ELSE make a new entry in the table for the given chemical_id
            } else {
              sql = "INSERT INTO chemical_in_container(chemical_id, container_barcode) VALUES (?,?)";
              inserts = [chemical_id, container_barcode];
              mysql.pool.query(sql, inserts, function(error, results, fields) {
                if(error) {
                  res.write(JSON.stringify(error));
                  res.end();
                } else {
                  res.redirect('/chemical');
                }
              });
            }
        });
    }
//Function to delete entry from chemical_in_container table if user UPDATES to no container
  function deleteContainer(res, mysql, container_barcode, chemical_id) {
    var sql = "SELECT * FROM chemical_in_container WHERE chemical_id=? AND container_barcode=?";
    var inserts = [chemical_id, container_barcode];
    mysql.pool.query(sql, inserts, function(error, results, fields){
          if(error){
              res.write(JSON.stringify(error));
              res.end();
          } else {
            if(results[0]) {
              var sql = "DELETE FROM chemical_in_container WHERE chemical_id=? AND container_barcode=?";
              mysql.pool.query(sql, inserts, function(error, results, fields) {
                if(error) {
                  res.write(JSON.stringify(error));
                  res.end();
                } else {
                  res.redirect('/chemical');
                }
              });
            } else {
              res.redirect('/chemical');
            }
          }
        });
  }

 /* get router to populate chemical info into /chemical view */
    router.get('/', function(req, res){
        var callbackCount = 0;
        var context = {};
        var mysql = req.app.get('mysql');
        getChemicalTable(res, mysql, context, complete);
        getContainer(res, mysql, context, complete);
        function complete(){
            callbackCount++;
            if(callbackCount >= 2){
                res.render('chemical', context);
            }
        }
    });

    router.get('/searchChemical', function(req, res){
      console.log("Search Chemical GET")
      var context = {};
      var mysql = req.app.get('mysql');
      var sql = "SELECT chemical.chemical_id, chemical.name, chemical_in_container.container_barcode FROM chemical LEFT JOIN chemical_in_container ON chemical_in_container.chemical_id = chemical.chemical_id WHERE chemical.name=?"; 
      console.log("REQ.QUERY.SEARCHNAME");
      console.log(req.query);
      var inserts = [req.query.searchName];
      mysql.pool.query(sql, inserts, function(error, results, fields){
        if(error){
          res.send("THIS CHEMICAL DOES NOT EXIST IN THE DATABASE");
          res.end();
        }

        else{
          context.searchContainer = results;
          console.log("CONTEXT SEARCH CONTAINER QUERY");
          console.log(context.searchContainer);
          res.render('searchChemical', context);
        }
      })

    })

/* Allows user to submit new chemical with name, chemical_formula, and molecular_weight attribute */
    router.post('/', function(req, res){
      //if post is from addition form, run this
      console.log(req.body);
      if(req.body.chemicalName) {
          console.log(req.body)
          var mysql = req.app.get('mysql');
          var sql = "INSERT INTO chemical(name, chemical_formula, molecular_weight) VALUES (?,?,?)";
          var anotherSql = "INSERT INTO chemical_in_container(chemical_id, container_barcode) VALUES (?,?)";
          var inserts = [req.body.chemicalName, req.body.chemicalFormula, req.body.molecularWeight];
          sql = mysql.pool.query(sql,inserts,function(error, results, fields){
            if(error){
                console.log(JSON.stringify(error));
                //res.write(JSON.stringify(error));
                res.send("THE CHEMICAL NAME ALREADY EXISTS IN THE DATABASE");
                res.end();
            }else{
              if(req.body.newContainerBarcode) {
                complete();
              }else {
                res.redirect('/chemical');
              }
            }
          });
    //call from within first sql query, allows set up of chemical_id and container_barcode in the chemical_in_container tabe
          function complete(){
          var anotherSql = "INSERT INTO chemical_in_container(chemical_id, container_barcode) VALUES ((SELECT chemical.chemical_id FROM chemical WHERE chemical.name = ?),?)";
          var anotherInserts = [req.body.chemicalName, req.body.newContainerBarcode];
          anotherSql = mysql.pool.query(anotherSql,anotherInserts,function(error, results, fields){
                if(error){
                    console.log(JSON.stringify(error));
                    //res.write(JSON.stringify(error));
                    //console.log("SORRY THAT CONTAINER DOES NOT EXIST IN THE DATABASE");
                    res.send("SORRY THAT CONTAINER DOES NOT EXIST IN THE DATABASE. THE CHEMICAL WAS STILL REGISTERED. PLEASE MOVE CHEMICAL TO AN EXISTING CONTAINER");
                    res.end();
                }else{
                    res.redirect('/chemical');
                  }
          });
          }
      }
      //if post is from update form, run this
      if(req.body.moveChemicalID && req.body.moveContainerBarcode) {
        var mysql = req.app.get('mysql');
        var sql = "SELECT * FROM chemical_in_container WHERE chemical_id=? AND container_barcode=?";
        var inserts = [req.body.moveChemicalID, req.body.moveContainerBarcode];
        sql = mysql.pool.query(sql,inserts,function(error, results, fields){
          if(error){
              console.log(JSON.stringify(error))
              res.write(JSON.stringify(error));
              res.end();
            //do nothing if container and chemical relationship exists in chemical_in_container
          } else if(results[0]) {
            console.log("ENTRY IS ALREADY IN TABLE!");
            res.redirect('/chemical');
          }
          //insert chemical_id and container_barcode into the chemical_in_container table
          else{
            var sql = "INSERT INTO chemical_in_container(chemical_id, container_barcode) VALUES (?,?)";
            var inserts = [req.body.moveChemicalID, req.body.moveContainerBarcode];
            sql = mysql.pool.query(sql,inserts,function(error, results, fields) {
              if(error) {
                console.log(error);
                res.write(JSON.stringify(error));
                res.end();
              } else {
                res.redirect('/chemical');
              }
            });
              }
            });
          }
        });

  //Update handlers
  router.get('/:chemical_id', function(req, res){
    var callbackCount = 0;
    var context = {};
    var mysql = req.app.get('mysql');
    getChemical(res, mysql, context, req.params.chemical_id, complete);
    getContainer(res, mysql, context, complete);
    function complete(){
            callbackCount++;
            if(callbackCount >= 2){
                res.render('updateChemical', context);
            }
          }
  });
  // router.post('/:chemical_id', function(req, res){
  //       callbackCount = 0;
  //       var mysql = req.app.get('mysql');
  //       console.log(req.body)
  //       console.log(req.params.id)
  //       var sql = "UPDATE chemical SET name=?, chemical_formula=?, molecular_weight=? WHERE chemical_id=?";
  //       var inserts = [req.body.chemicalName, req.body.chemicalFormula, req.body.molecularWeight, req.params.chemical_id];
  //       var anotherSql = "UPDATE chemical_in_container SET container_barcode=? WHERE chemical_id=?";
  //       var anotherInserts = [req.body.newContainerBarcode, req.params.chemical_id];
  //       sql = mysql.pool.query(sql,inserts,function(error, results, fields){
  //           if(error){
  //               console.log(error)
  //               res.write(JSON.stringify(error));
  //               res.end();
  //           }else{
  //             anotherSql = mysql.pool.query(anotherSql,anotherInserts,function(error, results, fields){
  //                 if(error){
  //                     console.log(error)
  //                     res.write(JSON.stringify(error));
  //                     res.end();
  //                 }else{
  //                   res.redirect('/chemical');
  //                 }
  //             });
  //           }
  //       });
  //
  // });
  //Update chemical from updateChemical.handlebars form
  router.post('/:chemical_id', function(req, res){
        var mysql = req.app.get('mysql');
        //Update for chemical attributes
        var sql = "UPDATE chemical SET name=?, chemical_formula=?, molecular_weight=? WHERE chemical_id=?";
        var inserts = [req.body.chemicalName, req.body.chemicalFormula, req.body.molecularWeight, req.params.chemical_id];
        sql = mysql.pool.query(sql,inserts,function(error, results, fields){
            if(error){
                console.log(error)
                res.write(JSON.stringify(error));
                res.end();
            }else{
              //IF user selects a container option then call updateContainerBarcode to update the chemical_in_container table
              if(req.body.newContainerBarcode) {
                updateContainerBarcode(res, mysql, req.body.newContainerBarcode, req.params.chemical_id);
              //ELSE just send user back to chemical page
              } else {
                res.redirect('/chemical');
              }
            }
        });
  });

  //Delete chemical row at id
  router.delete('/:id', function(req, res){
    var mysql = req.app.get('mysql');
    var sql = "DELETE FROM chemical WHERE chemical_id = ?";
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
