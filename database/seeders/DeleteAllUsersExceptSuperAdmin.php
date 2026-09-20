<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class DeleteAllUsersExceptSuperAdmin extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "Deleting all users except Super Admin (harrismanabat0)...\n\n";

        // Get the super admin
        $superAdmin = User::where('username', 'harrismanabat0')->first();

        if (!$superAdmin) {
            echo "⚠️  WARNING: Super Admin (harrismanabat0) not found!\n";
            echo "No users will be deleted.\n";
            return;
        }

        echo "Found Super Admin: {$superAdmin->username} (ID: {$superAdmin->id})\n\n";

        // Delete all users except the super admin
        $deletedCount = User::where('id', '!=', $superAdmin->id)->delete();

        echo "✓ Successfully deleted {$deletedCount} user(s)\n";
        echo "✓ Super Admin (harrismanabat0) preserved\n\n";
        echo "🎉 CLEANUP COMPLETE!\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        echo "Remaining account:\n";
        echo "1. Super Admin: harrismanabat0 (harrism@gmail.com)\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    }
}
