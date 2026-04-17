# MongoDB Database Schema & Integration Guide

This document outlines the data structures actively maintained in MongoDB `tweet_analyzer_db` under the `analysis_history` collection.

## 1. Single Text Analysis (Custom Input Mode)

Whenever users interact with the `/analyze` endpoint using standard text snippets, the system will inject the following document footprint:

```json
{
  "_id": ObjectId("647a4f89d34c..."),
  
  // High-Level Setup
  "input_type": "custom_text",
  "input_value": "I really enjoyed this new policy update and feel optimistic.",
  "timestamp": ISODate("2026-04-09T12:05:01Z"),
  
  // Predictive Outcomes
  "sentiment": "positive",
  "confidence": 98.45,
  "misinformation": "Low"
}
```

## 2. Twitter Batch Processing

When the dashboard requests a live user fetch against the `/fetch_tweet` endpoint, the system captures multiple tweets matching the target username. Every tweet parses through the Scikit-Learn SVM independently, and results are bound into an Object Array.

```json
{
  "_id": ObjectId("648b2d18r21f..."),
  
  // High-Level Setup
  "input_type": "twitter_username",
  "input_value": "elonmusk",
  "timestamp": ISODate("2026-04-09T18:14:22Z"),
  
  // Averaged Global Prediction
  "sentiment": "negative",
  "confidence": 100.0,
  "misinformation": "High",
  
  // Nested Batch Information
  "batch_tweets": [
    {
      "text": "First tweet text here...",
      "author": "@elonmusk",
      "sentiment": "neutral",
      "confidence": 62.4,
      "misinformation": "Low"
    },
    {
      "text": "Angry tweet spreading false news here...",
      "author": "@elonmusk",
      "sentiment": "negative",
      "confidence": 94.1,
      "misinformation": "High"
    }
  ]
}
```

## 3. Querying & Validating

The active integration features fallbacks (`try...except`). If MongoDB drops connectivity, the Python app will catch `mongo_client.server_info()` failures and revert routing to its static memory dictionaries without blocking user traffic.

**Aggregate Stats Visualization (/stats)**
Uses the MongoDB pipeline framework to compute rapid aggregation graphs without looping objects locally.
```javascript
db.analysis_history.aggregate([
  { $group: { _id: "$sentiment", count: { $sum: 1 } } }
])
```
