import { JSDOM } from 'jsdom';
import NodeFetchCache, { FileSystemCache } from 'node-fetch-cache';

async function fetchZillowData(url) {
    const fetch = NodeFetchCache.create({
        cache: new FileSystemCache(),
    });

    try {
        const response = await fetch(`https://api.scraperapi.com/?api_key=${process.env.SCRAPERAPI_KEY}&url=${url}`);
        const htmlData = await response.text();
        const dom = new JSDOM(htmlData);
        const nextData= JSON.parse(dom.window.document.querySelector("#__NEXT_DATA__").textContent);
        return nextData.props.pageProps.searchPageState.cat1.searchResults.listResults;
    } catch (error) {
        console.error(error);
        return null; // Return null or a specific error message
    }
}

const server = Bun.serve({
    port: 3000,
    static: {
        "/": new Response("Hello Automation"),
    },
    async fetch(req) {
        const url = new URL(req.url);
        if (url.pathname === "/zillow-scraper") {
            const zillowData = await fetchZillowData('https://zillow.com/homes/sold/14_days/10023_rb');
            if (zillowData) {
                return new Response(JSON.stringify(zillowData), {
                    headers: { "Content-Type": "application/json" }
                });
            } else {
                return new Response("Error fetching data", { status: 500 });
            }
        }
        return new Response("404 Not Found", { status: 404 });
    }
});

console.log(`Listening on localhost:${server.port}`);