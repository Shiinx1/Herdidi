import * as fs from 'fs';
import * as csv from 'csv-writer';
import puppeteer from "puppeteer"

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const csvWriter = csv.createObjectCsvWriter({
	path: 'herdidi.csv',
	header: [
		{ id: 'nop', title: 'Nop' },
		{ id: 'tahun', title: 'Tahun' },
		{ id: 'namawp', title: 'Nama WP' },
		{ id: 'luastanah', title: 'Luas Tanah' },
		{ id: 'njoptanah', title: 'NJOP Tanah' },
		{ id: 'luasbng', title: 'Luas Bng' },
		{ id: 'njopbng', title: 'NJOP Bng' },
		{ id: 'ketetapan', title: 'Ketetapan' },
		{ id: 'statusbayar', title: 'Status Bayar' }
	]
});

// Setups
const nopList = fs.readFileSync('noplist.txt', 'utf8').toString().split('\r');

const loginURL = `https://bphtb.tangerangkota.go.id/login`
const baseURL = `https://bphtb.tangerangkota.go.id/bphtb_tangerang/objek_pajak/?nop=`;

const format = [];
const newPage = [];

async function main(show){
	console.log('Starting.');
	const browser = await puppeteer.launch({
		headless: show,
		args: ['--disable-notifications --window-size=1280,720'],
      	defaultViewport: {
        	width: 1280,
        	height: 720
      	}
	})

	const page = await browser.newPage();

	await login(page, false);
	await getRow(browser, '2023', nopList.reverse());
}

async function login(page, cookieBox=false){
	await page.goto(loginURL);
	await page.setDefaultNavigationTimeout(0);

	const loginID = '#frmlogin > fieldset > div:nth-child(2) > div > div > input[type=text]';
	const loginPW = '#frmlogin > fieldset > div:nth-child(3) > div > div > input[type=password]';
	await page.waitForSelector(loginID);
	await page.waitForSelector(loginPW);

	await page.type(loginID, 'user');
	await page.type(loginPW, 'password');

	await page.click('#frmlogin > fieldset > div:nth-child(4) > div > button');
	await page.waitForSelector('body > div.content > div > div.well > center > div > div > div > div.span8 > center > h3:nth-child(3)');
}

// Selectors for data
const yearDropdown = "#datatable > thead > tr > th:nth-child(1)";
const nopSelector = "body > div.content > div > div.row > div:nth-child(1) > div.form-horizontal > div:nth-child(1) > div > label";
const tahun = "#datatable > tbody > tr:nth-child(1) > td.sorting_1";
const namaWP = "#datatable > tbody > tr:nth-child(1) > td:nth-child(2)";
const luasTanah = "#datatable > tbody > tr:nth-child(1) > td:nth-child(3)";
const njopTanah = "#datatable > tbody > tr:nth-child(1) > td:nth-child(4)";
const luasBng = "#datatable > tbody > tr:nth-child(1) > td:nth-child(5)";
const njopBng = "#datatable > tbody > tr:nth-child(1) > td:nth-child(6)";
const ketetapan = "#datatable > tbody > tr:nth-child(1) > td:nth-child(7)";
const statusBayar = "#datatable > tbody > tr:nth-child(1) > td:nth-child(8)";

async function getRow(browser, year, nopList){
	await nopList.forEach(async nopURL => {
		newPage[nopURL] = await browser.newPage();
		await newPage[nopURL].setDefaultNavigationTimeout(0);
		await newPage[nopURL].goto(baseURL+nopURL);

		// Wait to find year dropdown
		await newPage[nopURL].waitForSelector(yearDropdown);
		await newPage[nopURL].click(yearDropdown);

		// rows
		let nopE = await newPage[nopURL].$(nopSelector);
		let nopV = await newPage[nopURL].evaluate(el => el.textContent, nopE);

		let tahunE = await newPage[nopURL].$(tahun);
		let tahunV = await newPage[nopURL].evaluate(el => el.textContent, tahunE);

		let namaWPE = await newPage[nopURL].$(namaWP);
		let namaWPV = await newPage[nopURL].evaluate(el => el.textContent, namaWPE);

		let luasTanahE = await newPage[nopURL].$(luasTanah);
		let luasTanahV = await newPage[nopURL].evaluate(el => el.textContent, luasTanahE);

		let njopTanahE = await newPage[nopURL].$(njopTanah);
		let njopTanahV = await newPage[nopURL].evaluate(el => el.textContent, njopTanahE);

		let luasBngE = await newPage[nopURL].$(luasBng);
		let luasBngV = await newPage[nopURL].evaluate(el => el.textContent, luasBngE);

		let njopBngE = await newPage[nopURL].$(njopBng);
		let njopBngV = await newPage[nopURL].evaluate(el => el.textContent, njopBngE);

		let ketetapanE = await newPage[nopURL].$(ketetapan);
		let ketetapanV = await newPage[nopURL].evaluate(el => el.textContent, ketetapanE);

		let statusBayarE = await newPage[nopURL].$(statusBayar);
		let statusBayarV = await newPage[nopURL].evaluate(el => el.textContent, statusBayarE);

		// Push into Array a JSON Object then close tab
		console.log(`${nopV.replace(': ', '')} - ${tahunV} - ${namaWPV} - ${luasTanahV} - ${njopTanahV} - ${luasBngV} - ${njopBngV} - ${ketetapanV} - ${statusBayarV}`);

		await format.push({
			'nop': nopV.replace(': ', ''),
			'tahun': tahunV,
			'namawp': namaWPV,
			'luastanah': luasTanahV,
			'njoptanah': njopTanahV,
			'luasbng': luasBngV,
			'njopbng': njopBngV,
			'ketetapan': ketetapanV,
			'statusbayar': statusBayarV
		});

		await newPage[nopURL].close();
		if (format.length == nopList.length) return exportCsv();
	})
}

async function exportCsv(){
	await csvWriter.writeRecords(format);
	console.log('Done!');
}


main(false);