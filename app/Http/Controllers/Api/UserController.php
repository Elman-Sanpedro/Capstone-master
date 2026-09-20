<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UserController extends Controller
{
    /**
     * Check if username is available
     */
    public function checkUsernameAvailability(Request $request): JsonResponse
    {
        $username = $request->get('username');
        
        if (!$username || strlen($username) < 3) {
            return response()->json([
                'available' => false,
                'message' => 'Username must be at least 3 characters long'
            ]);
        }

        $exists = User::where('username', $username)->exists();
        
        return response()->json([
            'available' => !$exists,
            'message' => $exists ? 'Username is already taken' : 'Username is available'
        ]);
    }
}
