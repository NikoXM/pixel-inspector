use crate::error::AppError;
use crate::image::buffer::RawImageBuffer;
use std::fs::File;
use std::io::BufReader;

/// Decode OpenEXR files using the `exr` crate.
pub fn decode(path: &str) -> Result<RawImageBuffer, AppError> {
    use exr::prelude::*;

    let image = read_first_rgba_layer_from_file(
        path,
        |resolution, _| {
            let size = resolution.width() * resolution.height() * 4;
            vec![0.0f32; size]
        },
        |buffer, pos, (r, g, b, a): (f32, f32, f32, f32)| {
            let idx = (pos.y() * pos.width() + pos.x()) * 4;
            buffer[idx] = r;
            buffer[idx + 1] = g;
            buffer[idx + 2] = b;
            buffer[idx + 3] = a;
        },
    )
    .map_err(|e| AppError::ImageDecode(format!("EXR decode error: {e}")))?;

    let layer = &image.layer_data;
    let width = layer.size.width() as u32;
    let height = layer.size.height() as u32;
    let data = layer.channel_data.pixels.clone();

    Ok(RawImageBuffer::new(width, height, data, true))
}
