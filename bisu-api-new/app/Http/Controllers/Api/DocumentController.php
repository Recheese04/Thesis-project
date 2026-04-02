<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Models\Designation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    /**
     * Get documents for an organization (Officer view)
     */
    public function index($orgId): JsonResponse
    {
        $user = Auth::user();
        if (!$user->isAdmin() && !$user->isOfficerOf($orgId)) {
            return response()->json(['message' => 'Unauthorized access to organization documents.'], 403);
        }

        $documents = Document::where('organization_id', $orgId)
            ->with('uploader:id,first_name,last_name')
            ->orderByDesc('created_at')
            ->get();

        return response()->json($documents);
    }

    /**
     * Upload a new document (Officer only)
     */
    public function store(Request $request, $orgId): JsonResponse
    {
        $user = Auth::user();
        if (!$user->isAdmin() && !$user->isOfficerOf($orgId)) {
            return response()->json(['message' => 'Only officers can upload documents.'], 403);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'file' => 'required|file|mimes:pdf,doc,docx,jpg,jpeg,png,webp|max:10240', // max 10MB
        ]);

        $file = $request->file('file');
        
        // Store the file securely in storage/app/documents
        $path = $file->store('documents/' . $orgId);

        $document = Document::create([
            'organization_id' => $orgId,
            'uploaded_by' => $user->id,
            'title' => $request->title,
            'category' => $request->category,
            'file_path' => $path,
            'file_size' => $file->getSize(),
            'file_type' => $file->getMimeType(),
        ]);

        $document->load('uploader:id,first_name,last_name');

        return response()->json($document, 201);
    }

    /**
     * Delete a document
     */
    public function destroy($id): JsonResponse
    {
        $document = Document::findOrFail($id);
        $user = Auth::user();

        if (!$user->isAdmin() && !$user->isOfficerOf($document->organization_id)) {
            return response()->json(['message' => 'Unauthorized to delete this document.'], 403);
        }

        // Delete from storage
        if (Storage::exists($document->file_path)) {
            Storage::delete($document->file_path);
        }

        $document->delete();

        return response()->json(['message' => 'Document deleted successfully']);
    }

    /**
     * Download a document securely (both Officers and Students)
     */
    public function download($id): StreamedResponse|JsonResponse
    {
        $document = Document::findOrFail($id);
        $user = Auth::user();

        // Check if user has access to the organization
        $isMemberOrOfficer = Designation::where('user_id', $user->id)
            ->where('organization_id', $document->organization_id)
            ->where('status', 'active')
            ->exists();

        if (!$user->isAdmin() && !$isMemberOrOfficer) {
            return response()->json(['message' => 'Unauthorized to download this document.'], 403);
        }

        if (!Storage::exists($document->file_path)) {
            return response()->json(['message' => 'File not found on server.'], 404);
        }

        // Get original extension to construct a nice filename
        $extension = pathinfo($document->file_path, PATHINFO_EXTENSION);
        $downloadName = str($document->title)->slug() . '.' . $extension;

        return Storage::download($document->file_path, $downloadName);
    }

    /**
     * Get documents for all organizations a student is part of
     */
    public function studentIndex(): JsonResponse
    {
        $user = Auth::user();

        // Get all active organization IDs for this user
        $orgIds = Designation::where('user_id', $user->id)
            ->where('status', 'active')
            ->pluck('organization_id');

        $documents = Document::whereIn('organization_id', $orgIds)
            ->with(['organization:id,name', 'uploader:id,first_name,last_name'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json($documents);
    }
}
