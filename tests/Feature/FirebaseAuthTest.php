<?php

use App\Models\Owner;
use App\Models\User;
use App\Services\Firebase\GooglePublicKeys;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;

/** The `kid` echoed into test tokens and used to index the key set. */
const FIREBASE_TEST_KID = 'test-key-id';

/*
|--------------------------------------------------------------------------
| Throwaway keys
|--------------------------------------------------------------------------
|
| Baked in rather than generated per run. `openssl_pkey_new()` requires an
| openssl.cnf, which the Windows PHP build used here does not ship, so
| generating at runtime failed for reasons that had nothing to do with the
| code under test. These keys sign nothing real and exist only in this file.
|
*/

/** The private half of the key the application is told to trust. */
function firebaseTestPrivateKey(): string
{
    return <<<'PEM'
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC5nyw4UI+I2OU5
23nlw0LlLIWTd7yrA7gH9RuZ4S/AajC3v3IuGP8tdq9jPhqz8KtqDjo3oJ59UvkC
xwD8Ws/azhxh3mDhpIUfmVj/JK9ihykBG8z4NaKEIP94LFPUxw1R0yz67XfC6hnJ
FtmASp7CupuvzW3ao/zAPv4ivAQlmgmqs7HjpYYXD9UC2JIrM3bTTr+f9yz7G6D3
ynzbKnvV+XIekcErnoOt2egluPN1KHghdyLTa7bhspGMA/5T7/0ZNj1YA8YI44fo
LHReTsdJCawW9JL+O4OXiJ1WiPqbJX5aSnERJQOkzjIrTnBZ9XgcxJ+eXZHMkE74
r+OAeI45AgMBAAECggEABMHxaHUaJLQIdgnrzymIzKZuOwgh4BE9lYig/znwFyKx
ongH9WoDGld1KdpE5XFI93QrZlMZ1NT8WGeg3Rb3xmArho+kVIw6tENiLlHyo9ga
gzKC96aqRnAxFBOwx16dtwfuWnUdMXP+GrMY+oqPFKcjR+eARg8Xcpb6vQmsIomL
qU6U+dTQZw94GJhbzJ404mtGoXECeoORYN0GfKagRUfWn3EujEkCEpWGjI7vCD/z
aoW2TQJBrcM05B3iL2XdeE2fAHqeo3srqXSIadVkXKWCn24JwSZzpy8VBePB/JxX
3zH1SU28qvIpkTIZv4CZ5vNKLFVIPemU/gicFoDUbQKBgQD5CUpiGJkgICjm+lYU
wXhf1sUPFRZmmhQWZRwvEe13HFP12GGFfrEAbpimTBvuzofZZnnJJYPYFhMopJHP
nkEdCoq8uRJeXaM6F4LlYFPHnA9/umFA2+bxIYH97ZleynFAblvG9ca+yjxmb3ul
ftx5gxqYfP0a1po3VlNFCUhbTQKBgQC+z+8AtXorYmd/HJiHPyITgAmpujdQc/8j
LXYguVVDOZKaJADpzTqTC3+48NHGLO+KMrikqpUMZjcuLe3P3yrWbiMN/4KgsM4O
Plz+6jKYpRweRf7GgPELX2VsoC13GyQb2oIKpx5qi7n9g92fI2+miowGC3nAlIap
ZANeP5LQnQKBgQCAZlfhqAkbVTmBjcTgQrhLwbIsipTYJc0BlvQnGLk01ng7o2r0
p1Ofg2ZVJ5ynTfkhEALuwNbvjMIoDGHZiCDOVmcd0tYzrVfBVen5VeccXcxn8LK/
/CFgZgRd5ilThFFMBRpwxLvKFv95WTWJKJWIWR5XTOo68jblHS8lwxl5aQKBgHml
bJSCHdnMyXiTDXajvCC8buyiyCLlYJHXqMih/wZ1jM3yCBcF/MLEAPAxrzrtaOUt
AuQP0CfwfltVcpgkiVXdL0H8VBYHwcX44iatvgXstSljrFJ237VFYw7Ga1XUmseb
HW6XLl/0pmVGDSMoX0TIbQ5pgHxS9CrHlRIf64RNAoGAFFdtdg2W4dWtxHvhKXe0
1f4UMByEx7S21ijjm1a8NBmXAfaeqxqq9FGR/hmYUKe8FDsm7/7xsYN2bOQ6rDcM
fnX9s8orjeYnrwiNiYxZJg1R3pWyqJXZfaGMbpUzNbICBqUOcEfJoZA1QBvXwpks
wc0BmJP+Np4Dhgg8DcFnUA8=
-----END PRIVATE KEY-----
PEM;
}

/** The public half of the key above, as Google would publish it. */
function firebaseTestPublicKey(): string
{
    return <<<'PEM'
-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuZ8sOFCPiNjlOdt55cNC
5SyFk3e8qwO4B/UbmeEvwGowt79yLhj/LXavYz4as/Crag46N6CefVL5AscA/FrP
2s4cYd5g4aSFH5lY/ySvYocpARvM+DWihCD/eCxT1McNUdMs+u13wuoZyRbZgEqe
wrqbr81t2qP8wD7+IrwEJZoJqrOx46WGFw/VAtiSKzN2006/n/cs+xug98p82yp7
1flyHpHBK56DrdnoJbjzdSh4IXci02u24bKRjAP+U+/9GTY9WAPGCOOH6Cx0Xk7H
SQmsFvSS/juDl4idVoj6myV+WkpxESUDpM4yK05wWfV4HMSfnl2RzJBO+K/jgHiO
OQIDAQAB
-----END PUBLIC KEY-----
PEM;
}

/** A different keypair entirely, to prove a token signed elsewhere is refused. */
function firebaseImpostorPrivateKey(): string
{
    return <<<'PEM'
-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDGmfdZzLSm4soZ
SlaPj0f3FYsfktbWGbJovVTYl4mhjnsL3a78ILcj4xzkMJxLNvKeAPWloiA7PzMe
CcjioumXwWawjKQP2DWLMeTcxJqn4298Mc5MvZXTOQDoBqO0vpYPlqZdsuyCuFqM
GMaXibHMMeKnfe2nMnz3rECovRyxaSU+VO97ljQGeGFJAJ/2SVWbxjSPvKhRxlfX
vz2xm8Eq5Z0rU5agbvWfhcNxDcipw2rAKmAMOGbgJl14j/e5SSn6DzeChYiWH6D8
HX356ZCrOv+xjDbzmRStI+Kc3hlWlex34MR6366Zxfy/HonsRUT5eHsX5Br3yCRX
00GCmKzfAgMBAAECggEAWZGU6c4V53I+/Xr2YRaYuUnhDeNWuwap3O0OuARYESHG
Qsq/IXzLvAawwAVgZ9enQjVilEnzSWUuc6ysCfK5cTTLUHKNh4vWUim1cw/ERFWh
sRxxU1DponKCAyMDb//Ig81IyNdqLWZhh++gmTWDl3kkJK/5n794ducb3j40E5px
y36fIHtzvjoE/pXdyLuooT7EmBzpzERcHMxmLQ9x7YPh9HD1ny6xqFQ3ztBRhC7W
/i5pDvZFgPmoX7RErvqULys2hOnv+a4DgOBQQcjPfQVXX7wSBUUOABCQPJtD6v7g
DH2wGPIaEMGmyg4LupXBSeuaQm6MKGyaj7TjrXZWaQKBgQDiHNd966poElbiAr2n
acndBvsEYY7xLzT11eCOhkc2E59TaF7SAseKTCUtFzxunbHAHaGrMDh5jLi91ZYN
u/DPOTDxAB2ZULJrYGKN/edN8sRCr8aAro3zlnJCsNc7COq8bkIY5bb1VK8Axk14
VLJpZ9Noa094bmSACkM3P58oRQKBgQDg2jRYmYEJUjy3rghz0aU2qVN3JJPZcMt2
Nmv5onFZxjLL2bW9XXrtidcWzieCxJW0mpIi8L2Rv6Gu5zrV0vsUjmnEaqcnaG91
sZe+5n5mUdaflYU4+2ewgkmVWFtunVPs5H3LuA/miOI5Vtybe2lsZ6OHmbfWc8yA
4m/IRv5M0wKBgGnprJ7VBssc3Amd0wxaJy4bGPViZTxgKmSEvFzGVRDlfBnrp46j
sqf7JubKHYqK3znoJ1QykCGPYvG43EKuqAvI9D3PGg44mHpneYKdTf1bG8dI4qhg
GyngbMEEaKzEbn+4/cj/wQWFlzu7p4oX0kJBWettaJo2y2iWZgm5CWopAoGBAMUn
ju6A6lu59/M2bcLf9/VN0xmMwPbPqBcm8NYaUTleR/vmESzRYpAVZLtiV9KZfIq3
XZu1awL4/FPX/Aawz+beWG8Y9SfgspqH9X41rG8bIw0alY25Itnp44tHxiPfX08/
qe2OnqKNM48DUrwiIfYjiYfEiSVIs+/unAUH+sJxAoGAd9mzo1mlZmYNdjA/QR7q
67mZRx+LVHSPhZEbfARxBn6o/HgkLHuA3IunwLC+qNWvwU1GCUP3zfw+8FAMNFIO
74OAqGIIR4DiZCHUYKYOVMcEtpDOulsgvPilz8cpXDPmjdfLrIohAP19U5OBFfiT
5aErHTrk2MVR2VcRytpfFbE=
-----END PRIVATE KEY-----
PEM;
}

/**
 * Build a signed Firebase ID token for the configured test project.
 *
 * @param  array<string, mixed>  $overrides
 */
function firebaseToken(array $overrides = [], ?string $privateKey = null): string
{
    $projectId = config('firebase.project_id');

    return JWT::encode(
        array_merge([
            'iss' => "https://securetoken.google.com/{$projectId}",
            'aud' => $projectId,
            'sub' => 'firebase-uid-001',
            'iat' => now()->timestamp,
            'exp' => now()->addHour()->timestamp,
            'auth_time' => now()->timestamp,
            'email' => 'ada@example.com',
            'email_verified' => true,
            'name' => 'Ada Lovelace',
            'firebase' => ['sign_in_provider' => 'google.com'],
        ], $overrides),
        $privateKey ?? firebaseTestPrivateKey(),
        'RS256',
        FIREBASE_TEST_KID,
    );
}

beforeEach(function () {
    config([
        'firebase.enabled' => true,
        'firebase.project_id' => 'test-project',
        'firebase.redirect_to' => '/dashboard',
        'firebase.clock_skew_seconds' => 5,
    ]);

    // Stand in for Google's certificates. Without this the resolver would make
    // a real HTTP call, which preventStrayRequests below would fail on.
    app()->instance(GooglePublicKeys::class, new class extends GooglePublicKeys
    {
        /** @return array<string, Key> */
        public function all(): array
        {
            return [
                FIREBASE_TEST_KID => new Key(
                    firebaseTestPublicKey(),
                    'RS256',
                    FIREBASE_TEST_KID,
                ),
            ];
        }
    });

    Http::preventStrayRequests();
});

test('a google sign-in creates a local account and starts a session', function () {
    $this->postJson(route('firebase.session'), ['id_token' => firebaseToken()])
        ->assertOk()
        ->assertJsonPath('redirect', '/dashboard');

    $user = User::where('firebase_uid', 'firebase-uid-001')->firstOrFail();

    expect($user->email)->toBe('ada@example.com')
        ->and($user->name)->toBe('Ada Lovelace')
        ->and($user->role->value)->toBe('owner')
        ->and($user->email_verified_at)->not->toBeNull()
        ->and($user->password)->toBeNull();

    // Owners need a client record for the portal to have anything to show.
    expect(Owner::where('user_id', $user->id)->exists())->toBeTrue();

    $this->assertAuthenticatedAs($user);
});

test('an existing password account is adopted instead of duplicated', function () {
    $existing = User::factory()->frontDesk()->create([
        'email' => 'ada@example.com',
        'name' => 'Ada L',
    ]);

    $this->postJson(route('firebase.session'), ['id_token' => firebaseToken()])
        ->assertOk();

    // No second row, the staff role survives, and the link is recorded.
    expect(User::count())->toBe(1);

    $existing->refresh();

    expect($existing->firebase_uid)->toBe('firebase-uid-001')
        ->and($existing->role->value)->toBe('front_desk')
        ->and($existing->name)->toBe('Ada Lovelace');

    $this->assertAuthenticatedAs($existing);
});

test('a returning google user reuses their account', function () {
    $this->postJson(route('firebase.session'), ['id_token' => firebaseToken()])
        ->assertOk();

    $first = User::where('firebase_uid', 'firebase-uid-001')->firstOrFail();

    $this->postJson(route('firebase.session'), [
        'id_token' => firebaseToken(['name' => 'Ada L. Lovelace']),
    ])->assertOk();

    expect(User::count())->toBe(1);

    expect($first->refresh()->name)->toBe('Ada L. Lovelace');
});

test('an unverified email is not marked as verified', function () {
    $this->postJson(route('firebase.session'), [
        'id_token' => firebaseToken([
            'sub' => 'firebase-uid-unverified',
            'email' => 'unverified@example.com',
            'email_verified' => false,
        ]),
    ])->assertOk();

    $user = User::where('firebase_uid', 'firebase-uid-unverified')->firstOrFail();

    expect($user->email_verified_at)->toBeNull();
});

test('a token minted for another project is rejected', function () {
    $this->postJson(route('firebase.session'), [
        'id_token' => firebaseToken(['aud' => 'somebody-elses-project']),
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('id_token');

    $this->assertGuest();
    expect(User::count())->toBe(0);
});

test('a token with an unexpected issuer is rejected', function () {
    $this->postJson(route('firebase.session'), [
        'id_token' => firebaseToken(['iss' => 'https://securetoken.google.com/other']),
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('id_token');

    $this->assertGuest();
});

test('an expired token is rejected', function () {
    $this->postJson(route('firebase.session'), [
        'id_token' => firebaseToken([
            'iat' => now()->subHours(2)->timestamp,
            'exp' => now()->subHour()->timestamp,
        ]),
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('id_token');

    $this->assertGuest();
});

test('a token signed by a different key is rejected', function () {
    $this->postJson(route('firebase.session'), [
        'id_token' => firebaseToken([], firebaseImpostorPrivateKey()),
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('id_token');

    $this->assertGuest();
    expect(User::count())->toBe(0);
});

test('a tampered token is rejected', function () {
    $parts = explode('.', firebaseToken());

    // Same shape, mangled signature: the classic "changed the payload" attack.
    $parts[2] = strrev($parts[2]);

    $this->postJson(route('firebase.session'), [
        'id_token' => implode('.', $parts),
    ])
        ->assertStatus(422)
        ->assertJsonValidationErrors('id_token');

    $this->assertGuest();
});

test('a malformed token is rejected', function () {
    $this->postJson(route('firebase.session'), ['id_token' => 'not-a-real-jwt'])
        ->assertStatus(422)
        ->assertJsonValidationErrors('id_token');

    $this->assertGuest();
});

test('an id token is required', function () {
    $this->postJson(route('firebase.session'), [])
        ->assertStatus(422)
        ->assertJsonValidationErrors('id_token');
});

test('the bridge is unavailable when firebase is disabled', function () {
    config(['firebase.enabled' => false]);

    $this->postJson(route('firebase.session'), ['id_token' => firebaseToken()])
        ->assertNotFound();

    $this->assertGuest();
});

test('the shared props report whether google sign-in is available', function () {
    $this->actingAs(User::factory()->owner()->create())
        ->get(route('owner.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('firebase.enabled', true)
            ->where('firebase.configured', true)
        );
});

test('the shared props hide google sign-in when the project id is missing', function () {
    config(['firebase.project_id' => null]);

    $this->actingAs(User::factory()->owner()->create())
        ->get(route('owner.dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('firebase.configured', false)
        );
});
