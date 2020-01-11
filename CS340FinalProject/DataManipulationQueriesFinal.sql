-- These are the Database Manipulation queries for our Compound Management Database Project

--Get chemical table
SELECT chemical_id, name, chemical_formula, molecular_weight 
FROM chemical 
ORDER BY chemical_id ASC LIMIT 20;

--Get container table
SELECT container.container_barcode 
FROM container 
ORDER BY container.container_barcode ASC LIMIT 20;

--Get chemical table based on chemical id
SELECT chemical_id as chemical_id, name, chemical_formula, molecular_weight FROM chemical WHERE chemical_id = :idInput; 

--Get container barcode based on chemical id
SELECT container_barcode FROM chemical_in_container 
WHERE chemical_id = :idInput; 

--Update chemical_in_container table with container barcode and chemical id 
UPDATE chemical_in_container SET container_barcode = :barcodeInput 
WHERE chemical_id = :idInput; 

--Insert into chemical_in_container table with chemical id and container barcode 
INSERT INTO chemical_in_container(chemical_id, container_barcode) VALUES (:idInput, :barcodeInput); 

--Select chemical_in_container table with chemical id and container barcode 
SELECT * FROM chemical_in_container 
WHERE chemical_id = :idInput AND container_barcode = :barcodeInput; 

--Delete chemical_in_container row based on container barcode and chemical id 
DELETE FROM chemical_in_container 
WHERE chemical_id = :idInput AND container_barcode = :containerInput;

--Search if chemical is in a container based on chemical name
SELECT chemical.chemical_id, chemical.name, chemical_in_container.container_barcode FROM chemical 
LEFT JOIN chemical_in_container 
ON chemical_in_container.chemical_id = chemical.chemical_id 
WHERE chemical.name= :nameInput; 

--Insert into chemical table 
INSERT INTO chemical(name, chemical_formula, molecular_weight) VALUES (:nameInput, :formulaInput, :molWeightInput);

--Insert into chemical in container table
INSERT INTO chemical_in_container(chemical_id, container_barcode) VALUES (?=:idInput, :barcodeInput); 

--Update chemical table
UPDATE chemical SET name = :nameInput, chemical_formula = :formulaInput, molecular_weight = :molWeightInput WHERE chemical_id = :idInput;

--Delete chemical on chemical id 
DELETE FROM chemical WHERE chemical_id = :idInput;

--Get chemical inventory table that shows container and rack barcode information 
SELECT chemical.name, container.container_barcode, container_type.container_type_name, container.concentration_uM, container.amount_uL, container_in_rack.rack_barcode FROM container 
LEFT JOIN chemical_in_container ON container.container_barcode = chemical_in_container.container_barcode 
LEFT JOIN chemical ON chemical_in_container.chemical_id = chemical.chemical_id 
LEFT JOIN container_type ON container.container_type_id = container_type.container_type_id 
LEFT JOIN container_in_rack ON container_in_rack.container_barcode = container.container_barcode 
ORDER BY container.container_barcode DESC LIMIT 20;

--Get container type table 
SELECT container_type_id, container_type_name FROM container_type 
ORDER BY container_type_id ASC LIMIT 20;

--Get rack table based on barcode 
SELECT rack_barcode FROM rack LIMIT 20;

--Get container table based on container barcode 
SELECT container_barcode as container_barcode, container.container_type_id, concentration_uM, amount_uL FROM container 
WHERE container_barcode = :barcodeInput

--Get container_in_rack table from container_barcode and rack_barcode 
SELECT * FROM container_in_rack WHERE container_barcode= :barcodeInput; AND rack_barcode= :rackInput;

--Move container into rack in the container_in_rack table 
INSERT INTO container_in_rack(rack_barcode, container_barcode) VALUES (:rackInput, :barcodeInput);

--View all chemicals that are inside a container 
SELECT * FROM chemical 
LEFT JOIN chemical_in_container 
ON chemical.chemical_id = chemical_in_container.chemical_id 
WHERE chemical.name= :nameInput AND chemical_in_container.container_barcode= :containerBarcodeInput;

--Update container attributes 
UPDATE container SET concentration_uM=:concInput, amount_uL=:amountInput
WHERE container_barcode=:containerInput;

--Delete contianer based on container id 
DELETE FROM container 
WHERE container_barcode = :bcInput;

--Get container type table 
SELECT container_type_id, container_type_name, container_max_volume FROM container_type 
ORDER BY container_type_id ASC LIMIT 20;

--Get one container type 
SELECT container_type_id, container_type_name, container_max_volume FROM container_type 
WHERE container_type_id= :idInput; 

--Add container type 
INSERT INTO container_type(container_type_name, container_max_volume) VALUES (:nameInput, :volumeInput);

--Update container type 
UPDATE container_type SET container_type_name=:nameInput, container_max_volume=:volumeInput 
WHERE container_type_id=idInput; 

--Delete container type 
DELETE FROM container_type WHERE container_type_id = :idInput;

--Get count of all the containers inside a rack barcode 
SELECT COUNT(*) AS cellsOccupied FROM container_in_rack 
WHERE rack_barcode = :rackInput;

--Update cells occupied
UPDATE rack SET cells_occupied = :cellsInput WHERE rack_barcode = :rackInput;

--Get rack information
SELECT rack_barcode, cells_occupied, rack_type.rack_type_name, rack_type.max_capacity FROM rack 
INNER JOIN rack_type ON rack_type.rack_type_id = rack.rack_type 
ORDER BY rack_barcode ASC LIMIT 20;

--Get rack type table 
SELECT rack_type_id, rack_type_name FROM rack_type 
ORDER BY rack_type_id ASC LIMIT 20;

--Search for rack based on barcode
SELECT rack_barcode, container_barcode FROM container_in_rack
WHERE rack_barcode = :rackInput;

--Update rack type 
INSERT INTO rack(rack_barcode, rack_type) VALUES (:rackinput, :rackTypeInput);

--Delete container from table because container is moving to new rack barcode
DELETE from container_in_rack WHERE container_barcode= :containerInput;

--Update container's new location in rack
INSERT INTO container_in_rack(rack_barcode, container_barcode) VALUES(:barcodeInput, :containerInput);

--Delete rack
DELETE FROM rack 
WHERE rack_barcode = :barcodeInput;

--Get rack type table combined with container type 
SELECT rack_type_id, rack_type_name, max_capacity, container_type.container_type_name FROM rack_type 
LEFT JOIN container_type 
ON container_type.container_type_id = rack_type.allowed_labware_type 
ORDER BY rack_type_id ASC LIMIT 20

--Add new rack type 
INSERT INTO rack_type(rack_type_name, max_capacity, allowed_labware_type) VALUES (:nameInput, :maxInput, :allowedInput);

--Update rack type
UPDATE rack_type SET rack_type_name= :nameInput, max_capacity= :maxInput, allowed_labware_type= :allowedInput 
WHERE rack_type_id= idInput;