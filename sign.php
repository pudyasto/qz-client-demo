<?php

$key = ('qztray/key.pem');
$req = $_GET['param']; //GET method

$privateKey = openssl_get_privatekey(file_get_contents($key));

$signature = null;
openssl_sign($req, $signature, $privateKey, "sha512");

if ($signature) {
    header("Content-type: text/plain");
    echo base64_encode($signature);
} else {
    echo '<h1>Error signing message</h1>';
}
