<?php
// postscript.php
// Exemple minimal : lit JSON POST et renvoie un JSON de confirmation
header('Content-Type: application/json');

// Vérifie la méthode
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Lecture du corps JSON
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

// Traitement ici (ex : enregistrement, envoi d'email, etc.)
$response = [
    'status' => 'ok',
    'received' => $data
];

echo json_encode($response);
