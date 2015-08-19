#version 440

#define CAM_RES    800                  // Camera sensor resolution
#define MAX_FRAMES 30                   // Max. number of frames before convergence is achieved
#define SAFE       restrict coherent    // Assume coherency within shader, enforce it between shaders

// Vars IN >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

uniform int        exposure;            // Exposure time
uniform int        frame_id;            // Frame index, is set to zero on reset
uniform sampler2D  vol_comp;            // Subsampled volume contribution (radiance)
uniform SAFE layout(rgba32f) image2D accum_buffer;  // Accumulation buffer

// Vars OUT >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

layout (location = 0) out vec4 frag_col;

// Implementation >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

// Returns the color value from the accumulation buffer
vec4 readFromAccumBuffer() {
    return imageLoad(accum_buffer, ivec2(gl_FragCoord.xy));
}

// Writes the color value to the accumulation buffer
void writeToAccumBuffer(in const vec4 color) {
    imageStore(accum_buffer, ivec2(gl_FragCoord.xy), color);
}

void main() {
    // Read surface contribution
    frag_col = readFromAccumBuffer();
    if (frame_id < MAX_FRAMES) {
        // Add subsampled volume contribution
        frag_col.rgb += texture(vol_comp, gl_FragCoord.xy / CAM_RES).rgb;
        // Store the final value
        writeToAccumBuffer(frag_col);
    } else {
        // Do nothing; accumulation buffer values are final
    }
    // Perform tone mapping
    frag_col.rgb = vec3(1.0) - exp(-exposure * frag_col.rgb);
}