import * as cheerio from 'cheerio';
import fs from 'fs';

async function test() {
    try {
        const response = await fetch('https://www.dramaboxdb.com/in', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept-Language': 'id-ID,id;q=0.9'
            }
        });
        const html = await response.text();
        const $ = cheerio.load(html);

        const nextDataScript = $('#__NEXT_DATA__').html();
        if (nextDataScript) {
            const data = JSON.parse(nextDataScript);
            const pageProps = data.props.pageProps;

            console.log('--- NEXT DATA ANALYSIS ---');

            if (pageProps.bigList) {
                console.log('FEATURED (bigList):', pageProps.bigList.length);
                pageProps.bigList.slice(0, 2).forEach(item => {
                    console.log(`  - ${item.bookName} (${item.bookId}) -> ${item.cover}`);
                });
            }

            if (pageProps.smallData) {
                console.log('SECTIONS (smallData):');
                Object.keys(pageProps.smallData).forEach(key => {
                    const section = pageProps.smallData[key];
                    console.log(`  - Key ${key}: [${section.title || 'Untitled'}] Items: ${section.list?.length || 0}`);
                    if (section.list && section.list.length > 0) {
                        console.log(`    Sample: ${section.list[0].bookName} (${section.list[0].bookId}) -> ${section.list[0].cover}`);
                    }
                });
            }
        } else {
            console.log('__NEXT_DATA__ script not found');
        }
    } catch (e) {
        console.error(e);
    }
}

test();
