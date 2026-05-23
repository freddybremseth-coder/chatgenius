<?php
// api/submit_lead.php
header('Content-Type: application/json');
require_once '../CRMAutomation.php';
require_once '../EmailAutomation.php'; // For å sende svar med en gang

// Sjekk metode
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Hent data
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'No data received']);
    exit;
}

try {
    // 1. Initialiser systemene dine
    $crm = new CRMAutomation();
    $db = new Database(); // Antar denne koblingen fungerer via include i klassene
    $emailer = new EmailAutomation($db);

    // 2. Formater data for CRM
    $leadData = [
        'name' => $input['name'],
        'email' => $input['email'],
        'company' => $input['company'] ?? '',
        'source' => 'web_custom_request',
        'meeting_type' => 'inquiry', // Placeholder
        'meeting_title' => 'Forespørsel: ' . ($input['message'] ?? 'Ingen melding'),
        'interests' => implode(', ', $input['interests'] ?? [])
    ];

    // 3. Registrer i CRM (Dette lagrer i DB)
    $contactId = $crm->registerFromMeeting($leadData); 

    // 4. Send automatisk AI-generert svar (Bruker EmailAutomation klassen din)
    // Her ber vi AI generere en velkomst basert på det kunden krysset av
    $context = [
        'interests' => $leadData['interests'],
        'company' => $leadData['company']
    ];
    
    // Du må kanskje utvide generateAIEmail i EmailAutomation.php til å håndtere 'custom_inquiry'
    // For nå bruker vi 'welcome' malen du allerede har
    $emailer->sendWelcomeEmail($input['name'], $input['email']);

    echo json_encode(['success' => true, 'id' => $contactId]);

} catch (Exception $e) {
    error_log("Lead Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['error' => 'Internal server error']);
}
?>