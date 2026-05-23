<?php
// api/chat_api.php

// 1. Sikkerhet og Headers (Tillat at Vercel-appen din snakker med denne)
header("Access-Control-Allow-Origin: *"); // I prod: Bytt * med https://din-app.vercel.app
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Håndter "Pre-flight" check fra React
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 2. Konfigurasjon
$apiKey = getenv('OPENAI_API_KEY');
$assistantId = 'asst_KnekZVeN6Va4gvgbkjVv7bgE'; // (asst_...)

if (!$apiKey) {
    http_response_code(500);
    echo json_encode(['error' => 'OPENAI_API_KEY is not configured']);
    exit;
}

// 3. Hent data fra React
$input = json_decode(file_get_contents('php://input'), true);
$userMessage = $input['message'] ?? '';
$threadId = $input['threadId'] ?? null; // For å huske samtalen

if (!$userMessage) {
    echo json_encode(['error' => 'Ingen melding mottatt']);
    exit;
}

// Hjelpefunksjon for cURL-kall mot OpenAI
function openAICall($endpoint, $data, $method = 'POST') {
    global $apiKey;
    $ch = curl_init("https://api.openai.com/v1/" . $endpoint);
    $headers = [
        "Content-Type: application/json",
        "Authorization: Bearer " . $apiKey,
        "OpenAI-Beta: assistants=v2" // Viktig for Assistants API!
    ];
    
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    if ($data) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    if ($method != 'POST') curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
    
    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
}

try {
    // 4. Opprett tråd hvis den ikke finnes
    if (!$threadId) {
        $threadRun = openAICall('threads', []);
        $threadId = $threadRun['id'];
    }

    // 5. Legg til brukerens melding i tråden
    openAICall("threads/$threadId/messages", [
        'role' => 'user',
        'content' => $userMessage
    ]);

    // 6. Kjør Assistenten (Run)
    $run = openAICall("threads/$threadId/runs", [
        'assistant_id' => $assistantId
    ]);
    $runId = $run['id'];

    // 7. Vent på svar (Polling)
    // OpenAI trenger tid til å tenke/lese filer. Vi må vente.
    $status = 'queued';
    while ($status != 'completed') {
        sleep(1); // Vent 1 sekund
        $check = openAICall("threads/$threadId/runs/$runId", [], 'GET');
        $status = $check['status'];
        
        if ($status === 'failed' || $status === 'cancelled') {
            throw new Exception("AI feilet: " . json_encode($check));
        }
    }

    // 8. Hent svaret
    $messages = openAICall("threads/$threadId/messages", [], 'GET');
    $reply = $messages['data'][0]['content'][0]['text']['value'];

    // Send svar tilbake til React
    echo json_encode([
        'reply' => $reply,
        'threadId' => $threadId // Send tråd-ID tilbake så React kan huske den
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
