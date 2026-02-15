<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;

class OrganizationController extends Controller
{
    // ── GET /api/organizations ────────────────────────────────────────────
    public function index()
    {
        try {
            $organizations = Organization::with('department')
                ->withCount(['members', 'events'])
                ->orderBy('name', 'asc')
                ->get();

            return response()->json($organizations);
        } catch (\Exception $e) {
            Log::error('Organization index error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Error fetching organizations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ── GET /api/organizations/{id} ───────────────────────────────────────
    public function show($id)
    {
        try {
            $organization = Organization::with('department')
                ->withCount(['members', 'events'])
                ->findOrFail($id);

            return response()->json($organization);
        } catch (\Exception $e) {
            Log::error('Organization show error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Organization not found',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    // ── POST /api/organizations ───────────────────────────────────────────
    public function store(Request $request)
    {
        try {
            // Base validation rules
            $rules = [
                'name' => 'required|string|max:255',
                'type' => 'required|in:academic,non-academic',
                'scope' => 'required|in:department,location,independent',
                'description' => 'nullable|string',
                'status' => 'nullable|in:active,inactive',
            ];

            // Conditional validation based on scope
            if ($request->scope === 'department') {
                $rules['department_id'] = 'required|exists:departments,id';
                $rules['location'] = 'nullable|string|max:255';
            } elseif ($request->scope === 'location') {
                $rules['location'] = 'required|string|max:255';
                $rules['department_id'] = 'nullable|exists:departments,id';
            } else { // independent
                $rules['department_id'] = 'nullable|exists:departments,id';
                $rules['location'] = 'nullable|string|max:255';
            }

            $data = $request->validate($rules);

            // Set default status if not provided
            $data['status'] = $data['status'] ?? 'active';

            // Clean up data based on scope
            if ($data['scope'] !== 'department') {
                $data['department_id'] = null;
            }
            if ($data['scope'] !== 'location') {
                $data['location'] = null;
            }

            $organization = Organization::create($data);

            // Load relationships and counts
            $organization->load('department');
            $organization->loadCount(['members', 'events']);

            return response()->json([
                'message' => 'Organization has been created successfully!',
                'organization' => $organization
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Organization store error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Error creating organization',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ── PUT /api/organizations/{id} ───────────────────────────────────────
    public function update(Request $request, $id)
    {
        try {
            $organization = Organization::findOrFail($id);

            // Base validation rules
            $rules = [
                'name' => 'required|string|max:255',
                'type' => 'required|in:academic,non-academic',
                'scope' => 'required|in:department,location,independent',
                'description' => 'nullable|string',
                'status' => 'nullable|in:active,inactive',
            ];

            // Conditional validation based on scope
            if ($request->scope === 'department') {
                $rules['department_id'] = 'required|exists:departments,id';
                $rules['location'] = 'nullable|string|max:255';
            } elseif ($request->scope === 'location') {
                $rules['location'] = 'required|string|max:255';
                $rules['department_id'] = 'nullable|exists:departments,id';
            } else { // independent
                $rules['department_id'] = 'nullable|exists:departments,id';
                $rules['location'] = 'nullable|string|max:255';
            }

            $data = $request->validate($rules);

            // Clean up data based on scope
            if ($data['scope'] !== 'department') {
                $data['department_id'] = null;
            }
            if ($data['scope'] !== 'location') {
                $data['location'] = null;
            }

            $organization->update($data);

            // Load relationships and counts
            $organization->load('department');
            $organization->loadCount(['members', 'events']);

            return response()->json([
                'message' => 'Organization has been updated successfully!',
                'organization' => $organization
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Organization update error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Error updating organization',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ── DELETE /api/organizations/{id} ────────────────────────────────────
    public function destroy($id)
    {
        try {
            $organization = Organization::withCount(['members', 'events'])->findOrFail($id);

            // Check if organization has any members or events
            if ($organization->members_count > 0 || $organization->events_count > 0) {
                return response()->json([
                    'message' => 'Cannot delete organization with existing members or events.',
                    'members_count' => $organization->members_count,
                    'events_count' => $organization->events_count,
                ], 422);
            }

            $organization->delete();

            return response()->json([
                'message' => 'Organization deleted successfully.'
            ]);
        } catch (\Exception $e) {
            Log::error('Organization delete error: ' . $e->getMessage());
            
            return response()->json([
                'message' => 'Error deleting organization',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}