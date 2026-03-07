use rayon::prelude::*;

/// Tone mapping operator types
#[derive(Clone, Copy, Debug, serde::Deserialize, serde::Serialize)]
pub enum ToneMapOperator {
    Linear,
    Reinhard,
    Aces,
    AgX,
}

/// Apply tone mapping to HDR pixel data (in-place on a copy).
/// Input/output are f32 RGBA arrays. Alpha is preserved unchanged.
pub fn tone_map(data: &[f32], operator: ToneMapOperator, exposure: f32) -> Vec<f32> {
    let exposure_mul = 2.0f32.powf(exposure);
    let mut output = data.to_vec();

    // Process 4 floats (one pixel) at a time, in parallel chunks
    output.par_chunks_mut(4).for_each(|pixel| {
        // Apply exposure
        pixel[0] *= exposure_mul;
        pixel[1] *= exposure_mul;
        pixel[2] *= exposure_mul;
        // Alpha unchanged

        match operator {
            ToneMapOperator::Linear => {
                pixel[0] = pixel[0].clamp(0.0, 1.0);
                pixel[1] = pixel[1].clamp(0.0, 1.0);
                pixel[2] = pixel[2].clamp(0.0, 1.0);
            }
            ToneMapOperator::Reinhard => {
                pixel[0] = pixel[0] / (1.0 + pixel[0]);
                pixel[1] = pixel[1] / (1.0 + pixel[1]);
                pixel[2] = pixel[2] / (1.0 + pixel[2]);
            }
            ToneMapOperator::Aces => {
                for c in 0..3 {
                    let x = pixel[c];
                    // ACES filmic approximation (Narkowicz 2015)
                    pixel[c] = ((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14))
                        .clamp(0.0, 1.0);
                }
            }
            ToneMapOperator::AgX => {
                // Simplified AgX tone mapping
                for c in 0..3 {
                    let x = pixel[c].max(0.0);
                    // AgX-inspired sigmoid
                    let compressed = x / (x + 1.0);
                    // Apply contrast curve
                    pixel[c] = (1.0 - (-compressed * 6.0).exp()).clamp(0.0, 1.0);
                }
            }
        }
    });

    output
}
