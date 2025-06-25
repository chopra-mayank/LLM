// server.js or routes/activities.js
import express from "express";
const router = express.Router();
import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

router.get('/activities', async (req, res) => {
  const { location } = req.query; // Get location from query parameters
  
  if (!location) {
    return res.status(400).json({ message: 'Location is required.' });
  }

  const tavilyApiKey = process.env.TAVILY_API_KEY;
  const query = `What are the top activities for tourists to do in ${location}, considering it is ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} in Udaipur, Rajasthan, India? Focus on unique cultural experiences, historical sites, and local attractions.`;
  try {
    const response = await axios.post(
      'https://api.tavily.com/search', 
      // Axios directly takes the JS object for the body, it will automatically stringify it to JSON
      {
        query: query,
        search_depth: 'advanced', 
        include_answer: true, 
        max_results: 5,
        // You can also add more context for better results, e.g.:
        // include_images: true,
        // include_raw_content: true,
        // include_citations: true,
        // You can specify more detailed context since the current location is Udaipur
        // prompt: `What are the top activities for tourists to do in ${location}, considering it is ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} in Udaipur, Rajasthan, India? Focus on unique cultural experiences, historical sites, and local attractions.`
      },
      // Headers go as the third argument in axios.post
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tavilyApiKey}`
        }
      }
    );

    // Axios response data is directly in `response.data`
    const data = response.data;

    // Axios throws an error for non-2xx status codes, so you typically don't need `if (!response.ok)`
    // The `catch` block will handle network errors and API errors (like 400, 401, 500)

    // Process Tavily results
    const activities = data.results.map(result => ({
      title: result.title,
      url: result.url,
      content: result.content
    }));

    // You can also include the Tavily-generated answer if available
    const answer = data.answer || "No specific answer found, but here are some links.";

    res.json({ answer, activities });

  } catch (error) {
    console.error('Error fetching activities:', error);
    // Axios errors have a `response` property for HTTP errors from the server
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Tavily API Error Response Data:', error.response.data);
      console.error('Tavily API Error Status:', error.response.status);
      console.error('Tavily API Error Headers:', error.response.headers);
      return res.status(error.response.status).json({ 
        message: error.response.data.message || 'Error from Tavily API',
        details: error.response.data.details || null // Include more details if Tavily provides them
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Tavily API Error Request:', error.request);
      return res.status(500).json({ message: 'No response received from Tavily API.' });
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Tavily API Error Message:', error.message);
      return res.status(500).json({ message: `Error setting up Tavily API request: ${error.message}` });
    }
  }
});

router.post('/act', async (req, res) => {
    const { location, preferences, duration } = req.body;   
  // Get data from the request body for POST requests
  
  
  
  if (!location) {
    return res.status(400).json({ message: 'Location is required.' });
  }

  const tavilyApiKey = process.env.TAVILY_API_KEY;

  // Construct a more dynamic and specific query for Tavily
  let query = `Top activities for tourists to do in ${location}`;

  if (preferences && preferences.length > 0) {
    query += ` with preferences like ${preferences.join(', ')}`;
  }
  if (duration) {
    query += ` for a duration of ${duration}`;
  }
  
  query += `. Provide a list of 5 to 10 distinct activities. Focus on unique cultural experiences, historical sites, and local attractions.`;


  try {
    const response = await axios.post(
      'https://api.tavily.com/search', 
      {
        query: query,
        search_depth: 'basic', // 'basic' is often sufficient, 'advanced' for deeper but slower search
        includeAnswer: 'advanced',
        max_results: 10, // Request up to 10 results from Tavily
        // You can add more context for Tavily if needed, e.g.,
        prompt: `Given the user's request for activities in ${location} with preferences: ${preferences.join(', ')} for a ${duration} trip, suggest specific points of interest and experiences.`
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tavilyApiKey}`
        }
      }
    );

    const data = response.data; // Axios data is directly in response.data

    // Process Tavily results
    const activities = data.results.map(result => ({
      title: result.title,
      url: result.url,
      content: result.content

    }));

    // Use Tavily's answer or create a fallback
    const answer = data.answer || "No specific summary found, but here are some recommended activities and links.";


    res.json({ answer, activities });

  } catch (error) {
    console.error('Error fetching activities:', error);
    if (error.response) {
      console.error('Tavily API Error Response Data:', error.response.data);
      console.error('Tavily API Error Status:', error.response.status);
      return res.status(error.response.status).json({ 
        message: error.response.data.message || 'Error from Tavily API',
        details: error.response.data.details || null 
      });
    } else if (error.request) {
      return res.status(500).json({ message: 'No response received from Tavily API.' });
    } else {
      return res.status(500).json({ message: `Error setting up Tavily API request: ${error.message}` });
    }
  }
});

router.post('/detailed-activities', async (req, res) => {
  const { location, preferences, duration } = req.body; 

  if (!location) {
    return res.status(400).json({ message: 'Location is required.' });
  }

  const tavilyApiKey = process.env.TAVILY_API_KEY;
  const initialSearchQuery = `Things to do in ${location}`;
  
  let detailedQuerySuffix = "";
  if (preferences && preferences.length > 0) {
    detailedQuerySuffix += ` focusing on ${preferences.join(' and ')}`;
  }
  if (duration) {
    detailedQuerySuffix += ` for a ${duration} trip`;
  }
//   detailedQuerySuffix += `. Provide 5 to 10 key points as short descriptions of activities, prioritizing unique cultural experiences, historical sites, and local attractions.`;

  try {
    
    const searchResponse = await axios.post(
      'https://api.tavily.com/search', 
      {
        query: initialSearchQuery + detailedQuerySuffix,
        search_depth: 'basic', 
        max_results: 7, // Get enough results to then extract from
        include_answer: true, 
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tavilyApiKey}`
        }
      }
    );

    const searchData = searchResponse.data;

    if (!searchData.results || searchData.results.length === 0) {
      return res.status(200).json({ 
        answer: searchData.answer || `No relevant links found for activities in ${location}.`,
        extractedActivities: [] 
      });
    }

  
    const urlsToExtract = searchData.results
      .filter(result => result.url && (result.url.startsWith('http://') || result.url.startsWith('https://')))
      .map(result => result.url)
      .slice(0, 5); 

    if (urlsToExtract.length === 0) {
        return res.status(200).json({
            answer: searchData.answer || `No suitable URLs found for extraction in ${location}.`,
            extractedActivities: []
        });
    }

    
    const extractResponse = await axios.post(
      'https://api.tavily.com/extract',
      {
        urls: urlsToExtract,
        include_images: false,
        format: "text"
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tavilyApiKey}`
        }
      }
    );

    const extractData = extractResponse.data;
    const extractedActivities = [];
    let extractionErrorOccurred = false;

   
    if (Array.isArray(extractData.results)) {
        extractData.results.forEach(item => {
            if (item.url && item.raw_content) {
                extractedActivities.push({ url: item.url, content: item.raw_content });
            } else if (item.error) {
                console.warn(`Error extracting content from ${item.url}:`, item.error);
                extractionErrorOccurred = true;
            }
        });
    } else if (extractData.raw_content && urlsToExtract.length === 1) { // Fallback for single URL response format
        extractedActivities.push({ url: urlsToExtract[0], content: extractData.raw_content });
    } else {
        console.warn('Unexpected Tavily Extract response format:', extractData);
        extractionErrorOccurred = true;
    }
    
   
    let finalAnswer = searchData.answer || `Here are some activity suggestions for ${location}:`;
    if (extractionErrorOccurred) {
        finalAnswer += " Note: Some content could not be fully extracted due to errors.";
    }

    res.json({ 
      answer: finalAnswer,
      extractedActivities: extractedActivities
    });

  } catch (error) {
    console.error('Error in detailed activities search:', error);
    if (error.response) {
      console.error('Tavily API Error Response Data:', error.response.data);
      console.error('Tavily API Error Status:', error.response.status);
      return res.status(error.response.status).json({ 
        message: error.response.data.message || 'Error from Tavily API',
        details: error.response.data.details || null 
      });
    } else if (error.request) {
      return res.status(500).json({ message: 'No response received from Tavily API.' });
    } else {
      return res.status(500).json({ message: `Error setting up Tavily API request: ${error.message}` });
    }
  }
});

router.post('/crawl-activities', async (req, res) => {
  const { location, preferences, duration } = req.body; 

  if (!location) {
    return res.status(400).json({ message: 'Location is required.' });
  }

  const tavilyApiKey = process.env.TAVILY_API_KEY;

  // Step 1: Use Tavily Search to find a good starting domain/URL for crawling
  let searchDomainQuery = `Official tourism website or comprehensive guide for activities in ${location}`;
  if (preferences && preferences.length > 0) {
    searchDomainQuery += ` focusing on ${preferences.join(' and ')}`;
  }
  // Adding duration might help narrow down the type of site if it implies short trips vs long stays
  if (duration) {
      searchDomainQuery += ` for a ${duration} duration`;
  }
  searchDomainQuery += `. Prioritize official tourism boards or well-known travel guides.`;

  try {
    const domainSearchResponse = await axios.post(
      'https://api.tavily.com/search', 
      {
        query: searchDomainQuery,
        search_depth: 'basic',
        max_results: 3, // Get top 3 results to pick the most suitable starting URL
        include_answer: true // Get a summary answer from the search
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tavilyApiKey}`
        }
      }
    );

    const domainSearchData = domainSearchResponse.data;
    if (!domainSearchData.results || domainSearchData.results.length === 0) {
      return res.status(200).json({ 
        summary: `Could not find a suitable website to crawl for activities in ${location}.`,
        crawledActivities: [] 
      });
    }

    // Attempt to find the most relevant URL to crawl.
    // A simple heuristic: take the first one. For more robust applications,
    // you might want to filter by domain (e.g., official .gov or .org sites).
    const baseUrlToCrawl = domainSearchData.results[0].url; 
    console.log(`Starting crawl from: ${baseUrlToCrawl}`);

    // Step 2: Use Tavily Crawler on the identified URL
    const crawlResponse = await axios.post(
      'https://api.tavily.com/crawl',
      {
        url: baseUrlToCrawl,
        crawl_depth: 2, // User requested depth 1
        include_raw_content: true, // User requested text format
        // limit: 5 // Optional: Limit the number of pages crawled within the domain for this depth
        // You could also add `instructions` here to guide the crawler, e.g.,
        instructions: "Extract information about tourist activities and attractions."
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tavilyApiKey}`
        }
      }
    );

    const crawlData = crawlResponse.data;
    const crawledPagesContent = [];

    if (Array.isArray(crawlData.results)) {
        crawlData.results.forEach(page => {
            if (page.url && page.content) { // Crawler returns 'content' for raw text
                crawledPagesContent.push({ url: page.url, content: page.content });
            }
        });
    } else {
        // Fallback: If only a single page was crawled, Tavily might return it directly (not in an array)
        if (crawlData.url && crawlData.content) {
            crawledPagesContent.push({ url: crawlData.url, content: crawlData.content });
        }
    }

    // Combine Tavily's summary answer from the initial search (if any)
    let finalSummary = domainSearchData.answer || `Information for activities in ${location} crawled from ${baseUrlToCrawl}:`;
    
    if (crawledPagesContent.length === 0) {
        finalSummary += " Note: No relevant content was extracted from the crawled pages at depth 1, or the initial page itself yielded no content.";
    } else {
        finalSummary += ` Found content from ${crawledPagesContent.length} pages within ${baseUrlToCrawl}.`;
        // --- LLM Integration Point (for "data in points") ---
        // To get "data in points" from the raw 'content' of `crawledPagesContent`,
        // you would send this content to an LLM (e.g., Google's Gemini, OpenAI's GPT).
        // Example (conceptual, requires actual LLM API calls):
        // const combinedCrawledText = crawledPagesContent.map(p => p.content).join('\n\n---\n\n');
        // const llmResponse = await llmApi.summarize({
        //     prompt: `Summarize the following text into key tourist activities, attractions, and points of interest for ${location}. Present them as a bulleted list:\n\n${combinedCrawledText}`,
        //     max_tokens: 500
        // });
        // const pointsOfInterest = llmResponse.text; // Or similar
        // You would then send these `pointsOfInterest` in the response instead of raw content
        // For now, we are sending the raw text as requested by "format will be text".
    }

    res.json({ 
      summary: finalSummary,
      crawledActivities: crawledPagesContent // This will contain raw text content from the crawled pages
    });

  } catch (error) {
    console.error('Error in crawler-based activities search:', error);
    if (error.response) {
      console.error('Tavily API Error Response Data:', error.response.data);
      console.error('Tavily API Error Status:', error.response.status);
      return res.status(error.response.status).json({ 
        message: error.response.data.message || 'Error from Tavily API',
        details: error.response.data.details || null 
      });
    } else if (error.request) {
      return res.status(500).json({ message: 'No response received from Tavily API (network issue).' });
    } else {
      return res.status(500).json({ message: `Error setting up Tavily API request: ${error.message}` });
    }
  }
});

export default router;