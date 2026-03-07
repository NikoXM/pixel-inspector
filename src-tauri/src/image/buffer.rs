use serde::Serialize;

/// Raw image buffer storing pixel data as f32 RGBA.
/// Each pixel is 4 consecutive f32 values: [R, G, B, A].
#[derive(Clone, Serialize)]
pub struct RawImageBuffer {
    pub width: u32,
    pub height: u32,
    /// Flat array of f32 pixels in RGBA order, length = width * height * 4
    pub data: Vec<f32>,
    /// Whether this image contains HDR data (values may exceed 0.0-1.0 range)
    pub is_hdr: bool,
    /// Original file path
    pub file_path: String,
    /// Original format name
    pub format_name: String,
}

impl RawImageBuffer {
    pub fn new(width: u32, height: u32, data: Vec<f32>, is_hdr: bool) -> Self {
        debug_assert_eq!(data.len(), (width as usize) * (height as usize) * 4);
        Self {
            width,
            height,
            data,
            is_hdr,
            file_path: String::new(),
            format_name: String::new(),
        }
    }

    /// Get pixel RGBA values at (x, y). Returns [R, G, B, A] as f32.
    pub fn get_pixel(&self, x: u32, y: u32) -> Option<[f32; 4]> {
        if x >= self.width || y >= self.height {
            return None;
        }
        let idx = ((y as usize) * (self.width as usize) + (x as usize)) * 4;
        Some([
            self.data[idx],
            self.data[idx + 1],
            self.data[idx + 2],
            self.data[idx + 3],
        ])
    }

    /// Total number of pixels
    pub fn pixel_count(&self) -> usize {
        (self.width as usize) * (self.height as usize)
    }

    /// Get a rectangular tile of pixel data as f32 RGBA.
    /// Returns the data for the region [x..x+w, y..y+h], clamped to image bounds.
    pub fn get_tile(&self, x: u32, y: u32, w: u32, h: u32) -> (u32, u32, Vec<f32>) {
        let x0 = x.min(self.width);
        let y0 = y.min(self.height);
        let x1 = (x + w).min(self.width);
        let y1 = (y + h).min(self.height);
        let tw = x1 - x0;
        let th = y1 - y0;

        let mut tile = Vec::with_capacity((tw as usize) * (th as usize) * 4);
        for row in y0..y1 {
            let start = ((row as usize) * (self.width as usize) + (x0 as usize)) * 4;
            let end = start + (tw as usize) * 4;
            tile.extend_from_slice(&self.data[start..end]);
        }
        (tw, th, tile)
    }
}
