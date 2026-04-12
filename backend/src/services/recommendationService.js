const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const cityDistances = {
    tunis:    { tunis: 0,   sousse: 140, sfax: 270, monastir: 160, bizerte: 65,  nabeul: 60,  kairouan: 180, gabes: 380 },
    sousse:   { tunis: 140, sousse: 0,   sfax: 130, monastir: 20,  bizerte: 200, nabeul: 100, kairouan: 60,  gabes: 250 },
    sfax:     { tunis: 270, sousse: 130, sfax: 0,   monastir: 110, bizerte: 330, nabeul: 220, kairouan: 130, gabes: 130 },
    monastir: { tunis: 160, sousse: 20,  sfax: 110, monastir: 0,   bizerte: 220, nabeul: 110, kairouan: 70,  gabes: 260 },
    bizerte:  { tunis: 65,  sousse: 200, sfax: 330, monastir: 220, bizerte: 0,   nabeul: 100, kairouan: 240, gabes: 440 },
    nabeul:   { tunis: 60,  sousse: 100, sfax: 220, monastir: 110, bizerte: 100, nabeul: 0,   kairouan: 140, gabes: 330 },
    kairouan: { tunis: 180, sousse: 60,  sfax: 130, monastir: 70,  bizerte: 240, nabeul: 140, kairouan: 0,   gabes: 200 },
    gabes:    { tunis: 380, sousse: 250, sfax: 130, monastir: 260, bizerte: 440, nabeul: 330, kairouan: 200, gabes: 0   },
};

const getDistance = (cityA, cityB) => {
    const a = (cityA || "").toLowerCase().trim();
    const b = (cityB || "").toLowerCase().trim();
    return cityDistances[a]?.[b] ?? cityDistances[b]?.[a] ?? 9999;
};

const filterBySearch = (listings, searchTerm) => {
    if (!searchTerm) return listings;
    const filtered = listings.filter(l =>
        (l.title || "").toLowerCase().includes(searchTerm) ||
        (l.category || "").toLowerCase().includes(searchTerm)
    );
    return filtered.length > 0 ? filtered : listings;
};

const splitByLocation = (listings, userLocation) => {
    if (!userLocation) return { sameLocation: [], otherLocation: listings };

    const sameLocation = listings.filter(l =>
        (l.location || "").toLowerCase().includes(userLocation) ||
        userLocation.includes((l.location || "").toLowerCase())
    );
    const otherLocation = listings
        .filter(l => !sameLocation.includes(l))
        .sort((a, b) =>
            getDistance(userLocation, a.location) -
            getDistance(userLocation, b.location)
        );

    return { sameLocation, otherLocation };
};

const askGemini = async (candidates, slotsLeft, userLocation, historyCategories) => {
    const prompt = `You are a recommendation engine for an event planning platform called Axia.

User profile:
- Location: ${userLocation || "unknown"}
- Past event service categories: ${historyCategories.length > 0 ? historyCategories.join(", ") : "none"}

Pick the best ${slotsLeft} listings from the candidates below to complement the user's local services.

Candidates:
${JSON.stringify(candidates, null, 2)}

Ranking priorities:
1. Prefer listings whose category matches the user's past event categories.
2. Prefer variety over duplicates.

Respond ONLY with a valid JSON array (no markdown, no explanation):
[
  { "id": "<listing _id>", "reason": "<one concise sentence>" }
]`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    let result;
    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            result = await model.generateContent(prompt);
            break;
        } catch (err) {
            if (err.status === 503 && attempt < 3) {
                await new Promise(r => setTimeout(r, attempt * 1500));
            } else {
                throw err;
            }
        }
    }

    const rawText = result.response.text().trim();
    const jsonText = rawText.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/, "").trim();

    try {
        return JSON.parse(jsonText);
    } catch {
        return [];
    }
};

module.exports = { filterBySearch, splitByLocation, askGemini };
