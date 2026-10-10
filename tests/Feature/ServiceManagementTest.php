<?php

use App\Models\Service;
use App\Models\ServiceCategory;
use App\Models\Staff;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('an admin can view the service menu', function () {
    Service::factory()->count(2)->create();
    Service::factory()->inactive()->create();

    $this->actingAs(Staff::factory()->admin()->create())
        ->get(route('admin.services.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/Services')
            ->has('services.data', 3)
            ->where('services.total', 3)
            ->has('categories')
        );
});

test('the service menu can be filtered by offered and retired', function () {
    Service::factory()->count(2)->create();
    $retired = Service::factory()->inactive()->create();
    $admin = Staff::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.services.index', ['filter' => 'active']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('services.data', 2)
            ->where('filter', 'active')
        );

    $this->actingAs($admin)
        ->get(route('admin.services.index', ['filter' => 'retired']))
        ->assertInertia(fn (Assert $page) => $page
            ->has('services.data', 1)
            ->where('services.data.0.id', $retired->service_id)
            ->where('filter', 'retired')
        );
});

test('an admin can open separate service create and edit pages', function () {
    $service = Service::factory()->create();
    $admin = Staff::factory()->admin()->create();

    $this->actingAs($admin)
        ->get(route('admin.services.create'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/ServiceCreate')
            ->has('categories'));

    $this->actingAs($admin)
        ->get(route('admin.services.edit', $service))
        ->assertInertia(fn (Assert $page) => $page
            ->component('Admin/ServiceEdit')
            ->where('service.id', $service->service_id)
            ->has('categories'));
});

test('an admin can add a service', function () {
    $category = ServiceCategory::factory()->create();
    Storage::fake('public');

    $this->actingAs(Staff::factory()->admin()->create())
        ->post(route('admin.services.store'), [
            'service_name' => 'Wellness consultation',
            'category_id' => $category->category_id,
            'description' => 'A routine nose-to-tail check-up.',
            'image' => UploadedFile::fake()->create('wellness.jpg', 100, 'image/jpeg'),
            'duration_minutes' => 45,
            'price' => '65.00',
            'is_active' => true,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('admin.services.index'));

    $service = Service::where('service_name', 'Wellness consultation')->firstOrFail();

    expect($service->duration_minutes)->toBe(45)
        ->and((float) $service->price)->toBe(65.0)
        ->and($service->category_id)->toBe($category->category_id)
        ->and($service->is_active)->toBeTrue();

    expect($service->image_path)->not->toBeEmpty();
    Storage::disk('public')->assertExists($service->image_path);
});

test('a service needs a name, a category, a duration, and a price', function () {
    $this->actingAs(Staff::factory()->admin()->create())
        ->from(route('admin.services.index'))
        ->post(route('admin.services.store'), [])
        ->assertSessionHasErrors([
            'service_name',
            'category_id',
            'duration_minutes',
            'price',
        ]);
});

test('a service name must be unique', function () {
    Service::factory()->create(['service_name' => 'Vaccination']);

    $this->actingAs(Staff::factory()->admin()->create())
        ->from(route('admin.services.index'))
        ->post(route('admin.services.store'), [
            'service_name' => 'Vaccination',
            'category_id' => ServiceCategory::factory()->create()->category_id,
            'duration_minutes' => 15,
            'price' => '40',
        ])
        ->assertSessionHasErrors('service_name');
});

test('an admin can update a service', function () {
    $service = Service::factory()->create(['service_name' => 'Old name']);
    Storage::fake('public');

    $this->actingAs(Staff::factory()->admin()->create())
        ->patch(route('admin.services.update', $service), [
            'service_name' => 'New name',
            'category_id' => $service->category_id,
            'image' => UploadedFile::fake()->create('updated.jpg', 100, 'image/jpeg'),
            'duration_minutes' => 45,
            'price' => '80',
            'is_active' => true,
        ])
        ->assertSessionHasNoErrors();

    $updated = $service->fresh();

    expect($updated->service_name)->toBe('New name')
        ->and($updated->image_path)->not->toBeEmpty();

    Storage::disk('public')->assertExists($updated->image_path);
});

test('an admin can retire and restore a service', function () {
    $service = Service::factory()->create(['is_active' => true]);
    $admin = Staff::factory()->admin()->create();

    $this->actingAs($admin)
        ->patch(route('admin.services.toggle', $service))
        ->assertSessionHasNoErrors();

    expect($service->fresh()->is_active)->toBeFalse();

    $this->actingAs($admin)
        ->patch(route('admin.services.toggle', $service))
        ->assertSessionHasNoErrors();

    expect($service->fresh()->is_active)->toBeTrue();
});

test('veterinarian profiles cannot manage services', function () {
    $this->actingAs(Staff::factory()->veterinarian()->create())
        ->get(route('admin.services.index'))
        ->assertForbidden();

    $this->actingAs(Staff::factory()->veterinarian()->create())
        ->post(route('admin.services.store'), [
            'service_name' => 'Sneaky service',
            'category_id' => ServiceCategory::factory()->create()->category_id,
            'duration_minutes' => 30,
            'price' => '10',
        ])
        ->assertForbidden();
});
