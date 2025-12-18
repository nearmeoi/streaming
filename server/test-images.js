import * as cheerio from 'cheerio';

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

        const targetId = '41000119532';
        console.log(`--- INSPECTING ID: ${targetId} ---`);

        $(`a[href*="${targetId}"]`).each((i, el) => {
            const $link = $(el);
            console.log(`\nMatch ${i} link text: [${$link.text().trim()}]`);
            console.log(`Link href: ${$link.attr('href')}`);

            let current = $link;
            for (let depth = 0; depth < 5; depth++) {
                current = current.parent();
                if (!current.length) break;
                console.log(`Depth ${depth + 1} tag: ${current[0].name}, class: ${current.attr('class')}`);
                const imgs = current.find('img');
                if (imgs.length > 0) {
                    console.log(`  Found ${imgs.length} images at this depth:`);
                    imgs.each((j, imgEl) => {
                        console.log(`    Img ${j} attrs:`, JSON.stringify(imgEl.attribs));
                    });
                }
            }
        });

    } catch (e) {
        console.error(e);
    }
}

test();
