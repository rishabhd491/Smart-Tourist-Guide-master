<?php
/*
@author Aman Srivastava
@date 27-03-2019
*/
	$dbhost = 'localhost';
    $dbuser = 'root';
    $dbpass = '';  // Use the password you set during MySQL secure installation if needed
	$dbname = "sctdb";
    $conn = new mysqli($dbhost, $dbuser, $dbpass, $dbname);    
    if ($conn->connect_error)
    die("Connection failed: " . $conn->connect_error);
?>