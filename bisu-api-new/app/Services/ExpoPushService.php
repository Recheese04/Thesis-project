<?php

namespace App\Services;

use App\Models\PushToken;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExpoPushService
{
    /**
     * Send push notifications to specific users.
     *
     * @param array $userIds  Array of user IDs to notify
     * @param string $title   Notification title
     * @param string $body    Notification body text
     * @param array $data     Optional data payload for in-app handling
     */
    public static function sendToUsers(array $userIds, string $title, string $body, array $data = []): void
    {
        $tokens = PushToken::whereIn('user_id', $userIds)->pluck('token')->toArray();

        if (empty($tokens)) {
            return;
        }

        self::sendToTokens($tokens, $title, $body, $data);
    }

    /**
     * Send push notifications to all members of an organization.
     *
     * @param int $orgId       Organization ID
     * @param string $title    Notification title
     * @param string $body     Notification body text
     * @param array $data      Optional data payload
     * @param array $excludeUserIds  User IDs to exclude (e.g. the sender)
     */
    public static function sendToOrganization(int $orgId, string $title, string $body, array $data = [], array $excludeUserIds = []): void
    {
        $userIds = \App\Models\Designation::where('organization_id', $orgId)
            ->where('status', 'active')
            ->pluck('user_id')
            ->toArray();

        if (!empty($excludeUserIds)) {
            $userIds = array_diff($userIds, $excludeUserIds);
        }

        if (empty($userIds)) {
            return;
        }

        self::sendToUsers($userIds, $title, $body, $data);
    }

    /**
     * Send push notifications to an array of Expo push tokens.
     * Expo accepts up to 100 messages per request.
     */
    private static function sendToTokens(array $tokens, string $title, string $body, array $data = []): void
    {
        $messages = [];

        foreach ($tokens as $token) {
            // Validate that it's an Expo push token
            if (!str_starts_with($token, 'ExponentPushToken[') && !str_starts_with($token, 'ExpoPushToken[')) {
                continue;
            }

            $messages[] = [
                'to'    => $token,
                'sound' => 'default',
                'title' => $title,
                'body'  => $body,
                'data'  => $data,
            ];
        }

        if (empty($messages)) {
            return;
        }

        // Expo allows batches of 100
        $chunks = array_chunk($messages, 100);

        foreach ($chunks as $chunk) {
            try {
                $response = Http::withHeaders([
                    'Accept'       => 'application/json',
                    'Content-Type' => 'application/json',
                ])->post('https://exp.host/--/api/v2/push/send', $chunk);

                if ($response->failed()) {
                    Log::error('[ExpoPush] Failed to send notifications', [
                        'status' => $response->status(),
                        'body'   => $response->body(),
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('[ExpoPush] Exception sending notifications: ' . $e->getMessage());
            }
        }
    }
}
