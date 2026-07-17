/*
 * Copyright 2026 The Vanilla Conquer Contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

#include "classic_surface.h"

#include "cnc_web_protocol.h"
#include "protocol.h"

#include <limits.h>

namespace cnc {
namespace web {

ClassicSurfaceRect::ClassicSurfaceRect()
    : x(0u)
    , y(0u)
    , width(0u)
    , height(0u)
{
}

ClassicSurfaceEncoding::ClassicSurfaceEncoding()
    : pixel_count(0u)
    , canonical_payload_size(0u)
    , canonical_payload_hash(0u)
    , delta(false)
{
}

namespace {

bool SurfaceSize(uint32_t width, uint32_t height, uint32_t& pixel_count)
{
    if (width == 0u || height == 0u || height > UINT32_MAX / width) {
        return false;
    }
    pixel_count = width * height;
    return pixel_count <= UINT32_MAX - CNC_WEB_CLASSIC_SURFACE_FIXED_SIZE_V1;
}

struct DeltaSurfaceAnalysis
{
    explicit DeltaSurfaceAnalysis(uint64_t hash_seed)
        : canonical_hash(hash_seed)
    {
    }

    ClassicSurfaceRect dirty;
    uint64_t canonical_hash;
};

DeltaSurfaceAnalysis AnalyzeDeltaSurface(const uint8_t* current,
                                         const uint8_t* previous,
                                         uint32_t width,
                                         uint32_t height,
                                         uint64_t hash_seed)
{
    DeltaSurfaceAnalysis analysis(hash_seed);
    uint32_t minimum_x = width;
    uint32_t minimum_y = height;
    uint32_t maximum_x = 0u;
    uint32_t maximum_y = 0u;
    bool changed = false;

    for (uint32_t y = 0u; y < height; ++y) {
        const uint8_t* current_row = current + y * width;
        const uint8_t* previous_row = previous + y * width;
        for (uint32_t x = 0u; x < width; ++x) {
            const uint8_t value = current_row[x];
            /* Keep this byte operation identical to HashBytes while folding the
             * delta comparison into the hash traversal. */
            analysis.canonical_hash ^= static_cast<uint64_t>(value);
            analysis.canonical_hash *= UINT64_C(1099511628211);
            if (value == previous_row[x]) {
                continue;
            }

            if (!changed || x < minimum_x) {
                minimum_x = x;
            }
            if (!changed || x + 1u > maximum_x) {
                maximum_x = x + 1u;
            }
            if (!changed) {
                minimum_y = y;
            }
            maximum_y = y + 1u;
            changed = true;
        }
    }

    if (changed) {
        analysis.dirty.x = minimum_x;
        analysis.dirty.y = minimum_y;
        analysis.dirty.width = maximum_x - minimum_x;
        analysis.dirty.height = maximum_y - minimum_y;
    }
    return analysis;
}

bool WriteFullHeader(Writer& writer, uint32_t width, uint32_t height)
{
    return writer.U32(width) && writer.U32(height) && writer.U32(width)
        && writer.U32(CNC_WEB_CLASSIC_SURFACE_FORMAT_FULL);
}

} // namespace

bool EncodeClassicSurface(const uint8_t* current,
                          uint32_t width,
                          uint32_t height,
                          const uint8_t* previous,
                          uint32_t previous_width,
                          uint32_t previous_height,
                          bool has_baseline,
                          ClassicSurfaceEncoding& encoding)
{
    uint32_t pixel_count = 0u;
    if (current == NULL || !SurfaceSize(width, height, pixel_count)) {
        return false;
    }

    Writer canonical_header;
    if (!WriteFullHeader(canonical_header, width, height)) {
        return false;
    }
    const uint64_t header_hash = HashBytes(&canonical_header.Data()[0], canonical_header.Size());

    const bool delta = has_baseline && previous != NULL && previous_width == width && previous_height == height;
    ClassicSurfaceRect dirty;
    uint64_t canonical_hash = 0u;
    if (delta) {
        const DeltaSurfaceAnalysis analysis = AnalyzeDeltaSurface(current, previous, width, height, header_hash);
        dirty = analysis.dirty;
        canonical_hash = analysis.canonical_hash;
    } else {
        canonical_hash = HashBytes(current, pixel_count, header_hash);
    }
    if (delta && dirty.width != 0u && dirty.height > UINT32_MAX / dirty.width) {
        return false;
    }
    const uint32_t dirty_pixels = delta ? dirty.width * dirty.height : 0u;
    if (delta && dirty_pixels > UINT32_MAX - CNC_WEB_CLASSIC_SURFACE_DELTA_FIXED_SIZE_V1) {
        return false;
    }
    const uint32_t payload_size = delta ? CNC_WEB_CLASSIC_SURFACE_DELTA_FIXED_SIZE_V1 + dirty_pixels
                                        : CNC_WEB_CLASSIC_SURFACE_FIXED_SIZE_V1 + pixel_count;

    Writer payload;
    if (!payload.Reserve(payload_size)) {
        return false;
    }

    if (!delta) {
        if (!WriteFullHeader(payload, width, height) || !payload.Bytes(current, pixel_count)) {
            return false;
        }
    } else {
        if (!payload.U32(width) || !payload.U32(height) || !payload.U32(dirty.width)
            || !payload.U32(CNC_WEB_CLASSIC_SURFACE_FORMAT_DELTA) || !payload.U32(dirty.x)
            || !payload.U32(dirty.y) || !payload.U32(dirty.width) || !payload.U32(dirty.height)) {
            return false;
        }
        for (uint32_t row = 0u; row < dirty.height; ++row) {
            const uint8_t* source = current + (dirty.y + row) * width + dirty.x;
            if (!payload.Bytes(source, dirty.width)) {
                return false;
            }
        }
    }
    if (payload.Size() != payload_size) {
        return false;
    }

    encoding.payload.swap(payload.Data());
    encoding.dirty = dirty;
    encoding.pixel_count = pixel_count;
    encoding.canonical_payload_size = CNC_WEB_CLASSIC_SURFACE_FIXED_SIZE_V1 + pixel_count;
    encoding.canonical_payload_hash = canonical_hash;
    encoding.delta = delta;
    return true;
}

} // namespace web
} // namespace cnc
