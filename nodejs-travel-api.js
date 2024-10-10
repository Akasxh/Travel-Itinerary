const express = require('express');
const bodyParser = require('body-parser');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());

// AWS Configuration
AWS.config.update({
  region: 'YOUR_AWS_REGION',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'user_trips';

// Helper function to generate itinerary (placeholder for ML model)
function generateItinerary(userPreferences, travelMatePreferences) {
  // This is where you'd integrate your ML model for generating itineraries
  // For now, we'll return a placeholder itinerary
  return {
    destination: 'Tokyo',
    activities: ['Visit Senso-ji Temple', 'Explore Shibuya Crossing', 'Tour the Imperial Palace'],
    accommodations: 'Shinjuku Washington Hotel',
    transportation: 'Tokyo Metro',
    estimatedCost: 150000
  };
}

// API Endpoints
app.post('/api/itinerary', async (req, res) => {
  const { userId, preferences, travelMatePreferences } = req.body;

  try {
    // Retrieve user's past trips
    const pastTrips = await getPastTrips(userId);

    // Generate itinerary
    const itinerary = generateItinerary(preferences, travelMatePreferences);

    // Save the new trip
    await saveTrip(userId, itinerary);

    res.json({ 
      message: 'Itinerary generated successfully',
      itinerary,
      pastTrips
    });
  } catch (error) {
    console.error('Error generating itinerary:', error);
    res.status(500).json({ error: 'Failed to generate itinerary' });
  }
});

app.get('/api/user/:userId/trips', async (req, res) => {
  const { userId } = req.params;

  try {
    const pastTrips = await getPastTrips(userId);
    res.json(pastTrips);
  } catch (error) {
    console.error('Error retrieving past trips:', error);
    res.status(500).json({ error: 'Failed to retrieve past trips' });
  }
});

// Database operations
async function getPastTrips(userId) {
  const params = {
    TableName: TABLE_NAME,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    }
  };

  const result = await dynamodb.query(params).promise();
  return result.Items;
}

async function saveTrip(userId, itinerary) {
  const params = {
    TableName: TABLE_NAME,
    Item: {
      userId: userId,
      tripId: uuidv4(),
      itinerary: itinerary,
      createdAt: new Date().toISOString()
    }
  };

  await dynamodb.put(params).promise();
}

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
