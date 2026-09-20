<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Supplier;

class SupplierSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "Creating supplier accounts...\n\n";

        $suppliers = [
            [
                'supplier_code' => 'SUP001',
                'supplier_name' => 'San Miguel Corporation',
                'contact_person' => 'Juan Santos',
                'phone' => '0917-888-1234',
                'email' => 'sales@sanmiguelbrewery.com.ph',
                'address' => 'San Miguel Avenue, Mandaluyong City',
                'city' => 'Mandaluyong',
                'province' => 'Metro Manila',
                'postal_code' => '1550',
                'payment_terms' => 'Net 30',
                'delivery_lead_time' => '3-5 days',
                'notes' => 'Primary supplier for San Miguel beer products',
                'is_active' => 1,
            ],
            [
                'supplier_code' => 'SUP002',
                'supplier_name' => 'Manila Water Company',
                'contact_person' => 'Maria Reyes',
                'phone' => '0918-777-5678',
                'email' => 'business@manilawater.com',
                'address' => 'Quezon City, Philippines',
                'city' => 'Quezon City',
                'province' => 'Metro Manila',
                'postal_code' => '1100',
                'payment_terms' => 'Net 15',
                'delivery_lead_time' => '1-2 days',
                'notes' => 'Water purification and ice production supplies',
                'is_active' => 1,
            ],
            [
                'supplier_code' => 'SUP003',
                'supplier_name' => 'ABC Packaging Supplies',
                'contact_person' => 'Roberto Cruz',
                'phone' => '0919-666-9012',
                'email' => 'orders@abcpackaging.com',
                'address' => 'Pasig City, Philippines',
                'city' => 'Pasig',
                'province' => 'Metro Manila',
                'postal_code' => '1600',
                'payment_terms' => 'COD',
                'delivery_lead_time' => '2-3 days',
                'notes' => 'Packaging materials and bottles',
                'is_active' => 1,
            ],
            [
                'supplier_code' => 'SUP004',
                'supplier_name' => 'Ice Makers Philippines',
                'contact_person' => 'Elena Martinez',
                'phone' => '0920-555-3456',
                'email' => 'info@icemakersph.com',
                'address' => 'Caloocan City, Philippines',
                'city' => 'Caloocan',
                'province' => 'Metro Manila',
                'postal_code' => '1400',
                'payment_terms' => 'Net 30',
                'delivery_lead_time' => '5-7 days',
                'notes' => 'Ice making equipment and spare parts',
                'is_active' => 1,
            ],
        ];

        foreach ($suppliers as $supplierData) {
            $supplier = Supplier::updateOrCreate(
                ['supplier_code' => $supplierData['supplier_code']],
                $supplierData
            );

            echo "✓ Supplier created/updated: {$supplier->supplier_name}\n";
            echo "  - Code: {$supplier->supplier_code}\n";
            echo "  - Contact: {$supplier->contact_person}\n";
            echo "  - Phone: {$supplier->phone}\n\n";
        }

        echo "🎉 SUPPLIERS SUCCESSFULLY CREATED!\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
        echo "Suppliers added:\n";
        echo "1. San Miguel Corporation (SUP001)\n";
        echo "2. Manila Water Company (SUP002)\n";
        echo "3. ABC Packaging Supplies (SUP003)\n";
        echo "4. Ice Makers Philippines (SUP004)\n";
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    }
}
