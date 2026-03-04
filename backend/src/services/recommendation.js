const Event = require("../models/event");

async function recommendEvents(userId) {
  // simple version: recommend latest or similar events
  return Event.find().limit(5);
}

async function recommendLocations(userId) {
  // placeholder logic
  return [];
}

module.exports = {
  recommendEvents,
  recommendLocations
};
