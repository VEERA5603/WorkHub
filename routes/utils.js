// utils.js
/**
 * Calculate cosine distance between two vectors
 * @param {Array} a - First vector
 * @param {Array} b - Second vector
 * @returns {number} - Cosine distance between vectors
 */
function cosineDistance(a, b) {
    if (a.length !== b.length) {
        throw new Error('Vectors must have the same length');
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    
    if (normA === 0 || normB === 0) {
        return 1.0; // Maximum distance for zero vectors
    }
    
    return 1.0 - (dotProduct / (Math.sqrt(normA) * Math.sqrt(normB)));
}

module.exports = {
    cosineDistance
};