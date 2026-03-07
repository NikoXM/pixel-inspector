use crate::error::AppError;
use crate::image::buffer::RawImageBuffer;

/// Decode Radiance HDR (.hdr) files using the `image` crate's HDR support.
pub fn decode(path: &str) -> Result<RawImageBuffer, AppError> {
    use image::codecs::hdr::HdrDecoder;
    use image::ImageDecoder;
    use std::fs::File;
    use std::io::BufReader;

    let file = File::open(path).map_err(|e| AppError::ImageDecode(format!("HDR open error: {e}")))?;
    let reader = BufReader::new(file);
    let decoder = HdrDecoder::new(reader)
        .map_err(|e| AppError::ImageDecode(format!("HDR decode error: {e}")))?;

    let (width, height) = decoder.dimensions();
    let pixel_count = (width as usize) * (height as usize);

    // read_image outputs Rgb32F: 3 x f32 per pixel = 12 bytes
    let mut buf = vec![0u8; pixel_count * 12];
    decoder
        .read_image(&mut buf)
        .map_err(|e| AppError::ImageDecode(format!("HDR read error: {e}")))?;

    // Convert Rgb f32 to RGBA f32
    let rgb_f32: &[f32] = bytemuck::cast_slice(&buf);
    let mut data = Vec::with_capacity(pixel_count * 4);
    for chunk in rgb_f32.chunks_exact(3) {
        data.push(chunk[0]);
        data.push(chunk[1]);
        data.push(chunk[2]);
        data.push(1.0); // HDR images have no alpha
    }

    Ok(RawImageBuffer::new(width, height, data, true))
}
