<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/profile', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's profile settings.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        // 'name' is the form field (and the User model's computed display accessor),
        // but the real, fillable column backing it is 'full_name'.
        $request->user()->fill([
            'full_name' => $validated['name'],
            'email' => $validated['email'],
        ]);

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return to_route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }

    /**
     * Backup the database and download it.
     */
    public function backup(Request $request)
    {
        try {
            // Get database connection details
            $database = config('database.connections.mysql.database');
            
            // Create backup filename with timestamp
            $filename = 'backup_' . $database . '_' . date('Y-m-d_H-i-s') . '.sql';
            
            // Set backup path to Capstone/backup folder
            $backupPath = base_path('backup');
            $fullFilePath = $backupPath . '/' . $filename;
            
            // Ensure backup directory exists
            if (!is_dir($backupPath)) {
                mkdir($backupPath, 0755, true);
            }
            
            // Create SQL backup using PHP
            $sql = '';
            
            // Get all tables
            $tables = DB::select('SHOW TABLES');
            $tableField = 'Tables_in_' . $database;
            
            foreach ($tables as $table) {
                $tableName = $table->$tableField;
                
                // Get table structure
                $createTableQuery = DB::selectOne("SHOW CREATE TABLE `$tableName`");
                $sql .= $createTableQuery->{'Create Table'} . ";\n\n";
                
                // Get table data
                $rows = DB::select("SELECT * FROM `$tableName`");
                
                if (!empty($rows)) {
                    $columns = array_keys((array)$rows[0]);
                    $columnsStr = '`' . implode('`, `', $columns) . '`';
                    $pdo = DB::connection()->getPdo();

                    foreach ($rows as $row) {
                        $values = array_map(function($value) use ($pdo) {
                            if ($value === null) {
                                return 'NULL';
                            } else {
                                return $pdo->quote($value);
                            }
                        }, (array)$row);

                        $sql .= "INSERT INTO `$tableName` ($columnsStr) VALUES (" . implode(', ', $values) . ");\n";
                    }
                    $sql .= "\n";
                }
            }
            
            // Write the SQL to file
            file_put_contents($fullFilePath, $sql);
            
            // Download the file and keep it in the backup folder
            return response()->download($fullFilePath, $filename);
            
        } catch (\Exception $e) {
            return back()->with('error', 'An error occurred while creating the backup: ' . $e->getMessage());
        }
    }
}
