const express = require('express');
const router = express.Router();
const { pipeline } = require('@xenova/transformers');
const fs = require('fs');
const path = require('path');
const User = require("../models/User");
const { cosineDistance } = require('./utils'); // Utility function for cosine similarity

// Set up model variables
let pipe = null;
const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2';
const MODEL_PATH = path.join(__dirname, './models', MODEL_NAME);

// Initialize the model
async function initializeModel() {
    try {
        // Check if model directory exists
        if (!fs.existsSync(MODEL_PATH)) {
            fs.mkdirSync(MODEL_PATH, { recursive: true });
        }
        
        // Load model
        pipe = await pipeline('feature-extraction', MODEL_NAME);
        console.log('Model loaded successfully');
    } catch (error) {
        console.error('Error loading model:', error);
        throw error;
    }
}

// Function to encode text using the transformer model
async function encodeText(texts) {
    // Ensure model is initialized before trying to use it
    if (!pipe) {
        await initializeModel();
    }
    
    try {
        const embeddings = [];
        
        for (const text of texts) {
            const result = await pipe(text, { pooling: 'mean', normalize: true });
            embeddings.push(Array.from(result.data));
        }
        
        return embeddings;
    } catch (error) {
        console.error('Error encoding text:', error);
        throw error;
    }
}

// Middleware to ensure model is loaded
const ensureModelLoaded = async (req, res, next) => {
    if (!pipe) {
        try {
            await initializeModel();
            next();
        } catch (error) {
            return res.status(500).json({ error: 'Failed to load model' });
        }
    } else {
        next();
    }
};

// Initialize model when the module is imported
initializeModel().catch(error => {
    console.error('Error during initial model loading:', error);
});

router.post('/recommend_technician', async (req, res) => {
    try {
        const { issue } = req.body;

        if (!issue) {
            return res.status(400).json({ error: 'Issue is required' });
        }

        // Step 1: Generate customer issue embedding
        const [customerEmbedding] = await encodeText([issue]);

        // Step 2: Aggregate vector search with rating sort
        
        const results = await User.aggregate([
            {
                $vectorSearch: {
                    index: "vectorIndex",
                    path: "embedding",
                    queryVector: customerEmbedding,
                   // filter:{is_online:true},
                    numCandidates: 50,
                    limit: 3
                }
            },
            {
                $project: {
                    name: 1,
                    phone: 1,
                    avg_rating: 1,
                    _id:1,
                    description:1,
                    score: { $meta: "vectorSearchScore" }
                }
            },
            {
                $sort: {
                    avg_rating: -1 // Sort by rating descending
                }
            },
            {
                $limit: 3 // Return top 3
            }
        ]);

        if (!results.length) {
            return res.status(404).json({ error: "No technician found" });
        }

        res.json({
            recommendations: results.map(tech => ({
                customer_issue: issue,
                recommended_technician: tech.name,
                contact: {
                    phone: tech.phone
                },
                description: tech.description,
                _id: tech._id,
                score: tech.score,
                rating: tech.avg_rating
            }))
        });

    } catch (error) {
        console.error("Error recommending technician:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

module.exports = { router, encodeText, initializeModel };