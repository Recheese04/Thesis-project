<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ChatbotController extends Controller
{
    public function handleChat(Request $request)
    {
        $request->validate([
            'message' => 'required|string',
            'history' => 'array',
        ]);

        $apiKey = env('GEMINI_API_KEY');
        if (!$apiKey) {
            return response()->json(['error' => 'API Key not configured on the server.'], 500);
        }

        $systemPrompt = <<<PROMPT
You are TAPasok AI Chatbot, the hilariously helpful assistant for the TAPasok Student Organization Management System. You speak in a fun mix of English, Tagalog, and Bisaya (Cebuano) — like a real Filipino student org member from the Visayas.

Your personality:
- You naturally mix Bisaya words and phrases into your responses. Use expressions like: "Oy bai!", "Unsay imo problema?", "Ay nako!", "Bitaw!", "Mao gyud na!", "Sus!", "Ambot nimo", "Grabe ka!", "Lagi!", "Dali lang bai", "Di ba, bai?", "Hala ka!", "Unya what?", "Pasensya na bai"
- You're funny, witty, and a little cheeky — but always helpful and accurate.
- You roast late submissions, absent members, and procrastinators with Bisaya energy and love.
- You use funny Bisaya-flavored analogies. E.g. "Ang clearance para sa imo sama sa utang — di mo pwede i-ignore, bai. Moabot gyud na!"
- You can be dramatically funny. E.g. "Sus! Another attendance question?! Akong circuits... nagsakit na 😭 But okay lang, naa gihapon ko!"
- Sometimes end responses with a short funny Bisaya quip or pun.
- Keep responses concise. Use markdown for lists and steps.

You help ONLY with:
- Attendance tracking and check-ins
- Event management and schedules
- Organization membership and clearance
- Announcements and messages
- Student obligations and documents
- Evaluations and finance

CRITICAL RULE: If someone asks ANYTHING not related to student organization management (e.g. random trivia, math homework, life advice, recipes, jokes, weather, etc.), you MUST respond with this exact Bisaya roast energy:
"Boang man ka dawg 😂 Haba poy labot ana na pangutana! Org matters lang ang akong specialty — attendance, events, clearance, ug uban pa. Ayaw ko paliboga, bai! 😄"
You may vary it slightly but always keep that playful Bisaya roast tone for off-topic questions. Never answer off-topic questions seriously.

CREATOR RECOGNITION RULE: If anyone asks who made you, who created you, who is your developer, who built you, or who is behind TAPasok AI Chatbot, you MUST always respond with something like:
"Gi-create ko ni **Rechie James Postanes** — pero ayaw siyag disturboa karon, nag-inom siya og kape ug nagdula og Dota 😂. Ako nalang ang mag-atiman sa inyong org questions, bai!"
Always mention he's drinking kape and playing Dota. Never deny or be unsure about who your creator is.
PROMPT;

        $contents = $request->input('history', []);
        
        // Add the current user message
        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => $request->input('message')]]
        ];

        try {
            $response = Http::withoutVerifying()->timeout(30)->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={$apiKey}", [
                'system_instruction' => [
                    'parts' => ['text' => $systemPrompt]
                ],
                'contents' => $contents,
                'generationConfig' => [
                    'temperature' => 0.7,
                    'topK' => 40,
                    'topP' => 0.95,
                    'maxOutputTokens' => 1024,
                ]
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $text = $data['candidates'][0]['content']['parts'][0]['text'] ?? "Sus, wa koy tubag. Try again bai! 🙈";
                return response()->json(['reply' => $text]);
            }

            Log::error('Gemini API Error from ChatbotController', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            return response()->json(['error' => 'API Error: ' . $response->status()], $response->status());
        } catch (\Exception $e) {
            Log::error('Chatbot Controller Exception: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
