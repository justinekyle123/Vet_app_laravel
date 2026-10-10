<?php

namespace App\Models\Concerns;

/**
 * The picture a record shows on the public site, shared by the two kinds of row
 * that have one: services and staff.
 *
 * `image_path` holds either a path on the public disk
 * ("services/wellness-exam.jpg") or a full URL when the image is hosted
 * somewhere else. Keeping both shapes in one column means seeded demo rows can
 * point at the design's CDN while uploads still land in the app's own storage.
 */
trait HasImage
{
    /**
     * The URL to render for this record, or null when it has no picture yet —
     * in which case the page falls back to its own artwork.
     */
    public function imageUrl(): ?string
    {
        $path = $this->image_path;

        if (blank($path)) {
            return null;
        }

        return str_starts_with($path, 'http')
            ? $path
            : '/storage/'.ltrim($path, '/');
    }
}
