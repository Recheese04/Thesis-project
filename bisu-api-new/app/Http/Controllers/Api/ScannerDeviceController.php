<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScannerDevice;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ScannerDeviceController extends Controller
{
    /**
     * Get all registered scanner devices (with online/offline status).
     * Officers see scanners for their organization plus unassigned scanners.
     */
    public function index(Request $request)
    {
        try {
            $user = auth()->user();
            $orgId = $user->getOfficerOrganizationId();

            $query = ScannerDevice::query();

            if ($orgId) {
                $query->where(function ($q) use ($orgId) {
                    $q->where('organization_id', $orgId)
                      ->orWhereNull('organization_id');
                });
            }

            $devices = $query->orderBy('last_seen_at', 'desc')->get()->map(function ($device) {
                return [
                    'id' => $device->id,
                    'device_id' => $device->device_id,
                    'name' => $device->name,
                    'organization_id' => $device->organization_id,
                    'is_online' => $device->is_online,
                    'last_seen_at' => $device->last_seen_at ? $device->last_seen_at->toIso8601String() : null,
                    'last_seen_human' => $device->last_seen_at ? $device->last_seen_at->diffForHumans() : 'Never',
                ];
            });

            return response()->json([
                'devices' => $devices,
            ]);

        } catch (\Exception $e) {
            Log::error('Scanner devices list error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error fetching scanner devices',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Rename a scanner device (e.g. "NodeMCU #1" -> "Gym Gate 1").
     */
    public function rename(Request $request, $id)
    {
        try {
            $data = $request->validate([
                'name' => 'required|string|max:100',
            ]);

            $device = ScannerDevice::findOrFail($id);
            $device->name = $data['name'];

            $user = auth()->user();
            $orgId = $user->getOfficerOrganizationId();
            if ($orgId && !$device->organization_id) {
                $device->organization_id = $orgId;
            }

            $device->save();

            return response()->json([
                'message' => 'Scanner renamed successfully!',
                'device' => [
                    'id' => $device->id,
                    'device_id' => $device->device_id,
                    'name' => $device->name,
                    'is_online' => $device->is_online,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Scanner device rename error: ' . $e->getMessage());
            return response()->json([
                'message' => 'Error renaming scanner device',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
