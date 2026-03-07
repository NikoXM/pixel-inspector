use crate::error::AppError;
use crate::image::buffer::RawImageBuffer;
use std::fs;

/// Decode DDS files using `ddsfile` + `texture2ddecoder` for BC compression.
pub fn decode(path: &str) -> Result<RawImageBuffer, AppError> {
    let file_data =
        fs::read(path).map_err(|e| AppError::ImageDecode(format!("DDS read error: {e}")))?;

    let dds = ddsfile::Dds::read(&mut std::io::Cursor::new(&file_data))
        .map_err(|e| AppError::ImageDecode(format!("DDS parse error: {e}")))?;

    let width = dds.get_width();
    let height = dds.get_height();
    let dds_data = dds.get_data(0)
        .map_err(|e| AppError::ImageDecode(format!("DDS data error: {e}")))?;

    // Determine format and decode
    // Try DXGI format first, then fall back to D3D format handling
    if let Some(d3d) = dds.get_d3d_format() {
        if dds.get_dxgi_format().is_none() {
            return decode_d3d(d3d, dds_data, width, height);
        }
    }

    let format = dds.get_dxgi_format();

    let rgba_u8 = match format {
        Some(ddsfile::DxgiFormat::BC1_UNorm) | Some(ddsfile::DxgiFormat::BC1_UNorm_sRGB) => {
            let mut output = vec![0u32; (width * height) as usize];
            texture2ddecoder::decode_bc1(dds_data, width as usize, height as usize, &mut output)
                .map_err(|e| AppError::ImageDecode(format!("BC1 decode error: {e}")))?;
            u32_to_rgba8(&output)
        }
        Some(ddsfile::DxgiFormat::BC3_UNorm) | Some(ddsfile::DxgiFormat::BC3_UNorm_sRGB) => {
            let mut output = vec![0u32; (width * height) as usize];
            texture2ddecoder::decode_bc3(dds_data, width as usize, height as usize, &mut output)
                .map_err(|e| AppError::ImageDecode(format!("BC3 decode error: {e}")))?;
            u32_to_rgba8(&output)
        }
        Some(ddsfile::DxgiFormat::BC4_UNorm) => {
            let mut output = vec![0u32; (width * height) as usize];
            texture2ddecoder::decode_bc4(dds_data, width as usize, height as usize, &mut output)
                .map_err(|e| AppError::ImageDecode(format!("BC4 decode error: {e}")))?;
            u32_to_rgba8(&output)
        }
        Some(ddsfile::DxgiFormat::BC5_UNorm) => {
            let mut output = vec![0u32; (width * height) as usize];
            texture2ddecoder::decode_bc5(dds_data, width as usize, height as usize, &mut output)
                .map_err(|e| AppError::ImageDecode(format!("BC5 decode error: {e}")))?;
            u32_to_rgba8(&output)
        }
        Some(ddsfile::DxgiFormat::BC7_UNorm) | Some(ddsfile::DxgiFormat::BC7_UNorm_sRGB) => {
            let mut output = vec![0u32; (width * height) as usize];
            texture2ddecoder::decode_bc7(dds_data, width as usize, height as usize, &mut output)
                .map_err(|e| AppError::ImageDecode(format!("BC7 decode error: {e}")))?;
            u32_to_rgba8(&output)
        }
        Some(ddsfile::DxgiFormat::R8G8B8A8_UNorm) | Some(ddsfile::DxgiFormat::R8G8B8A8_UNorm_sRGB) => {
            dds_data.to_vec()
        }
        Some(ddsfile::DxgiFormat::B8G8R8A8_UNorm) | Some(ddsfile::DxgiFormat::B8G8R8A8_UNorm_sRGB) => {
            // Swizzle BGRA → RGBA
            let mut rgba = dds_data.to_vec();
            for chunk in rgba.chunks_exact_mut(4) {
                chunk.swap(0, 2);
            }
            rgba
        }
        other => {
            return Err(AppError::ImageDecode(format!(
                "Unsupported DDS format: {:?}",
                other
            )));
        }
    };

    // Convert u8 RGBA to f32 RGBA
    let data: Vec<f32> = rgba_u8.iter().map(|&b| b as f32 / 255.0).collect();

    Ok(RawImageBuffer::new(width, height, data, false))
}

/// Handle legacy D3D format DDS files.
fn decode_d3d(d3d: ddsfile::D3DFormat, dds_data: &[u8], width: u32, height: u32) -> Result<RawImageBuffer, AppError> {
    let rgba_u8 = match d3d {
        ddsfile::D3DFormat::DXT1 => {
            let mut output = vec![0u32; (width * height) as usize];
            texture2ddecoder::decode_bc1(dds_data, width as usize, height as usize, &mut output)
                .map_err(|e| AppError::ImageDecode(format!("DXT1 decode error: {e}")))?;
            u32_to_rgba8(&output)
        }
        ddsfile::D3DFormat::DXT3 => {
            let mut output = vec![0u32; (width * height) as usize];
            texture2ddecoder::decode_bc3(dds_data, width as usize, height as usize, &mut output)
                .map_err(|e| AppError::ImageDecode(format!("DXT3 decode error: {e}")))?;
            u32_to_rgba8(&output)
        }
        ddsfile::D3DFormat::DXT5 => {
            let mut output = vec![0u32; (width * height) as usize];
            texture2ddecoder::decode_bc3(dds_data, width as usize, height as usize, &mut output)
                .map_err(|e| AppError::ImageDecode(format!("DXT5 decode error: {e}")))?;
            u32_to_rgba8(&output)
        }
        ddsfile::D3DFormat::A8B8G8R8 => {
            dds_data.to_vec()
        }
        ddsfile::D3DFormat::A8R8G8B8 => {
            // Swizzle ARGB → RGBA: [A,R,G,B] → [R,G,B,A]
            let mut rgba = Vec::with_capacity(dds_data.len());
            for chunk in dds_data.chunks_exact(4) {
                rgba.push(chunk[1]); // R
                rgba.push(chunk[2]); // G
                rgba.push(chunk[3]); // B
                rgba.push(chunk[0]); // A
            }
            rgba
        }
        other => {
            return Err(AppError::ImageDecode(format!(
                "Unsupported D3D format: {:?}",
                other
            )));
        }
    };

    let data: Vec<f32> = rgba_u8.iter().map(|&b| b as f32 / 255.0).collect();
    Ok(RawImageBuffer::new(width, height, data, false))
}

/// Convert packed u32 RGBA pixels to u8 RGBA bytes.
/// texture2ddecoder outputs pixels as u32 in 0xAABBGGRR format.
fn u32_to_rgba8(pixels: &[u32]) -> Vec<u8> {
    let mut result = Vec::with_capacity(pixels.len() * 4);
    for &pixel in pixels {
        result.push((pixel & 0xFF) as u8);         // R
        result.push(((pixel >> 8) & 0xFF) as u8);   // G
        result.push(((pixel >> 16) & 0xFF) as u8);  // B
        result.push(((pixel >> 24) & 0xFF) as u8);  // A
    }
    result
}
