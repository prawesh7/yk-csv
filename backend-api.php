<?php
// Simple PHP backend for YK-CSV (alternative to Python)
// This can be used if Python backend doesn't work on HostPapa

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Simple transliteration endpoint
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['text'])) {
    $text = $_POST['text'];
    
    // Basic Roman to Hindi mapping (you can expand this)
    $transliteration_map = [
        'hari' => 'हरि',
        'krishna' => 'कृष्ण',
        'ram' => 'राम',
        'shyam' => 'श्याम',
        'govind' => 'गोविन्द',
        'gopal' => 'गोपाल',
        'radha' => 'राधा',
        'sita' => 'सीता',
        'hanuman' => 'हनुमान',
        'ganga' => 'गंगा',
        'yamuna' => 'यमुना',
        'kripalu' => 'कृपालु',
        'gurudev' => 'गुरुदेव',
        'bali' => 'बलि',
        'shri' => 'श्री'
    ];
    
    $hindi_text = $text;
    foreach ($transliteration_map as $roman => $hindi) {
        $hindi_text = str_ireplace($roman, $hindi, $hindi_text);
    }
    
    echo json_encode(['hindi_text' => $hindi_text]);
    exit;
}

// Health check endpoint
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode(['status' => 'ok', 'message' => 'YK-CSV PHP API is running']);
    exit;
}

// Default response
echo json_encode(['error' => 'Invalid request']);
?>
